from typing import Any, Dict, List, Optional, Tuple, Union
from django.db import IntegrityError, models
from django.http import Http404
from django.shortcuts import get_object_or_404
from ninja_extra import status
from django.db import transaction

class Repository:

    model = models.Model

    @classmethod
    def list(cls) -> models.QuerySet:
        return cls.model.objects.all().order_by("id")
    
    @classmethod
    def get(cls, *, id: int) -> models.Model:
        return get_object_or_404(cls.model, id=id)

    @classmethod
    def update_payload(
        cls, *, payload: Dict, last_user_id: int, **kwargs
    ) -> Dict:
        updated_payload: Dict = {
            **payload,
            "last_user_id": last_user_id
        }
        return updated_payload
    
    @classmethod
    def post(cls, *, payload: Dict, last_user_id: int, **kwargs) -> models.Model:
        payload = cls.update_payload(payload=payload, last_user_id=last_user_id)
        return cls.model.objects.create(**payload)
    
    @classmethod
    def put(
        cls,
        *,
        instance: models.Model,
        payload: Dict,
        last_user_id: int,
        **kwargs
    ) -> models.Model:
        payload = cls.update_payload(payload=payload, last_user_id=last_user_id)
        for attr, value in payload.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
    
    @classmethod
    def delete(
        cls, *, instance: models.Model
        ) -> models.Model:
        instance.delete()
        return instance


class Services:

    repository = Repository
    whitelist_disable_models: List[Optional[str]] = []

    @classmethod
    def validate_payload(
        cls, *, payload: Dict[str, Any], id: Optional[int] = None, **kwargs
    ) -> Tuple[int, Optional[models.Model | Dict[str, str]]]:
        instance: Optional[models.Model] = None
        return status.HTTP_200_OK, instance

    @classmethod
    def list(cls, *, filters: Optional[Any] = None) -> models.QuerySet:
        queryset = cls.repository.list()
        if filters:
            queryset = queryset.filter(**filters.dict(exclude_none=True))
        return queryset
    
    @classmethod
    def get(cls, *, id: int) -> Tuple[int, models.Model | Dict[str, str]]:
        try:
            return status.HTTP_200_OK, cls.repository.get(id=id)
        except Http404:
            return status.HTTP_404_NOT_FOUND, {"message": (
                f"{cls.repository.model._meta.verbose_name.capitalize()} not found"
                ' não existe'
            ) }
        
    @classmethod
    def post(
        cls, *, payload: Dict[str, Any], last_user_id: int, **kwargs
    ) -> Tuple [int, Union[models.Model, Dict[str, str]]]:
        try:
            with transaction.atomic():
                status_code: int
                message: Dict[str, str]

                status_code, message = cls.validate_payload(payload=payload)

                if status_code != status.HTTP_200_OK:
                    return status_code, message
                
                instance = cls.repository.post(payload=payload, last_user_id=last_user_id)
                return status.HTTP_201_CREATED, instance
        except IntegrityError as error:
            return status.HTTP_500_INTERNAL_SERVER_ERROR, {"message": str(error)}

    @classmethod
    def put(
        cls,
        *,
        id: int,
        payload: Dict[str, Any],
        last_user_id: int,
        **kwargs
    ) -> Tuple[int, Union[models.Model, Dict[str, str]]]:
        
        try:
            with transaction.atomic():
                status_code: int
                message: Dict[str, str]

                status_code, message_or_object = cls.validate_payload(
                    payload=payload, id=id
                )

                if status_code != status.HTTP_200_OK:
                    message: Dict[str, str] = message_or_object
                    return status_code, message
                
                instance: models.Model = message_or_object

                instance = cls.repository.put(
                    instance=instance, payload=payload, last_user_id=last_user_id
                )
                return status.HTTP_201_CREATED, instance
            
        except IntegrityError as error:
            return status.HTTP_500_INTERNAL_SERVER_ERROR, {"message": str(error)}
        
    @classmethod
    def delete(
        cls, *, id: int, last_user_id: int, **kwargs
    ) -> Tuple[int, Union[models.Model, Dict[str, str]]]:
        try:
            with transaction.atomic():
                status_code: int
                message_or_object: Dict[str, str] | models.Model

                status_code, message_or_object = cls.get(id=id)
                if status_code != status.HTTP_200_OK:
                    return status_code, message_or_object
                
                instance: models.Model = message_or_object

                instance = cls.repository.delete(instance=instance)

                return status.HTTP_204_NO_CONTENT, instance
            
        except IntegrityError as error:
            return status.HTTP_500_INTERNAL_SERVER_ERROR, {"message": str(error)}
        


class Controller:

    service: Services