from datetime import datetime
from enum import Enum
from typing import Optional
from ninja import Schema, Field, FilterSchema

# Schemas User 

class UserPostSchema(Schema):
    username: str = Field(None, alias="username", title="Nome de usuário")
    email: str = Field(None, alias="email", title="Email")
    password: str = Field(None, alias="password", title="Senha")
    name: str = Field(None, alias="name", title="Nome")
    
    
class UserPutSchema(Schema):
    username: str = Field(None, alias="username", required=False, title="Nome de usuário")
    email: str = Field(None, alias="email", required=False, title="Email")
    password: str = Field(None, alias="password", required=False, title="Senha")
    name: str = Field(None, alias="name", required=False, title="Nome")
    
class UserOutSchema(Schema):
    id: int
    username: str = Field(None, title="Nome de usuário")
    email: str = Field(None, title="Email")
    name: str = Field(None, title="Nome")
    
class UserFilterSchema(FilterSchema):
    username: str = Field(None, q='username', title="Nome de usuário")
    email: str = Field(None, q='email', title="Email")
    name: str = Field(None, q='name', title="Nome")
    
class UserMinimalSchema(Schema):
    id: int
    username: str = Field(..., alias="username", title="Nome de usuário")
    email: str = Field(..., alias="email", title="Email")
    