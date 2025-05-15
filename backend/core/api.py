from ninja import Swagger
from ninja_extra import NinjaExtraAPI
from ninja_jwt.authentication import JWTAuth
from django.contrib.admin.views.decorators import staff_member_required
from modules.users.controllers import UserController
from modules.tokens.controllers import TokenController
from modules.rooms.controllers import ChatController

api = NinjaExtraAPI(
    title= "Teste API",
    version= "1.1.0",
    description= "Esta é a descrição básica do projeto EcoVista. Este projeto tem como objetivo fornecer uma API para gerenciar usuários, tokens, biomas, imagens e relatórios.",
    app_name= "ecovista",
    auth=JWTAuth(),
    docs_decorator=staff_member_required,
    docs=Swagger(),
    docs_url="/docs/",
    urls_namespace="ecovista_api"
)


api.register_controllers(
    UserController,
)

api.register_controllers(
    TokenController,
)

api.register_controllers(
    ChatController,
)