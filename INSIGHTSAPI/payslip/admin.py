from django.contrib import admin

from .models import Payslip


@admin.register(Payslip)
class PayslipAdmin(admin.ModelAdmin):
    """Payslip admin."""

    list_display = (
        "title",
        "identification",
        "name",
        "area",
        "job_title",
        "salary",
        "disability_days",
        "disability_value",
        "bonus_paycheck",
    )

    search_fields = ("title", "identification", "name", "area", "job_title")
    list_filter = "area",
