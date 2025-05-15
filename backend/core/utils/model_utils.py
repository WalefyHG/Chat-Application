"""
Responsável por prover funções utilitárias para models.
"""

from typing import Any, List, Optional


def get_active_references(
    *, model: Any, whitelist: Optional[List[Any]] = None
) -> List:
    """
    Verifica se a instância do model está sendo referenciada por outra instância ativa.

    Parâmetros:
        `model` -- Instância do model a ser verificada.

    Retorno:
        `active_referencing_models` -- Lista de models que referenciam a instância do model passado como parâmetro.
    """
    item_verbose_name: str = ''
    active_referencing_models: List = []

    for related_object in model._meta.related_objects:  # pylint: disable=protected-access
        related_name = related_object.get_accessor_name()

        if not hasattr(model, related_name):
            continue
        related_instances = getattr(model, related_name)

        if hasattr(related_instances, 'filter'):
            active_related_instance = related_instances.filter(
                is_active=True
            ).first()
            if not active_related_instance:
                continue
            item_verbose_name = str(
                active_related_instance._meta.verbose_name_plural
            )  # pylint: disable=protected-access
        else:
            if not related_instances.is_active:
                continue
            item_verbose_name = str(
                related_instances._meta.verbose_name_plural
            )  # pylint: disable=protected-access

        active_referencing_models.append(item_verbose_name)

    if whitelist is not None and whitelist != []:
        whitelist = [str(verbose_name) for verbose_name in whitelist]
        for reference in active_referencing_models.copy():
            if reference in whitelist:
                active_referencing_models.remove(reference)

    return active_referencing_models