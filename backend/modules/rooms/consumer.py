import json
from channels.generic.websocket import AsyncWebsocketConsumer
from modules.users.models import User
from modules.rooms.models import ChatRoom, ChatMessage
from django.contrib.auth import get_user_model
from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
from django.core.exceptions import ObjectDoesNotExist
from ninja_jwt.authentication import JWTAuth



class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user', None)
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        self.room = await self.get_or_create_room(self.user, self.room_name)
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        messages = await self.get_previous_messages(self.room)
        await self.send(text_data=json.dumps({
            'type': 'previous_messages',
            'messages': messages
        }))
        
        await self.mark_messages_as_read(self.room)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type', 'message')
        print(f"Received message type: {message_type}")
        print(f"Received data: {data}")
        
        if message_type == 'message':
            if not self.user or not await self.is_user_authenticated(self.user):
                await self.send(text_data=json.dumps({
                    'error': 'User not authenticated'
                }))
                return

            room = await self.get_or_create_room(self.user, self.room_name)
            message = await self.create_message(self.user, room, data['message'])
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message.content,
                    'username': self.user.username,
                    'timestamp': str(message.timestamp),
                    'id': message.id,
                    'read': message.read
                }
            )
        elif message_type == 'typing':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_typing',
                    'username': self.user.username,
                }
            )
        elif message_type == 'stop_typing':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_stop_typing',
                    'username': self.user.username,
                }
            )
        elif message_type == 'mark_as_read':
            message_id = int(data.get('message_id', 0))
            await self.mark_message_as_read(message_id)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'mark_as_read',
                    'message_id': message_id,
                }
            )

    async def chat_message(self, event):
        message = event['message']
        username = event['username']
        timestamp = event['timestamp']
        message_id = event['id']
        read = event['read']

        await self.send(text_data=json.dumps({
            'message': message,
            'username': username,
            'timestamp': timestamp,
            'id': message_id,
            'read': read
        }))

    async def user_typing(self, event):
        username = event['username']

        await self.send(text_data=json.dumps({
            'type': 'typing',
            'username': username
        }))

    async def user_stop_typing(self, event):
        username = event['username']

        await self.send(text_data=json.dumps({
            'type': 'stop_typing',
            'username': username
        }))

    async def mark_as_read(self, event):
        message_id = event['message_id']
        await self.send(text_data=json.dumps({
            'type': 'mark_as_read',
            'message_id': message_id
        }))

    @database_sync_to_async
    def get_or_create_room(self, user, room_name):
        user_ids = list(map(int, room_name.split('_')))
        user1 = User.objects.get(id=user_ids[0])
        user2 = User.objects.get(id=user_ids[1])
        return ChatRoom.get_room_by_name(user1, user2)

    @database_sync_to_async 
    def create_message(self, user, room, message):
        print(f"Creating message: {message}")
        return ChatMessage.objects.create(user=user, room=room, content=message)

    @database_sync_to_async
    def is_user_authenticated(self, user):
        return user.is_active

    @database_sync_to_async
    def get_previous_messages(self, room):
        messages = ChatMessage.objects.filter(room=room).order_by('timestamp')
        return [
            {
                'id': message.id,
                'username': message.user.username,
                'message': message.content,
                'timestamp': str(message.timestamp),
                'read': message.read
            }
            for message in messages
        ]
        
    @database_sync_to_async
    def mark_messages_as_read(self, room):
        return ChatMessage.objects.filter(room=room, read=False).update(read=True)
    
    @database_sync_to_async
    def mark_message_as_read(self, message_id):
        message = ChatMessage.objects.get(id=message_id)
        message.read = True
        message.save()