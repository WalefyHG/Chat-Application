import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from modules.rooms.router import websocket_urlpatterns
from modules.users.models import User

class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        params = dict(pair.split('=') for pair in query_string.split('&') if '=' in pair)
        user_id_str = params.get("user_id", "0")

        try:
            user_id = int(user_id_str)
        except ValueError:
            user_id = 0

        if user_id:
            # Busca usuário no banco de forma assíncrona, captura exceção caso não exista
            try:
                user = await database_sync_to_async(User.objects.get)(id=user_id)
            except User.DoesNotExist:
                user = AnonymousUser()
        else:
            user = AnonymousUser()

        scope['user'] = user
        return await self.inner(scope, receive, send)


application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddleware(
        URLRouter(websocket_urlpatterns)
    ),
})
