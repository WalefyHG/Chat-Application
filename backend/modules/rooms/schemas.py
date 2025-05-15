from ninja import Schema
from typing import List
from datetime import datetime
from modules.users.schemas import UserOutSchema



class ChatMessageIn(Schema):
    recipient_id: int
    content: str

class ChatMessageResponse(Schema):
    id: int
    content: str
    sender: UserOutSchema
    room: str
    timestamp: datetime
    
class ChatRoomOut(Schema):
    id: int
    users: List[int]
    messages: List[ChatMessageResponse]