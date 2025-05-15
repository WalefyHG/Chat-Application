from django.db import models
from django.utils.translation import gettext_lazy as _
from modules.users.models import User

class ChatRoom(models.Model):
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user1')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user2')
    
    last_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_room_last_user')
    
    @property
    def room_name(self):
        sorted_ids = sorted([self.user1.id, self.user2.id])
        return f'{sorted_ids[0]}_{sorted_ids[1]}'
    
    @staticmethod
    def get_room_by_name(user1, user2):
        sorted_ids = sorted([user1.id, user2.id])
        room_name = f'{sorted_ids[0]}_{sorted_ids[1]}'
        
        room = ChatRoom.objects.filter(
            user1_id=sorted_ids[0], user2_id=sorted_ids[1]
        ).first()
        
        if not room:
            room = ChatRoom.objects.create(user1=user1, user2=user2)
        
        return room
    
class ChatMessage(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    content = models.TextField()
    read = models.BooleanField(default=False)
    
    last_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_message_last_user_message')
    
    
    def __str__(self):
        return f'{self.user.username} : {self.content}'