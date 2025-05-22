"""Serializers for the vacation app."""

from datetime import datetime
from distutils.util import strtobool

from rest_framework import serializers

from hierarchy.models import JobPosition

from .models import VacationRequest
from .utils import get_working_days, is_working_day

ALLOWED_AREAS_TO_BYPASS_MONTH_LIMITATION = ["FISCALIA GENERAL DE LA NACION"]


class VacationRequestSerializer(serializers.ModelSerializer):
    """Serializer for the vacation request model."""

    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        """Meta class for the serializer."""

        model = VacationRequest
        fields = [
            "id",
            "user",
            "start_date",
            "end_date",
            "created_at",
            "boss_is_approved",
            "boss_approved_at",
            "manager_is_approved",
            "manager_approved_at",
            "hr_is_approved",
            "hr_approved_at",
            "payroll_is_approved",
            "payroll_approved_at",
            "sat_is_working",
            "status",
            "comment",
            "user_job_position",
        ]
        read_only_fields = [
            "boss_approved_at",
            "manager_approved_at",
            "hr_approved_at",
            "payroll_approved_at",
            "created_at",
            "user",
            "user_job_position",
        ]

    def to_representation(self, instance):
        """Return the representation of the vacation request."""
        data = super().to_representation(instance)
        data["username"] = instance.user.get_full_name()
        data["user_id"] = instance.user.id
        data["cedula"] = instance.user.cedula
        data.pop("manager_approved_at")
        data.pop("hr_approved_at")
        data.pop("payroll_approved_at")
        data.pop("user_job_position")
        return data

    def validate(self, attrs):
        """Validate the dates of the vacation request."""
        # Check if is a creation or an update
        if not self.instance:
            # Creation
            created_at = datetime.now()
            request = self.context["request"]
            if request.data.get("sat_is_working") is None:
                raise serializers.ValidationError(
                    "Debes especificar si trabajas los sábados."
                )
            else:
                try:
                    sat_is_working = bool(strtobool(request.data["sat_is_working"]))
                except ValueError:
                    raise serializers.ValidationError(
                        "Debes especificar si trabajas los sábados o no."
                    )
            if not is_working_day(attrs["start_date"], sat_is_working):
                raise serializers.ValidationError(
                    "No puedes iniciar tus vacaciones un día no laboral."
                )
            if not is_working_day(attrs["end_date"], sat_is_working):
                raise serializers.ValidationError(
                    "No puedes terminar tus vacaciones un día no laboral."
                )
            if request.data["sat_is_working"] == True:
                if attrs["start_date"].weekday() == 5:
                    raise serializers.ValidationError(
                        "No puedes iniciar tus vacaciones un sábado."
                    )
            if (
                get_working_days(attrs["start_date"], attrs["end_date"], sat_is_working)
                > 15
            ):
                raise serializers.ValidationError(
                    "No puedes solicitar más de 15 días de vacaciones."
                )
            if (
                created_at.day > 20
                and created_at.month + 1 == attrs["start_date"].month
                and not can_bypass_month_limitation(request.user)
            ):
                raise serializers.ValidationError(
                    "Después del día 20 no puedes solicitar vacaciones para el mes siguiente."
                )
            if attrs["start_date"] > attrs["end_date"]:
                raise serializers.ValidationError(
                    "La fecha de inicio no puede ser mayor a la fecha de fin."
                )
            if attrs["end_date"].weekday() == 6:
                raise serializers.ValidationError(
                    "No puedes terminar tus vacaciones un domingo."
                )
            if (
                attrs["start_date"].month == created_at.month
                and attrs["start_date"].year == created_at.year
                and not can_bypass_month_limitation(request.user)
            ):
                raise serializers.ValidationError(
                    "No puedes solicitar vacaciones para el mes actual."
                )
        else:
            # Update
            if (
                self.instance.boss_is_approved
                and "status" in attrs
                and attrs["status"] == "CANCELADA"
            ):
                raise serializers.ValidationError(
                    "No puedes cancelar una solicitud que ya ha recibido aprobación."
                )
        return attrs

    def create(self, validated_data):
        """Create the vacation request."""
        # Remove the is_approved fields from the validated data (security check)
        validated_data.pop("boss_is_approved", None)
        validated_data.pop("manager_is_approved", None)
        validated_data.pop("hr_is_approved", None)
        validated_data.pop("payroll_is_approved", None)
        # Add the user job position to the validated data
        job_position = JobPosition.objects.get(
            id=validated_data["user"].job_position_id
        )
        validated_data["user_job_position"] = job_position
        # Create the vacation request
        vacation_request = super().create(validated_data)
        return vacation_request

    def update(self, instance, validated_data):
        """Update the vacation request."""
        allowed_fields = [
            "boss_is_approved",
            "manager_is_approved",
            "hr_is_approved",
            "payroll_is_approved",
            # Status can only be updated to CANCELADA
            "status",
            "comment",
        ]
        for field, value in validated_data.items():
            if field in allowed_fields:
                setattr(instance, field, value)
        instance.save()
        return instance


def can_bypass_month_limitation(user) -> bool:
    """Check if the user can bypass the month limitation."""
    # Check if the user has the permission to bypass the month limitation
    area = str(user.area.name).strip().upper()
    allowed_areas = [
        area.strip().upper() for area in ALLOWED_AREAS_TO_BYPASS_MONTH_LIMITATION
    ]
    return area in allowed_areas
