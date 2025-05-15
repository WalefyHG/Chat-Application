# Repository

from typing import Dict
from core.utils import omitted_fields
from core.utils.changes import Repository
from.models import User
from django.contrib.auth.hashers import make_password
from django.db import models
class UserRepository(Repository):
    
    model = User
    
    @classmethod
    def hash_password(cls, password: str) -> str:
        return make_password(password)
    
    
    @classmethod
    def update_payload(cls, *, payload: Dict, last_user_id, **kwargs) -> Dict:
        
        updated_payload = super().update_payload(
            payload=payload,
            last_user_id=last_user_id,
        )
        
        updated_payload.pop('last_user_id', None)
        
        if 'password' in updated_payload:
            updated_payload['password'] = cls.hash_password(updated_payload['password'])
            
        return updated_payload
    
    
    