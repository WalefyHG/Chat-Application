# GENERIC SCHEMAS:
from operator import attrgetter, itemgetter
from typing import (
    Any,
    Generic,
    List,
    Optional,
    OrderedDict,
    Tuple,
    Type,
    TypeVar,
    Union,
)

from django.core.exceptions import FieldDoesNotExist
from django.db.models import CharField, F, QuerySet, TextField
from django.db.models.functions import Upper
from ninja import Field, FilterSchema, Schema, Field, P, Query
from ninja.pagination import PaginationBase
from ninja_extra.ordering import OrderingBase
from pydantic import BaseModel
from django.http import HttpRequest
from ninja.types import DictStrAny

from django.forms import CharField


T = TypeVar("T")

class PaginatedResponseSchema(
    Schema,
    BaseModel,
    Generic[T],
):
    """
    Schema responsável por armazenar o Schema (modelo Pydantic) de resposta para a paginação.
    """

    count: int
    results: List[T]
    __generic_model__: Any


PaginatedResponseSchema.__doc__ = ""
PaginatedResponseSchema.__generic_model__ = PaginatedResponseSchema



class GetBaseSchema(Schema):
    """
    Schema responsável por mostrar o id de saída para os dados genéricos.
    """

    id: int = Field(..., description="ID")


class GetIdName(GetBaseSchema):
    """
    Schema responsável por mostrar o id e o nome de saída para os dados genéricos.
    """
    name: str = Field(..., description="Nome")


class GetIdAbbreviation(GetBaseSchema):
    """
    Schema responsável por mostrar o id e a sigla de saída para os dados genéricos.
    """

    abbreviation: str = Field(..., description="Sigla")


class GetIdDescription(GetBaseSchema):
    """
    Schema responsável por mostrar o id e a descrição de saída para os dados genéricos.
    """

    description: str = Field(..., description="Descrição")


class DisabledInput(Schema):
    """
    Schema responsável por implementar a desativação de uma rota.
    """

    is_active: bool = Field(..., description="Está ativo?")


# CUSTOM PAGINATION:
class CustomPagination(PaginationBase):
    """
    Responsável para definição do Schema (modelo Pydantic) de paginação customizado.
    Page size se não for informado, retorna todos os registros. Caso page_size seja informado
    for menor que 1 vai retornar todos os registros. Caso contrário, vai retornar a quantidade
    de registros informada em page_size.
    """

    class Input(Schema):  # pylint: disable=missing-class-docstring
        page: int = Field(1, ge=1, description="Número da página")
        page_size: int = Field(
            100, description="Quantidade de registros por página"
        )

    def paginate_queryset(
        self,
        queryset: QuerySet,
        pagination: Input,
        request: Optional[HttpRequest] = None,
        **params: DictStrAny,
    ) -> Any:
        assert request, "request is required!"

        offset = None
        results = None

        if pagination.page_size is not None and pagination.page_size > 0:
            offset = (pagination.page - 1) * pagination.page_size

        if offset is not None:
            results = list(
                queryset[offset : offset + pagination.page_size]  # noqa: E203
            )  # noqa: E203
        else:
            results = list(queryset)

        return OrderedDict(
            [
                ("count", queryset.count()),
                ("results", results),
            ]
        )

    @classmethod
    def get_response_schema(
        cls,
        response_schema: Union[Type[Schema], Type[Any]],
    ) -> Any:
        """
        Método responsável por retornar o Schema (modelo Pydantic) de resposta para a paginação.
        """
        return PaginatedResponseSchema[response_schema]


