from django.db import models
from accounts.models import User
from assets.models import Base, EquipmentType


class Purchase(models.Model):
    base = models.ForeignKey(Base, on_delete=models.CASCADE)
    equipment_type = models.ForeignKey(EquipmentType, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    purchase_date = models.DateField()
    reference = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.equipment_type} - {self.quantity}"


class Transfer(models.Model):
    from_base = models.ForeignKey(
        Base,
        on_delete=models.CASCADE,
        related_name='transfers_out'
    )
    to_base = models.ForeignKey(
        Base,
        on_delete=models.CASCADE,
        related_name='transfers_in'
    )
    equipment_type = models.ForeignKey(
        EquipmentType,
        on_delete=models.CASCADE
    )
    quantity = models.PositiveIntegerField()
    transfer_date = models.DateTimeField(auto_now_add=True)
    reference = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.equipment_type} - {self.quantity}"


class Assignment(models.Model):
    base = models.ForeignKey(Base, on_delete=models.CASCADE)
    equipment_type = models.ForeignKey(EquipmentType, on_delete=models.CASCADE)
    personnel_name = models.CharField(max_length=150)
    quantity = models.PositiveIntegerField()
    assignment_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.personnel_name} - {self.equipment_type}"


class Expenditure(models.Model):
    base = models.ForeignKey(Base, on_delete=models.CASCADE)
    equipment_type = models.ForeignKey(EquipmentType, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    expenditure_date = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(blank=True)

    def __str__(self):
        return f"{self.equipment_type} - {self.quantity}"


class OpeningBalance(models.Model):
    base = models.ForeignKey(Base, on_delete=models.CASCADE)
    equipment_type = models.ForeignKey(EquipmentType, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    as_of_date = models.DateField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['base', 'equipment_type', 'as_of_date'],
                name='unique_opening_balance'
            )
        ]

    def __str__(self):
        return f"{self.base} - {self.equipment_type} - {self.quantity}"