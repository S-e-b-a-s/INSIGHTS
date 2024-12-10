from django.contrib import admin

from .models import PQRS


@admin.register(PQRS)
class PQRSAdmin(admin.ModelAdmin):
    list_display = ("reason", "user", "management", "created_at")
    search_fields = ("reason", "user", "management", "created_at")
    list_filter = ("reason", "management", "created_at")
    readonly_fields = ("created_at",)
