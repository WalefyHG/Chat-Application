from django.db import models
from django.utils.translation import gettext_lazy as _


# Create your models here.

class AbstractBaseModel(models.Model):
    """
    Responsável por definir os campos padrões de todos os models
    do projeto.
    """

    registration: models.DateTimeField = models.DateTimeField(
        verbose_name=_('Registration Date'),
        auto_now_add=True,
    )
    last_modification: models.DateTimeField = models.DateTimeField(
        verbose_name=_('Modification Date'),
        auto_now=True,
    )
    is_active: models.BooleanField = models.BooleanField(
        verbose_name=_('Active'),
        default=True,
    )

    class Meta:
        abstract = True