from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'action',
        'entity',
        'entity_id',
        'timestamp',
    )
    list_filter = ('action', 'entity')
    search_fields = ('description', 'entity')