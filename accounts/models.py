from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('COMMANDER', 'Base Commander'),
        ('LOGISTICS', 'Logistics Officer'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='LOGISTICS'
    )

    base_name = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    groups = models.ManyToManyField(
        'auth.Group',
        blank=True,
        related_name='accounts_users',
        related_query_name='accounts_user',
    )

    user_permissions = models.ManyToManyField(
        'auth.Permission',
        blank=True,
        related_name='accounts_users',
        related_query_name='accounts_user',
    )

    def __str__(self):
        return self.username