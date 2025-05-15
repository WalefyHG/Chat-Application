# Services

from typing import Any, Dict, Optional, Tuple
from core.utils.changes import Services
from .repository import UserRepository
from ninja_extra import status
from core.utils.regex.regex_character import special_characters_pattern, email_pattern
from django.db.models import Model

class UserService(Services):
    
    repository = UserRepository
    
    @classmethod
    def validate_payload(
        cls, *, payload: Dict[str, Any], id: Optional[int] = None, **kwargs    
    ) -> Tuple[Dict[int, Any], Dict[str, Any]]:
        
        user: Optional[Model] = None
        
        username = payload.get('username', None)
        password = payload.get('password', None)
        email = payload.get('email', None)
        
        if id is not None:
            
            status_code, user_response_object = cls.repository.get(id=id)
            
            if status_code != status.HTTP_200_OK:
                user_response_message = user_response_object
                return status_code, user_response_message
            
            user: Dict = user_response_message
            
            if user.id != payload.get('id', None):
                return status.HTTP_400_BAD_REQUEST, {
                    'message': 'ID inválido.'
                }
                
            if not user.is_active:
                return status.HTTP_400_BAD_REQUEST, {
                    'message': 'Usuário inativo.'
                }
                
                
        else:
            
            if not email:
                return status.HTTP_400_BAD_REQUEST, {
                    'message': 'Email é obrigatório.'
                }
            
            if not password:
                return status.HTTP_400_BAD_REQUEST, {
                    'message': 'Senha é obrigatória.'
                }
            
            if not '@' in email:
                return status.HTTP_400_BAD_REQUEST, {
                    'message': 'Email inválido falta o @.'
                }
                
            if not email_pattern.search(email):
                return status.HTTP_400_BAD_REQUEST, {
                    'message': 'Email inválido.'
                }
            
            if special_characters_pattern.search(username):
                return status.HTTP_400_BAD_REQUEST, {
                    'message': 'Nome de usuário não pode conter caracteres especiais.'
                }
                
            if password:
                
                if len(password) < 8:
                    return status.HTTP_400_BAD_REQUEST, {
                        'message': 'Senha deve ter no mínimo 8 caracteres.'
                    }
                    
                if not any(char.isdigit() for char in password):
                    return status.HTTP_400_BAD_REQUEST, {
                        'message': 'Senha deve conter ao menos um número.'
                    }
                    
                if not any(char.isupper() for char in password):
                    return status.HTTP_400_BAD_REQUEST, {
                        'message': 'Senha deve conter ao menos uma letra maiúscula.'
                    }
                    
                if not special_characters_pattern.search(password):
                    return status.HTTP_400_BAD_REQUEST, {
                        'message': 'Senha deve conter ao menos um caracter especial.'
                    }
                    
        return status.HTTP_200_OK, user