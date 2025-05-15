# Controllers
from typing import List, Any, Tuple
from ninja_extra import api_controller, paginate, route
from ninja_extra.ordering import ordering
from core.main.schemas import CustomOrdering, CustomPagination, PaginatedResponseSchema
from core.utils.changes import Controller
from .services import UserService
from .schemas import UserFilterSchema, UserMinimalSchema, UserOutSchema, UserPostSchema, UserPutSchema
from core.main.schemas import ErrorResponse
from core.utils.choices import SUCCESS_STATUSES, ERROR_STATUSES, NO_CONTENT_STATUSES
from django.db.models.query import QuerySet
from ninja import Query



@api_controller(
    '/user',
    tags=['Rota - Usuários'],
)

class UserController(Controller):
    
    service = UserService
    
    
    @route.get(
        '/',
        summary='Listar usuários',
        response={
            SUCCESS_STATUSES: PaginatedResponseSchema[UserMinimalSchema],
            ERROR_STATUSES: ErrorResponse,
        }
    )
    
    @paginate(CustomPagination)
    @ordering(
        CustomOrdering,
        ordering_fields=[
            'id', 
            'username', 
            'first_name', 
            'last_name'
            ],
    )
    
    def list(self, filters: UserFilterSchema = Query(...)) -> QuerySet[Any]:
        return self.service.list(filters=filters)
    
    @route.get(
        '/{id}',
        summary='Obter usuário',
        response={
            SUCCESS_STATUSES: UserOutSchema,
            ERROR_STATUSES: ErrorResponse,
        }
    )
    
    def get(self, request, id: int) -> Tuple[Any, ...]:
        return self.service.get(id=id)
    
    @route.post(
        '/',
        summary='Criar usuário',
        response={
            SUCCESS_STATUSES: UserMinimalSchema,
            ERROR_STATUSES: ErrorResponse,
        },
        auth=None
    )
    
    def create(self, request, payload: UserPostSchema) -> Tuple[Any, ...]:
        return self.service.post(payload=payload.dict(), last_user_id=request.user.id)
    
    @route.put(
        '/{id}',
        summary='Atualizar usuário',
        response={
            SUCCESS_STATUSES: UserMinimalSchema,
            ERROR_STATUSES: ErrorResponse,
        }
    )
    
    def update(self, request, id: int, payload: UserPutSchema) -> Tuple[Any, ...]:
        return self.service.put(id=id, payload=payload.dict(), last_user_id=request.user.id)
    
    @route.delete(
        '/{id}',
        summary='Deletar usuário',
        response={
            NO_CONTENT_STATUSES: None,
            ERROR_STATUSES: ErrorResponse,
        }
    )
    
    def delete(self, request, id: int) -> Tuple[Any, ...]:
        return self.service.delete(id=id, last_user_id=request.user.id)
    
    @route.patch(
        '/disable/{id}',
        summary='Desativar usuário',
        response={
            SUCCESS_STATUSES: UserMinimalSchema,
            ERROR_STATUSES: ErrorResponse,
        }
    )
    
    def disable(self, request, id: int) -> Tuple[Any, ...]:
        return self.service.disable(id=id, last_user_id=request.user.id)
    