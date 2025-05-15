from django.utils import timezone as django_timezone
from django.shortcuts import get_object_or_404
from ninja_extra import route, api_controller
from ninja.errors import HttpError  # ✅ Correção aqui
from .schemas import ChatMessageIn, ChatMessageResponse
from .models import ChatMessage, ChatRoom
from modules.users.models import User
from ninja_jwt.authentication import JWTAuth
from datetime import datetime

@api_controller(
    'chat/',
    tags=["Chat"],
    auth=JWTAuth(),
)
class ChatController:
    
    @route.post('message', response={200: ChatMessageResponse, 404: str})
    def send_message(self, request, data: ChatMessageIn):
        sender = request.auth
        recipient = User.objects.filter(id=data.recipient_id).first()
        
        if not recipient:
            raise HttpError(404, "Recipient not found")  # ✅ Correção aqui
        
        room = ChatRoom.objects.filter(user1=sender, user2=recipient).first() or \
            ChatRoom.objects.filter(user1=recipient, user2=sender).first()
        
        if not room:
            room = ChatRoom.objects.create(user1=sender, user2=recipient)
        
        message = ChatMessage.objects.create(
            user=sender,
            room=room,
            content=data.content,
            timestamp=datetime.now().astimezone(django_timezone.get_current_timezone()),
        )
        
        response = ChatMessageResponse(
            id=message.id,
            content=message.content,
            timestamp=message.timestamp,
            sender=message.user,
            room=message.room.room_name,
        )
        
        return response

    @route.get('messages', response={200: list[ChatMessageResponse], 404: str})
    def get_messages(self, request, room_name: str):
        users_ids = room_name.split("_")
        
        if len(users_ids) != 2:
            raise HttpError(404, "Invalid room name format")  # ✅ Correção aqui
        
        try:
            user1_id, user2_id = map(int, users_ids)
        except ValueError:
            raise HttpError(404, "Invalid user ID format")  # ✅ Validação extra

        user1 = User.objects.filter(id=user1_id).first()
        user2 = User.objects.filter(id=user2_id).first()
        
        if not user1 or not user2:
            raise HttpError(404, "Users not found")  # ✅ Correção aqui
        
        room = ChatRoom.objects.filter(user1=user1, user2=user2).first() or \
            ChatRoom.objects.filter(user1=user2, user2=user1).first()
            
        if not room:
            room = ChatRoom.objects.create(user1=user1, user2=user2)
            
        messages = ChatMessage.objects.filter(room=room).select_related('user').order_by('timestamp')
        
        return [
            ChatMessageResponse(
                id=msg.id,
                content=msg.content,
                timestamp=msg.timestamp,
                sender=msg.user,
                room=room.room_name,
            )
            for msg in messages
        ]
