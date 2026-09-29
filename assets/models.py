from django.db import models


class Base(models.Model):
    name = models.CharField(max_length=100, unique=True)
    location = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return self.name


class EquipmentType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=100)

    def __str__(self):
        return self.name