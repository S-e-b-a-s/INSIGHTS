from django.contrib import admin

from .models import VacationRequest


@admin.register(VacationRequest)
class VacationAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "user_job_position",
        "start_date",
        "end_date",
        # "status",
        "duration",
        "return_date",
    )
    search_fields = ("user__first_name", "user__last_name")
    list_filter = ("status",)
    readonly_fields = (
        "duration",
        "return_date",
    )
