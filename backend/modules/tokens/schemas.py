from ninja import Schema
from ninja.schema import DjangoGetter
from pydantic import model_validator, ValidationInfo
from ninja_jwt.schema import TokenObtainPairInputSchema, SchemaInputService
from typing import Dict, Union
from modules.users.schemas import UserOutSchema


class CustomTokenOutObtain(Schema):
    token: str
    user: UserOutSchema


class CustomTokenObtainSchema(TokenObtainPairInputSchema):
    """
    Schema responsável por tratar o Schema (modelo Pydantic) de entrada para o login.
    """
    @model_validator(mode='before')
    def validate_inputs(
        cls, values: Union[DjangoGetter, Dict],  # SCHEMA_INPUT
    ) -> Dict:
        schema_input = SchemaInputService(values, cls.model_config)
        input_values = schema_input.get_values()
        request = schema_input.get_request()
        if isinstance(input_values, dict):
            values.update(
                cls.validate_values(request=request, values=input_values)
            )
            return values
        return values

    def output_schema(self) -> CustomTokenOutObtain:
        token = self.to_response_schema().access
        user_schema = UserOutSchema.from_orm(self._user)
        return CustomTokenOutObtain(token=token, user=user_schema)