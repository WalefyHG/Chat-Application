import json
import os
import django
import tracemalloc
from uvicorn import run
from core.asgi import django_asgi_app
from ninja_jwt.authentication import JWTAuth
from channels.routing import URLRouter
from channels.auth import AuthMiddlewareStack
from modules.users.models import User
from modules.rooms.router import websocket_urlpatterns
from django.core.asgi import get_asgi_application
from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

django.setup()

django_asgi_app = get_asgi_application()

tracemalloc.start()

jwt_auth = JWTAuth()

@database_sync_to_async
def get_user(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()

async def authenticate_token(token):
        try:
            user = JWTAuth().authenticate(request=None, token=token)
            user_id = get_user(user.id)
            print(user_id)
            return user_id
        except Exception:
            return None

class QueryParamsMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode('utf-8')
        user_id = self.extract_user_id(query_string)
        scope['user'] = await get_user(user_id)

        return await self.app(scope, receive, send)

    def extract_user_id(self, query_string):
        params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
        return int(params.get('user_id', 0)) if 'user_id' in params else 0

    
async def application(scope, receive, send):
    if scope['type'] == 'http':
        headers = dict(scope.get('headers', []))
        if b'authorization' in headers:
            token = headers[b'authorization'].decode('utf-8')
            scope['user'] = await authenticate_token(token)
        await django_asgi_app(scope, receive, send)
    elif scope['type'] == 'websocket':
        app = AuthMiddlewareStack(
            QueryParamsMiddleware(
                URLRouter(
                    websocket_urlpatterns
                )
            )
        )
        await app(scope, receive, send)

if __name__ == "__main__":
    port = int(os.getenv('PORT', 8000))
    run(application, host="0.0.0.0", port=port)