class CustomOrdering(OrderingBase):
    """
    Responsável pela definição do Schema (modelo Pydantic) de ordenação customizado
    sem levar em consideração o 'case sensitive' e caracteres latinos tais como acentos.
    """

    class Input(Schema):
        ordering: Optional[str] = Field(
            None, description="Campos de ordenação"
        )

    def __init__(
        self,
        ordering_fields: Optional[List[str]] = None,
        pass_parameter: Optional[str] = None,
    ) -> None:
        super().__init__(pass_parameter=pass_parameter)
        self.ordering_fields = ordering_fields or "__all__"
        self.Input = self.create_input(ordering_fields)  # type:ignore

    def create_input(self, ordering_fields: Optional[List[str]]) -> Type[Input]:
        if ordering_fields:

            class DynamicInput(CustomOrdering.Input):
                ordering: Query[Optional[str], P(default=",".join(ordering_fields))]  # type:ignore[type-arg,valid-type]

            return DynamicInput
        return CustomOrdering.Input

    def ordering_queryset(
        self, items: Union[QuerySet, List], ordering_input: Input
    ) -> Union[QuerySet, List]:
        """
        Método responsável por ordenar os registros de acordo com os campos informados.
        """
        ordering = self.get_ordering(items, ordering_input.ordering)
        if ordering:
            if isinstance(items, QuerySet):  # type:ignore
                field_name = ordering[0].lstrip("-")

                # Check related fields
                if "__" in field_name:
                    base_field, related_field = field_name.split("__", 1)
                    base_field_meta = items.model._meta.get_field(base_field)
                    if base_field_meta.is_relation:
                        related_model = base_field_meta.related_model
                        if related_field not in [f.name for f in related_model._meta.fields]:
                            raise FieldDoesNotExist(
                                f"{related_model} has no field named '{related_field}'"
                            )
                else:
                    field = items.model._meta.get_field(field_name)

                # Add annotations for insensitive ordering
                if "__" not in field_name and isinstance(field, (CharField, TextField)):
                    items = items.annotate(upper_name=Upper(field_name))
                else:
                    items = items.annotate(upper_name=F(field_name))

                return items.order_by(
                    *[
                        (
                            F("upper_name").desc()
                            if o.startswith("-")
                            else F("upper_name")
                        )
                        for o in ordering
                    ]
                )
            elif isinstance(items, list) and items:

                def multisort(xs: List, specs: List[Tuple[str, bool]]) -> List:
                    orerator = (
                        itemgetter if isinstance(xs[0], dict) else attrgetter
                    )
                    for key, reverse in specs:
                        xs.sort(key=orerator(key), reverse=reverse)
                    return xs

                return multisort(
                    items,
                    [
                        (
                            o[int(o.startswith("-")) :],  # noqa: E203
                            o.startswith("-"),
                        )
                        for o in ordering
                    ],
                )
        return items

    def get_ordering(
        self, items: Union[QuerySet, List], value: Optional[str]
    ) -> List[str]:
        """
        Retorna a lista de campos válidos para ordenação.
        """
        if value:
            fields = [param.strip() for param in value.split(",")]
            return self.remove_invalid_fields(items, fields)
        return []

    def remove_invalid_fields(
        self, items: Union[QuerySet, List], fields: List[str]
    ) -> List[str]:
        """
        Remove os campos inválidos para ordenação.
        """
        valid_fields = list(self.get_valid_fields(items))

        def term_valid(term: str) -> bool:
            if term.startswith("-"):
                term = term[1:]
            # Validate related fields manually
            if "__" in term:
                parts = term.split("__")
                model = items.model
                for part in parts[:-1]:  # Browse relationships
                    try:
                        field = model._meta.get_field(part)
                        if not field.is_relation:
                            return False
                        model = field.related_model
                    except FieldDoesNotExist:
                        return False
                return parts[-1] in [f.name for f in model._meta.fields]
            return term in valid_fields

        return [field for field in fields if term_valid(field)]

    def get_valid_fields(self, items: Union[QuerySet, List]) -> List[str]:
        """
        Retorna a lista de campos válidos para ordenação.
        """
        if isinstance(items, QuerySet):
            # Get only the direct fields from the model
            valid_fields = [field.name for field in items.model._meta.fields]

            return valid_fields
        elif isinstance(items, list) and items:
            # For lists, keep the existing logic
            valid_fields = list(items[0].keys())

            return valid_fields
        return []


class ErrorResponse(Schema):
    message: str = Field(..., description="Mensagem de erro")