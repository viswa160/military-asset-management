from django.contrib import admin
from .models import (
    Purchase,
    Transfer,
    Assignment,
    Expenditure,
    OpeningBalance,
)


@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    list_display = ('base', 'equipment_type', 'quantity', 'purchase_date')
    list_filter = ('base', 'equipment_type')
    search_fields = ('reference',)


@admin.register(Transfer)
class TransferAdmin(admin.ModelAdmin):
    list_display = (
        'from_base',
        'to_base',
        'equipment_type',
        'quantity',
        'transfer_date'
    )
    list_filter = ('from_base', 'to_base', 'equipment_type')


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = (
        'base',
        'equipment_type',
        'personnel_name',
        'quantity',
        'assignment_date'
    )
    list_filter = ('base', 'equipment_type')
    search_fields = ('personnel_name',)


@admin.register(Expenditure)
class ExpenditureAdmin(admin.ModelAdmin):
    list_display = (
        'base',
        'equipment_type',
        'quantity',
        'expenditure_date'
    )
    list_filter = ('base', 'equipment_type')


@admin.register(OpeningBalance)
class OpeningBalanceAdmin(admin.ModelAdmin):
    list_display = (
        'base',
        'equipment_type',
        'quantity',
        'as_of_date'
    )
    list_filter = ('base', 'equipment_type', 'as_of_date')