"""This file contains the tests for the vacation model."""

from datetime import datetime
from datetime import date

from django.contrib.auth.models import Permission
from django.db.models import Q
from django.test import TestCase, override_settings
from django.urls import reverse
from freezegun import freeze_time
from rest_framework import status

from hierarchy.models import Area
from services.tests import BaseTestCase
from users.models import User

from .models import VacationRequest
from .serializers import VacationRequestSerializer
from .utils import get_return_date, get_working_days, is_working_day


class WorkingDayTestCase(TestCase):
    """Test module for working day utility functions."""

    def test_is_working_day(self):
        """Test the is_working_day function."""
        self.assertTrue(is_working_day("2024-01-02", True))
        self.assertFalse(is_working_day("2024-01-01", True))
        self.assertTrue(is_working_day("2024-01-05", True))
        self.assertTrue(is_working_day("2024-01-06", True))
        self.assertFalse(is_working_day("2024-01-06", False))

    def test_get_working_days_no_sat(self):
        """Test the get_working_days function."""
        self.assertEqual(get_working_days("2024-01-02", "2024-01-05", False), 4)
        self.assertEqual(get_working_days("2024-01-01", "2024-01-05", False), 4)
        # The 8th is a holiday
        self.assertEqual(get_working_days("2024-01-01", "2024-01-09", False), 5)
        self.assertEqual(get_working_days("2024-01-01", "2024-01-23", False), 15)
        self.assertEqual(get_working_days("2024-12-09", "2024-12-27", False), 14)

    def test_get_working_days_sat(self):
        """Test the get_working_days function with Saturdays."""
        self.assertEqual(get_working_days("2024-01-02", "2024-01-05", True), 4)
        self.assertEqual(get_working_days("2024-01-01", "2024-01-05", True), 4)
        # The 8th is a holiday
        self.assertEqual(get_working_days("2024-01-01", "2024-01-09", True), 6)
        self.assertEqual(get_working_days("2024-01-01", "2024-01-19", True), 15)

    def test_get_return_date(self):
        """Test the get_return_date function."""
        self.assertEqual(get_return_date("2024-08-30", False), datetime(2024, 9, 2))
        self.assertEqual(get_return_date("2024-08-30", True), datetime(2024, 8, 31))
        self.assertEqual(get_return_date("2024-09-06", False), datetime(2024, 9, 9))
        self.assertEqual(get_return_date("2024-12-31", True), datetime(2025, 1, 2))


@override_settings(DEFAULT_FILE_STORAGE="django.core.files.storage.InMemoryStorage")
@freeze_time("2024-05-01 10:00:00")
class VacationRequestModelTestCase(BaseTestCase):
    """Test module for VacationRequest model."""

    def setUp(self):
        """Create a user and a vacation request."""
        super().setUp()
        self.test_user = self.create_demo_user()
        self.user.job_position.rank = 2
        self.user.job_position.save()
        self.user.area = self.test_user.area
        self.user.save()
        self.permission = Permission.objects.get(codename="payroll_approval")
        self.vacation_request = {
            "start_date": date(2024, 1, 2),
            "end_date": date(2024, 1, 18),
        }
        self.vacation_request_user = {
            "start_date": date(2024, 1, 2),
            "end_date": date(2024, 1, 18),
            "user": self.test_user,
            "user_job_position": self.test_user.job_position,
            "sat_is_working": True,
        }

    def test_vacation_create(self):
        """Test creating a vacation endpoint."""
        self.vacation_request["hr_is_approved"] = True  # This is just a check
        self.vacation_request["sat_is_working"] = False
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["hr_is_approved"], None)
        self.assertEqual(response.data["status"], "PENDIENTE")
        self.assertEqual(response.data["user_id"], self.user.id)
        self.assertEqual(response.data.get("user_job_position"), None)
        self.assertEqual(response.data["start_date"], "2024-01-02")
        self.assertEqual(response.data["end_date"], "2024-01-18")
        vacation = VacationRequest.objects.get(pk=response.data["id"])
        self.assertEqual(vacation.user_job_position, self.user.job_position)
        self.assertEqual(vacation.user_area, self.user.area)
        self.assertEqual(vacation.sat_is_working, False)
        self.assertEqual(vacation.duration, 12)

    def test_vacation_create_no_sat_is_working(self):
        """Test creating a vacation without sat_is_working."""
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST, response.data
        )
        self.assertEqual(
            response.data["non_field_errors"][0],
            "Debes especificar si trabajas los sábados.",
        )

    @freeze_time("2024-01-01 10:00:00")
    def test_vacation_create_same_month(self):
        """Test creating a vacation that spans two months."""
        super().setUp()
        self.vacation_request["sat_is_working"] = False
        self.vacation_request["start_date"] = "2024-01-02"
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST, response.data
        )
        self.assertEqual(
            response.data["non_field_errors"][0],
            "No puedes solicitar vacaciones para el mes actual.",
        )

    def test_vacation_list_user(self):
        """Test listing all vacations endpoint for a user."""
        VacationRequest.objects.create(**self.vacation_request_user)
        self.vacation_request_user["user"] = self.user
        VacationRequest.objects.create(**self.vacation_request_user)
        self.user.job_position.rank = 1
        self.user.job_position.save()
        response = self.client.get(reverse("vacation-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_vacation_list_boss(self):
        """Test listing all vacations endpoint for a boss."""
        self.user.job_position.rank = 2
        self.user.job_position.save()
        self.test_user.area = self.user.area
        self.test_user.save()
        VacationRequest.objects.create(**self.vacation_request_user)
        VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.get(reverse("vacation-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_vacation_list_manager(self):
        """Test listing all vacations endpoint for a manager."""
        self.user.job_position.rank = 5
        self.user.job_position.save()
        self.test_user.area.manager = self.user
        self.test_user.area.save()
        VacationRequest.objects.create(**self.vacation_request_user)
        VacationRequest.objects.create(**self.vacation_request_user)
        # Change the area of the test user to match the user's area
        demo_user_admin = self.create_demo_user_admin()
        demo_user_admin.area = self.user.area
        demo_user_admin.save()
        demo_user_admin.job_position.rank = 1
        demo_user_admin.job_position.save()
        VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.get(reverse("vacation-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3, response.data)

    def test_vacation_list_manager_multiple_areas(self):
        """Test listing all vacations endpoint for a manager with multiple areas."""
        self.test_user.area.manager = self.user
        self.test_user.area.save()
        self.user.area = Area.objects.create(name="Test Area 2", manager=self.user)
        self.user.save()
        # Check that the user has a different area than the manager
        self.assertNotEqual(self.test_user.area, self.user.area)
        VacationRequest.objects.create(**self.vacation_request_user)
        self.create_demo_user()
        Area.objects.create(name="Test Area", manager=self.user)
        VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.get(reverse("vacation-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_vacation_list_payroll(self):
        """Test listing all vacations endpoint for payroll."""
        self.user.user_permissions.add(self.permission)
        VacationRequest.objects.create(**self.vacation_request_user)
        VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.get(reverse("vacation-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_vacation_list_vacation_manager(self):
        """Test listing all vacations endpoint for a vacation manager."""
        self.test_user.area.vacation_managers.add(self.user)
        VacationRequest.objects.create(**self.vacation_request_user)
        VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.get(reverse("vacation-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_vacation_list_hr(self):
        """Test listing all vacations endpoint for HR."""
        self.user.job_position.name = "GERENTE DE GESTION HUMANA"
        self.user.job_position.save()
        VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.get(reverse("vacation-list"))
        vacation_requests = VacationRequest.objects.all()
        serializer = VacationRequestSerializer(vacation_requests, many=True)
        self.assertEqual(response.data, serializer.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_vacation_retrieve(self):
        """Test retrieving a vacation endpoint."""
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.get(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["start_date"], "2024-01-02"
        )
        self.assertEqual(
            response.data["end_date"], "2024-01-18"
        )

    def test_vacation_create_end_before_start(self):
        """Test creating a vacation with the end date before the start date."""
        self.vacation_request["end_date"] = "2021-01-04"
        self.vacation_request["sat_is_working"] = False
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["non_field_errors"][0],
            "La fecha de inicio no puede ser mayor a la fecha de fin.",
        )

    def test_vacation_owner_cancel_approved(self):
        """Test the owner cancelling an approved vacation."""
        self.vacation_request_user["boss_is_approved"] = True
        self.vacation_request_user["user"] = self.user
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"status": "CANCELADA"},
        )
        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST, response.data
        )
        self.assertEqual(
            str(response.data["non_field_errors"][0]),
            "No puedes cancelar una solicitud que ya ha recibido aprobación.",
        )

    def test_vacation_cancel_no_owner(self):
        """Test cancelling a vacation without being the owner."""
        self.vacation_request_user["user"] = self.test_user
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"status": "CANCELADA"},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    def test_vacation_boss_approve(self):
        """Test the boss approving a vacation."""
        self.user.job_position.rank = 2
        self.user.job_position.save()
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"boss_is_approved": True},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertTrue(response.data["boss_is_approved"])
        vacation_object.refresh_from_db()
        self.assertIsNotNone(vacation_object.boss_approved_at)

    def test_vacation_manager_approve(self):
        """Test the manager approving a vacation."""
        self.user.job_position.rank = 5
        self.user.job_position.save()
        self.test_user.job_position.name = "GERENTE DE GESTION HUMANA"
        self.test_user.job_position.save()
        self.vacation_request_user["boss_is_approved"] = True
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"manager_is_approved": True},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertTrue(response.data["manager_is_approved"])
        vacation_object.refresh_from_db()
        self.assertIsNotNone(vacation_object.manager_approved_at)

    def test_vacation_manager_reject(self):
        """Test the manager rejecting a vacation."""
        self.user.job_position.rank = 5
        self.user.job_position.save()
        self.vacation_request_user["boss_is_approved"] = True
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"manager_is_approved": False},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertFalse(response.data["manager_is_approved"])
        self.assertEqual(response.data["status"], "RECHAZADA")
        vacation_object.refresh_from_db()
        self.assertIsNotNone(vacation_object.manager_approved_at)

    def test_vacation_manager_approve_before_boss(self):
        """Test the manager approving a vacation before the boss."""
        self.user.job_position.rank = 5
        self.user.job_position.save()
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"manager_is_approved": True},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    def test_vacation_manager_approve_no_manager(self):
        """Test the manager approving a vacation without being a manager."""
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"manager_is_approved": True},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    def test_vacation_hr_approve(self):
        """Test HR approving a vacation."""
        self.user.job_position.name = "GERENTE DE GESTION HUMANA"
        self.user.job_position.save()
        test_user = self.create_demo_user()
        test_user.user_permissions.add(self.permission)
        self.vacation_request_user["manager_is_approved"] = True
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"hr_is_approved": True},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertTrue(response.data["hr_is_approved"])
        vacation_object.refresh_from_db()
        self.assertIsNotNone(vacation_object.hr_approved_at)

    def test_vacation_hr_reject(self):
        """Test HR rejecting a vacation."""
        self.user.job_position.name = "GERENTE DE GESTION HUMANA"
        self.user.job_position.save()
        self.vacation_request_user["manager_is_approved"] = True
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"hr_is_approved": False},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertFalse(response.data["hr_is_approved"])
        self.assertEqual(response.data["status"], "RECHAZADA")
        vacation_object.refresh_from_db()
        self.assertIsNotNone(vacation_object.hr_approved_at)

    def test_vacation_hr_approve_before_manager(self):
        """Test HR approving a vacation before the manager."""
        self.user.job_position.name = "GERENTE DE GESTION HUMANA"
        self.user.job_position.save()
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"hr_is_approved": True},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    def test_vacation_hr_approve_no_hr(self):
        """Test HR approving a vacation without being an HR."""
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"hr_is_approved": True},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    def test_vacation_payroll_approve(self):
        """Test payroll approving a vacation."""
        self.user.user_permissions.add(self.permission)
        self.vacation_request_user["hr_is_approved"] = True
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"payroll_is_approved": True},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertTrue(response.data["payroll_is_approved"])
        vacation_object.refresh_from_db()
        self.assertIsNotNone(vacation_object.payroll_approved_at)

    def test_vacation_payroll_reject(self):
        """Test payroll rejecting a vacation."""
        self.user.user_permissions.add(self.permission)
        self.vacation_request_user["hr_is_approved"] = True
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"payroll_is_approved": False},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertFalse(response.data["payroll_is_approved"])
        self.assertEqual(response.data["status"], "RECHAZADA")
        vacation_object.refresh_from_db()
        self.assertIsNotNone(vacation_object.payroll_approved_at)

    def test_vacation_payroll_approve_before_hr(self):
        """Test payroll approving a vacation before HR."""
        self.user.user_permissions.add(self.permission)
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"payroll_is_approved": True},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    def test_vacation_payroll_approve_no_payroll(self):
        """Test payroll approving a vacation without being in payroll."""
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"payroll_is_approved": True},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    @freeze_time("2024-07-21 10:00:00")
    def test_validate_vacation_request_after_20th(self):
        """Test the validation of a vacation request after the 20th."""
        super().setUp()
        self.vacation_request["sat_is_working"] = False
        self.vacation_request["start_date"] = "2024-08-12"
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST, response.data
        )
        self.assertEqual(
            response.data["non_field_errors"][0],
            "Después del día 20 no puedes solicitar vacaciones para el mes siguiente.",
        )

    def test_validate_vacation_request_not_working_day(self):
        """Test the validation of a vacation request on a non-working day."""
        self.vacation_request["sat_is_working"] = False
        self.vacation_request["start_date"] = "2024-01-01"
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST, response.data
        )
        self.assertEqual(
            response.data["non_field_errors"][0],
            "No puedes iniciar tus vacaciones un día no laboral.",
        )

    def test_validate_vacation_request_not_working_day_sat(self):
        """Test the validation of a vacation request on a Saturday."""
        self.vacation_request["sat_is_working"] = False
        self.vacation_request["start_date"] = "2024-05-04"
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST, response.data
        )
        # This is fine because if the user doesn't work on Saturdays, they can't start their vacation on a Saturday
        self.assertEqual(
            response.data["non_field_errors"][0],
            "No puedes iniciar tus vacaciones un día no laboral.",
        )

    def test_validate_vacation_request_not_working_day_sat_working(self):
        """Test the validation of a vacation request on a Saturday with working Saturdays."""
        self.vacation_request["sat_is_working"] = True
        self.vacation_request["start_date"] = "2025-04-05"
        self.vacation_request["end_date"] = "2025-04-09"
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_validate_vacation_request_not_working_day_end(self):
        """Test the validation of a vacation request on a non-working day."""
        self.vacation_request["sat_is_working"] = False
        self.vacation_request["end_date"] = "2025-04-05"
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST, response.data
        )
        self.assertEqual(
            response.data["non_field_errors"][0],
            "No puedes terminar tus vacaciones un día no laboral.",
        )

    def test_validate_vacation_request_not_working_day_sat_end(self):
        """Test the validation of a vacation request on a Saturday."""
        self.vacation_request["sat_is_working"] = False
        self.vacation_request["end_date"] = "2024-05-04"
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST, response.data
        )
        # This is fine because if the user doesn't work on Saturdays, they can't end their vacation on a Saturday
        self.assertEqual(
            response.data["non_field_errors"][0],
            "No puedes terminar tus vacaciones un día no laboral.",
        )

    def test_validate_vacation_request_not_working_day_sat_working_end(self):
        """Test the validation of a vacation request on a Saturday with working Saturdays."""
        self.vacation_request["sat_is_working"] = True
        self.vacation_request["start_date"] = "2025-04-03"
        self.vacation_request["end_date"] = "2025-04-05"
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_validate_vacation_request_more_than_15_days(self):
        """Test the validation of a vacation request with more than 15 days."""
        self.vacation_request["sat_is_working"] = False
        self.vacation_request["end_date"] = "2024-01-24"
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST, response.data
        )
        self.assertEqual(
            response.data["non_field_errors"][0],
            "No puedes solicitar más de 15 días de vacaciones.",
        )

    def test_get_vacation_request(self):
        """Test getting the vacation request PDF."""
        self.user.user_permissions.add(self.permission)
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.get(
            reverse("vacation-get-request", kwargs={"pk": vacation_object.pk})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")

    def test_get_vacation_request_no_permission(self):
        """Test getting the vacation request PDF without permission."""
        self.user.job_position.rank = 1
        self.user.job_position.save()
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.get(
            reverse("vacation-get-request", kwargs={"pk": vacation_object.pk})
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_vacation_request_manager(self):
        """Test getting the vacation request PDF as a manager."""
        self.user.job_position.rank = 5
        self.user.job_position.save()
        self.test_user.area.manager = self.user
        self.test_user.area.save()
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.get(
            reverse("vacation-get-request", kwargs={"pk": vacation_object.pk})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")

    def test_get_manage_multiple_children(self):
        """Test managing multiple children."""
        self.test_user.area.parent = self.user.area
        self.test_user.area.save()
        VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.get(
            reverse("vacation-list"),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    @freeze_time("2024-05-21 10:00:00")
    def test_bypass_month_limitations(self):
        """Test bypassing the month limitation."""
        super().setUp()
        self.user.area = Area.objects.create(
            name="FISCALIA GENERAL DE LA NACION", manager=self.test_user
        )
        self.user.save()
        # Bypass get vacation on current month
        self.vacation_request["start_date"] = "2024-05-24"
        self.vacation_request["end_date"] = "2024-05-28"
        self.vacation_request["sat_is_working"] = True
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        # Bypass get vacation next month, after 20
        self.vacation_request["start_date"] = "2024-06-22"
        self.vacation_request["end_date"] = "2024-06-25"
        self.vacation_request["sat_is_working"] = True
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_vacation_area_persistence(self):
        """Test that the user's area is stored at creation time and doesn't change."""
        # Create a vacation request
        self.vacation_request["sat_is_working"] = False
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        vacation = VacationRequest.objects.get(pk=response.data["id"])
        original_area = vacation.user_area

        # Change the user's area
        new_area = Area.objects.create(name="New Test Area")
        self.user.area = new_area
        self.user.save()

        # Verify the vacation request still has the original area
        vacation.refresh_from_db()
        self.assertEqual(vacation.user_area, original_area)
        self.assertNotEqual(vacation.user_area, new_area)

    def test_vacation_area_in_response(self):
        """Test that the area is included in the API response."""
        # Create a vacation request
        self.vacation_request["sat_is_working"] = False
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Get the vacation request
        response = self.client.get(
            reverse("vacation-detail", kwargs={"pk": response.data["id"]})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["area"], self.user.area.name)

    def test_vacation_list_includes_area(self):
        """Test that vacation list includes area information."""
        VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.get(reverse("vacation-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("area", response.data[0])

    def test_vacation_create_with_paid_days(self):
        """Test creating a vacation request with paid_days field."""
        self.vacation_request["sat_is_working"] = False
        self.vacation_request["paid_days"] = 5
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["paid_days"], 5)
        vacation = VacationRequest.objects.get(pk=response.data["id"])
        self.assertEqual(vacation.paid_days, 5)

    def test_vacation_create_without_paid_days(self):
        """Test creating a vacation request without paid_days field."""
        self.vacation_request["sat_is_working"] = False
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertIsNone(response.data.get("paid_days"))
        vacation = VacationRequest.objects.get(pk=response.data["id"])
        self.assertIsNone(vacation.paid_days)

    def test_vacation_payroll_update_paid_days(self):
        """Test payroll user updating paid_days field."""
        self.user.user_permissions.add(self.permission)
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"paid_days": 3},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["paid_days"], 3)
        vacation_object.refresh_from_db()
        self.assertEqual(vacation_object.paid_days, 3)

    def test_vacation_payroll_update_paid_days_to_zero(self):
        """Test payroll user setting paid_days to zero (removing it)."""
        self.user.user_permissions.add(self.permission)
        self.vacation_request_user["paid_days"] = 5
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"paid_days": 0},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["paid_days"], 0)
        vacation_object.refresh_from_db()
        self.assertEqual(vacation_object.paid_days, 0)

    def test_vacation_payroll_update_paid_days_to_null(self):
        """Test payroll user removing paid_days by setting to null."""
        self.user.user_permissions.add(self.permission)
        self.vacation_request_user["paid_days"] = 5
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"paid_days": ""},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertIsNone(response.data["paid_days"])
        vacation_object.refresh_from_db()
        self.assertIsNone(vacation_object.paid_days)

    def test_vacation_non_payroll_update_paid_days(self):
        """Test non-payroll user cannot update paid_days field."""
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"paid_days": 3},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)
        self.assertIn("You do not have permission to edit paid days", response.data["detail"])

    def test_vacation_payroll_update_paid_days_without_permission(self):
        """Test user without payroll permission cannot update paid_days."""
        # Remove any existing permissions
        self.user.user_permissions.clear()
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"paid_days": 3},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)
        self.assertIn("You do not have permission to edit paid days", response.data["detail"])

    def test_vacation_payroll_update_paid_days_invalid_value(self):
        """Test payroll user cannot set paid_days to invalid value."""
        self.user.user_permissions.add(self.permission)
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"paid_days": -1},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)

    def test_vacation_payroll_update_paid_days_exceeds_duration(self):
        """Test payroll user cannot set paid_days greater than vacation duration."""
        self.user.user_permissions.add(self.permission)
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        # Vacation duration is 12 days, so paid_days should not exceed that
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"paid_days": 20},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        # The model allows this, but it's a business logic consideration
        vacation_object.refresh_from_db()
        self.assertEqual(vacation_object.paid_days, 20)

    def test_vacation_serializer_paid_days_included(self):
        """Test that paid_days is included in serializer output."""
        self.vacation_request_user["paid_days"] = 7
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        serializer = VacationRequestSerializer(vacation_object)
        self.assertIn("paid_days", serializer.data)
        self.assertEqual(serializer.data["paid_days"], 7)

    def test_vacation_serializer_paid_days_null(self):
        """Test that paid_days is included as null when not set."""
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        serializer = VacationRequestSerializer(vacation_object)
        self.assertIn("paid_days", serializer.data)
        self.assertIsNone(serializer.data["paid_days"])

    def test_vacation_model_paid_days_field(self):
        """Test that paid_days field is properly defined in model."""
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        # Test that the field exists and can be set
        vacation_object.paid_days = 5
        vacation_object.save()
        vacation_object.refresh_from_db()
        self.assertEqual(vacation_object.paid_days, 5)

    def test_vacation_payroll_update_paid_days_and_other_fields(self):
        """Test payroll user can update paid_days along with other allowed fields."""
        self.user.user_permissions.add(self.permission)
        self.vacation_request_user["hr_is_approved"] = True
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"paid_days": 3, "payroll_is_approved": True},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["paid_days"], 3)
        self.assertTrue(response.data["payroll_is_approved"])
        vacation_object.refresh_from_db()
        self.assertEqual(vacation_object.paid_days, 3)
        self.assertTrue(vacation_object.payroll_is_approved)

    def test_vacation_payroll_update_paid_days_after_approval(self):
        """Test payroll user can update paid_days even after vacation is approved."""
        self.user.user_permissions.add(self.permission)
        self.vacation_request_user["hr_is_approved"] = True
        self.vacation_request_user["payroll_is_approved"] = True
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"paid_days": 4},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["paid_days"], 4)
        vacation_object.refresh_from_db()
        self.assertEqual(vacation_object.paid_days, 4)

    def test_vacation_paid_days_in_list_response(self):
        """Test that paid_days is included in list response."""
        self.user.user_permissions.add(self.permission)
        self.vacation_request_user["paid_days"] = 6
        VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.get(reverse("vacation-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("paid_days", response.data[0])
        self.assertEqual(response.data[0]["paid_days"], 6)

    def test_vacation_paid_days_null_in_list_response(self):
        """Test that paid_days is null in list response when not set."""
        self.user.user_permissions.add(self.permission)
        VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.get(reverse("vacation-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("paid_days", response.data[0])
        self.assertIsNone(response.data[0]["paid_days"])


class PaidDaysTemplateTestCase(BaseTestCase):
    """Test module for paid_days feature in templates."""

    def setUp(self):
        """Create a user and vacation request for template testing."""
        super().setUp()
        self.test_user = self.create_demo_user()
        self.user.job_position.rank = 2
        self.user.job_position.save()
        self.user.area = self.test_user.area
        self.user.save()
        self.permission = Permission.objects.get(codename="payroll_approval")
        from datetime import date
        self.vacation_request_user = {
            "start_date": date(2024, 1, 2),
            "end_date": date(2024, 1, 18),
            "user": self.test_user,
            "user_job_position": self.test_user.job_position,
            "sat_is_working": True,
        }

    def test_vacation_request_template_with_paid_days(self):
        """Test that vacation request template includes paid_days when set."""
        self.user.user_permissions.add(self.permission)
        self.vacation_request_user["paid_days"] = 5
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        
        # Test the template rendering
        from django.template.loader import render_to_string
        context = {"vacation": vacation_object}
        rendered_template = render_to_string("vacation_request.html", context)
        
        # Check that the paid_days paragraph is included
        self.assertIn("Adicionalmente, solicito el pago en dinero de <strong>5</strong> días habiles de vacaciones.", rendered_template)

    def test_vacation_request_template_without_paid_days(self):
        """Test that vacation request template doesn't include paid_days when not set."""
        self.user.user_permissions.add(self.permission)
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        
        # Test the template rendering
        from django.template.loader import render_to_string
        context = {"vacation": vacation_object}
        rendered_template = render_to_string("vacation_request.html", context)
        
        # Check that the paid_days paragraph is not included
        self.assertNotIn("<strong>Nota:</strong>", rendered_template)
        self.assertNotIn("d\u00eda(s) ser\u00e1n pagados en vez de tomados como descanso", rendered_template)

    def test_vacation_response_template_with_paid_days_approved(self):
        """Test that vacation response template includes paid_days when approved."""
        self.user.user_permissions.add(self.permission)
        self.vacation_request_user["paid_days"] = 3
        self.vacation_request_user["hr_is_approved"] = True
        self.vacation_request_user["payroll_is_approved"] = True
        self.vacation_request_user["boss_is_approved"] = True
        self.vacation_request_user["manager_is_approved"] = True
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        
        # Test the template rendering
        from django.template.loader import render_to_string
        context = {"vacation": vacation_object}
        rendered_template = render_to_string("vacation_response.html", context)
        
        # Check that the paid_days paragraph is included
        self.assertIn("Se informa que los <strong>3</strong> días de vacaciones solicitados en dinero han sido autorizados, conforme a políticas internas de la empresa.", rendered_template)

    def test_vacation_response_template_without_paid_days_approved(self):
        """Test that vacation response template doesn't include paid_days when not set."""
        self.user.user_permissions.add(self.permission)
        self.vacation_request_user["hr_is_approved"] = True
        self.vacation_request_user["payroll_is_approved"] = True
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        
        # Test the template rendering
        from django.template.loader import render_to_string
        context = {"vacation": vacation_object}
        rendered_template = render_to_string("vacation_response.html", context)
        
        # Check that the paid_days paragraph is not included
        self.assertNotIn("<strong>Nota:</strong>", rendered_template)
        self.assertNotIn("d\u00eda(s) ser\u00e1n pagados en vez de tomados como descanso", rendered_template)

    def test_vacation_response_template_with_paid_days_rejected(self):
        """Test that vacation response template doesn't include paid_days when rejected."""
        self.user.user_permissions.add(self.permission)
        self.vacation_request_user["paid_days"] = 4
        # Create vacation without setting hr_is_approved to avoid triggering rejection email
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        # Use update() to avoid triggering the save method
        VacationRequest.objects.filter(pk=vacation_object.pk).update(status="RECHAZADA")
        vacation_object.refresh_from_db()
        
        # Test the template rendering
        from django.template.loader import render_to_string
        context = {"vacation": vacation_object}
        rendered_template = render_to_string("vacation_response.html", context)
        
        # Check that the paid_days paragraph is not included for rejected requests
        self.assertNotIn("<strong>Nota:</strong>", rendered_template)
        self.assertNotIn("d\u00eda(s) ser\u00e1n pagados en vez de tomados como descanso", rendered_template)

    def test_vacation_pdf_generation_with_paid_days(self):
        """Test that PDF generation works correctly with paid_days."""
        self.user.user_permissions.add(self.permission)
        self.vacation_request_user["paid_days"] = 6
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        
        # Test PDF generation
        pdf_content = vacation_object.generate_pdf()
        self.assertIsInstance(pdf_content, bytes)
        self.assertGreater(len(pdf_content), 0)

    def test_vacation_pdf_generation_without_paid_days(self):
        """Test that PDF generation works correctly without paid_days."""
        self.user.user_permissions.add(self.permission)
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        
        # Test PDF generation
        pdf_content = vacation_object.generate_pdf()
        self.assertIsInstance(pdf_content, bytes)
        self.assertGreater(len(pdf_content), 0)
=======
"""This file contains the tests for the vacation model."""

from datetime import datetime

from django.contrib.auth.models import Permission
from django.db.models import Q
from django.test import TestCase, override_settings
from django.urls import reverse
from freezegun import freeze_time
from rest_framework import status

from hierarchy.models import Area
from services.tests import BaseTestCase
from users.models import User

from .models import VacationRequest
from .serializers import VacationRequestSerializer
from .utils import get_return_date, get_working_days, is_working_day


class WorkingDayTestCase(TestCase):
    """Test module for working day utility functions."""

    def test_is_working_day(self):
        """Test the is_working_day function."""
        self.assertTrue(is_working_day("2024-01-02", True))
        self.assertFalse(is_working_day("2024-01-01", True))
        self.assertTrue(is_working_day("2024-01-05", True))
        self.assertTrue(is_working_day("2024-01-06", True))
        self.assertFalse(is_working_day("2024-01-06", False))

    def test_get_working_days_no_sat(self):
        """Test the get_working_days function."""
        self.assertEqual(get_working_days("2024-01-02", "2024-01-05", False), 4)
        self.assertEqual(get_working_days("2024-01-01", "2024-01-05", False), 4)
        # The 8th is a holiday
        self.assertEqual(get_working_days("2024-01-01", "2024-01-09", False), 5)
        self.assertEqual(get_working_days("2024-01-01", "2024-01-23", False), 15)
        self.assertEqual(get_working_days("2024-12-09", "2024-12-27", False), 14)

    def test_get_working_days_sat(self):
        """Test the get_working_days function with Saturdays."""
        self.assertEqual(get_working_days("2024-01-02", "2024-01-05", True), 4)
        self.assertEqual(get_working_days("2024-01-01", "2024-01-05", True), 4)
        # The 8th is a holiday
        self.assertEqual(get_working_days("2024-01-01", "2024-01-09", True), 6)
        self.assertEqual(get_working_days("2024-01-01", "2024-01-19", True), 15)

    def test_get_return_date(self):
        """Test the get_return_date function."""
        self.assertEqual(get_return_date("2024-08-30", False), datetime(2024, 9, 2))
        self.assertEqual(get_return_date("2024-08-30", True), datetime(2024, 8, 31))
        self.assertEqual(get_return_date("2024-09-06", False), datetime(2024, 9, 9))
        self.assertEqual(get_return_date("2024-12-31", True), datetime(2025, 1, 2))


@override_settings(DEFAULT_FILE_STORAGE="django.core.files.storage.InMemoryStorage")
@freeze_time("2024-05-01 10:00:00")
class VacationRequestModelTestCase(BaseTestCase):
    """Test module for VacationRequest model."""

    def setUp(self):
        """Create a user and a vacation request."""
        super().setUp()
        self.test_user = self.create_demo_user()
        self.user.job_position.rank = 2
        self.user.job_position.save()
        self.user.area = self.test_user.area
        self.user.save()
        self.permission = Permission.objects.get(codename="payroll_approval")
        self.vacation_request = {
            "start_date": "2024-01-02",
            "end_date": "2024-01-18",
        }
        self.vacation_request_user = {
            "start_date": "2024-01-02",
            "end_date": "2024-01-18",
            "user": self.test_user,
            "user_job_position": self.test_user.job_position,
            "sat_is_working": True,
        }

    def test_vacation_create(self):
        """Test creating a vacation endpoint."""
        self.vacation_request["hr_is_approved"] = True  # This is just a check
        self.vacation_request["sat_is_working"] = False
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["hr_is_approved"], None)
        self.assertEqual(response.data["status"], "PENDIENTE")
        self.assertEqual(response.data["user_id"], self.user.id)
        self.assertEqual(response.data.get("user_job_position"), None)
        self.assertEqual(response.data["start_date"], "2024-01-02")
        self.assertEqual(response.data["end_date"], "2024-01-18")
        vacation = VacationRequest.objects.get(pk=response.data["id"])
        self.assertEqual(vacation.user_job_position, self.user.job_position)
        self.assertEqual(vacation.user_area, self.user.area)
        self.assertEqual(vacation.sat_is_working, False)
        self.assertEqual(vacation.duration, 12)

    def test_vacation_create_no_sat_is_working(self):
        """Test creating a vacation without sat_is_working."""
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST, response.data
        )
        self.assertEqual(
            response.data["non_field_errors"][0],
            "Debes especificar si trabajas los sábados.",
        )

    @freeze_time("2024-01-01 10:00:00")
    def test_vacation_create_same_month(self):
        """Test creating a vacation that spans two months."""
        super().setUp()
        self.vacation_request["sat_is_working"] = False
        self.vacation_request["start_date"] = "2024-01-02"
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST, response.data
        )
        self.assertEqual(
            response.data["non_field_errors"][0],
            "No puedes solicitar vacaciones para el mes actual.",
        )

    def test_vacation_list_user(self):
        """Test listing all vacations endpoint for a user."""
        VacationRequest.objects.create(**self.vacation_request_user)
        self.vacation_request_user["user"] = self.user
        VacationRequest.objects.create(**self.vacation_request_user)
        self.user.job_position.rank = 1
        self.user.job_position.save()
        response = self.client.get(reverse("vacation-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_vacation_list_boss(self):
        """Test listing all vacations endpoint for a boss."""
        self.user.job_position.rank = 2
        self.user.job_position.save()
        self.test_user.area = self.user.area
        self.test_user.save()
        VacationRequest.objects.create(**self.vacation_request_user)
        VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.get(reverse("vacation-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_vacation_list_manager(self):
        """Test listing all vacations endpoint for a manager."""
        self.user.job_position.rank = 5
        self.user.job_position.save()
        self.test_user.area.manager = self.user
        self.test_user.area.save()
        VacationRequest.objects.create(**self.vacation_request_user)
        VacationRequest.objects.create(**self.vacation_request_user)
        # Change the area of the test user to match the user's area
        demo_user_admin = self.create_demo_user_admin()
        demo_user_admin.area = self.user.area
        demo_user_admin.save()
        demo_user_admin.job_position.rank = 1
        demo_user_admin.job_position.save()
        VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.get(reverse("vacation-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3, response.data)

    def test_vacation_list_manager_multiple_areas(self):
        """Test listing all vacations endpoint for a manager with multiple areas."""
        self.test_user.area.manager = self.user
        self.test_user.area.save()
        self.user.area = Area.objects.create(name="Test Area 2", manager=self.user)
        self.user.save()
        # Check that the user has a different area than the manager
        self.assertNotEqual(self.test_user.area, self.user.area)
        VacationRequest.objects.create(**self.vacation_request_user)
        self.create_demo_user()
        Area.objects.create(name="Test Area", manager=self.user)
        VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.get(reverse("vacation-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_vacation_list_payroll(self):
        """Test listing all vacations endpoint for payroll."""
        self.user.user_permissions.add(self.permission)
        VacationRequest.objects.create(**self.vacation_request_user)
        VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.get(reverse("vacation-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_vacation_list_vacation_manager(self):
        """Test listing all vacations endpoint for a vacation manager."""
        self.test_user.area.vacation_managers.add(self.user)
        VacationRequest.objects.create(**self.vacation_request_user)
        VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.get(reverse("vacation-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_vacation_list_hr(self):
        """Test listing all vacations endpoint for HR."""
        self.user.job_position.name = "GERENTE DE GESTION HUMANA"
        self.user.job_position.save()
        VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.get(reverse("vacation-list"))
        vacation_requests = VacationRequest.objects.all()
        serializer = VacationRequestSerializer(vacation_requests, many=True)
        self.assertEqual(response.data, serializer.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_vacation_retrieve(self):
        """Test retrieving a vacation endpoint."""
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.get(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["start_date"], self.vacation_request["start_date"]
        )
        self.assertEqual(response.data["end_date"], self.vacation_request["end_date"])

    def test_vacation_create_end_before_start(self):
        """Test creating a vacation with the end date before the start date."""
        self.vacation_request["end_date"] = "2021-01-04"
        self.vacation_request["sat_is_working"] = False
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["non_field_errors"][0],
            "La fecha de inicio no puede ser mayor a la fecha de fin.",
        )

    def test_vacation_owner_cancel_approved(self):
        """Test the owner cancelling an approved vacation."""
        self.vacation_request_user["boss_is_approved"] = True
        self.vacation_request_user["user"] = self.user
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"status": "CANCELADA"},
        )
        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST, response.data
        )
        self.assertEqual(
            str(response.data["non_field_errors"][0]),
            "No puedes cancelar una solicitud que ya ha recibido aprobación.",
        )

    def test_vacation_cancel_no_owner(self):
        """Test cancelling a vacation without being the owner."""
        self.vacation_request_user["user"] = self.test_user
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"status": "CANCELADA"},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    def test_vacation_boss_approve(self):
        """Test the boss approving a vacation."""
        self.user.job_position.rank = 2
        self.user.job_position.save()
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"boss_is_approved": True},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertTrue(response.data["boss_is_approved"])
        vacation_object.refresh_from_db()
        self.assertIsNotNone(vacation_object.boss_approved_at)

    def test_vacation_manager_approve(self):
        """Test the manager approving a vacation."""
        self.user.job_position.rank = 5
        self.user.job_position.save()
        self.test_user.job_position.name = "GERENTE DE GESTION HUMANA"
        self.test_user.job_position.save()
        self.vacation_request_user["boss_is_approved"] = True
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"manager_is_approved": True},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertTrue(response.data["manager_is_approved"])
        vacation_object.refresh_from_db()
        self.assertIsNotNone(vacation_object.manager_approved_at)

    def test_vacation_manager_reject(self):
        """Test the manager rejecting a vacation."""
        self.user.job_position.rank = 5
        self.user.job_position.save()
        self.vacation_request_user["boss_is_approved"] = True
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"manager_is_approved": False},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertFalse(response.data["manager_is_approved"])
        self.assertEqual(response.data["status"], "RECHAZADA")
        vacation_object.refresh_from_db()
        self.assertIsNotNone(vacation_object.manager_approved_at)

    def test_vacation_manager_approve_before_boss(self):
        """Test the manager approving a vacation before the boss."""
        self.user.job_position.rank = 5
        self.user.job_position.save()
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"manager_is_approved": True},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    def test_vacation_manager_approve_no_manager(self):
        """Test the manager approving a vacation without being a manager."""
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"manager_is_approved": True},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    def test_vacation_hr_approve(self):
        """Test HR approving a vacation."""
        self.user.job_position.name = "GERENTE DE GESTION HUMANA"
        self.user.job_position.save()
        test_user = self.create_demo_user()
        test_user.user_permissions.add(self.permission)
        self.vacation_request_user["manager_is_approved"] = True
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"hr_is_approved": True},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertTrue(response.data["hr_is_approved"])
        vacation_object.refresh_from_db()
        self.assertIsNotNone(vacation_object.hr_approved_at)

    def test_vacation_hr_reject(self):
        """Test HR rejecting a vacation."""
        self.user.job_position.name = "GERENTE DE GESTION HUMANA"
        self.user.job_position.save()
        self.vacation_request_user["manager_is_approved"] = True
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"hr_is_approved": False},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertFalse(response.data["hr_is_approved"])
        self.assertEqual(response.data["status"], "RECHAZADA")
        vacation_object.refresh_from_db()
        self.assertIsNotNone(vacation_object.hr_approved_at)

    def test_vacation_hr_approve_before_manager(self):
        """Test HR approving a vacation before the manager."""
        self.user.job_position.name = "GERENTE DE GESTION HUMANA"
        self.user.job_position.save()
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"hr_is_approved": True},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    def test_vacation_hr_approve_no_hr(self):
        """Test HR approving a vacation without being an HR."""
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"hr_is_approved": True},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    def test_vacation_payroll_approve(self):
        """Test payroll approving a vacation."""
        self.user.user_permissions.add(self.permission)
        self.vacation_request_user["hr_is_approved"] = True
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"payroll_is_approved": True},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertTrue(response.data["payroll_is_approved"])
        vacation_object.refresh_from_db()
        self.assertIsNotNone(vacation_object.payroll_approved_at)

    def test_vacation_payroll_reject(self):
        """Test payroll rejecting a vacation."""
        self.user.user_permissions.add(self.permission)
        self.vacation_request_user["hr_is_approved"] = True
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"payroll_is_approved": False},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertFalse(response.data["payroll_is_approved"])
        self.assertEqual(response.data["status"], "RECHAZADA")
        vacation_object.refresh_from_db()
        self.assertIsNotNone(vacation_object.payroll_approved_at)

    def test_vacation_payroll_approve_before_hr(self):
        """Test payroll approving a vacation before HR."""
        self.user.user_permissions.add(self.permission)
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"payroll_is_approved": True},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    def test_vacation_payroll_approve_no_payroll(self):
        """Test payroll approving a vacation without being in payroll."""
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.patch(
            reverse("vacation-detail", kwargs={"pk": vacation_object.pk}),
            {"payroll_is_approved": True},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    @freeze_time("2024-07-21 10:00:00")
    def test_validate_vacation_request_after_20th(self):
        """Test the validation of a vacation request after the 20th."""
        super().setUp()
        self.vacation_request["sat_is_working"] = False
        self.vacation_request["start_date"] = "2024-08-12"
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST, response.data
        )
        self.assertEqual(
            response.data["non_field_errors"][0],
            "Después del día 20 no puedes solicitar vacaciones para el mes siguiente.",
        )

    def test_validate_vacation_request_not_working_day(self):
        """Test the validation of a vacation request on a non-working day."""
        self.vacation_request["sat_is_working"] = False
        self.vacation_request["start_date"] = "2024-01-01"
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST, response.data
        )
        self.assertEqual(
            response.data["non_field_errors"][0],
            "No puedes iniciar tus vacaciones un día no laboral.",
        )

    def test_validate_vacation_request_not_working_day_sat(self):
        """Test the validation of a vacation request on a Saturday."""
        self.vacation_request["sat_is_working"] = False
        self.vacation_request["start_date"] = "2024-05-04"
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST, response.data
        )
        # This is fine because if the user doesn't work on Saturdays, they can't start their vacation on a Saturday
        self.assertEqual(
            response.data["non_field_errors"][0],
            "No puedes iniciar tus vacaciones un día no laboral.",
        )

    def test_validate_vacation_request_not_working_day_sat_working(self):
        """Test the validation of a vacation request on a Saturday with working Saturdays."""
        self.vacation_request["sat_is_working"] = True
        self.vacation_request["start_date"] = "2025-04-05"
        self.vacation_request["end_date"] = "2025-04-09"
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_validate_vacation_request_not_working_day_end(self):
        """Test the validation of a vacation request on a non-working day."""
        self.vacation_request["sat_is_working"] = False
        self.vacation_request["end_date"] = "2025-04-05"
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST, response.data
        )
        self.assertEqual(
            response.data["non_field_errors"][0],
            "No puedes terminar tus vacaciones un día no laboral.",
        )

    def test_validate_vacation_request_not_working_day_sat_end(self):
        """Test the validation of a vacation request on a Saturday."""
        self.vacation_request["sat_is_working"] = False
        self.vacation_request["end_date"] = "2024-05-04"
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST, response.data
        )
        # This is fine because if the user doesn't work on Saturdays, they can't end their vacation on a Saturday
        self.assertEqual(
            response.data["non_field_errors"][0],
            "No puedes terminar tus vacaciones un día no laboral.",
        )

    def test_validate_vacation_request_not_working_day_sat_working_end(self):
        """Test the validation of a vacation request on a Saturday with working Saturdays."""
        self.vacation_request["sat_is_working"] = True
        self.vacation_request["start_date"] = "2025-04-03"
        self.vacation_request["end_date"] = "2025-04-05"
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_validate_vacation_request_more_than_15_days(self):
        """Test the validation of a vacation request with more than 15 days."""
        self.vacation_request["sat_is_working"] = False
        self.vacation_request["end_date"] = "2024-01-24"
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST, response.data
        )
        self.assertEqual(
            response.data["non_field_errors"][0],
            "No puedes solicitar más de 15 días de vacaciones.",
        )

    def test_get_vacation_request(self):
        """Test getting the vacation request PDF."""
        self.user.user_permissions.add(self.permission)
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.get(
            reverse("vacation-get-request", kwargs={"pk": vacation_object.pk})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")

    def test_get_vacation_request_no_permission(self):
        """Test getting the vacation request PDF without permission."""
        self.user.job_position.rank = 1
        self.user.job_position.save()
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.get(
            reverse("vacation-get-request", kwargs={"pk": vacation_object.pk})
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_vacation_request_manager(self):
        """Test getting the vacation request PDF as a manager."""
        self.user.job_position.rank = 5
        self.user.job_position.save()
        self.test_user.area.manager = self.user
        self.test_user.area.save()
        vacation_object = VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.get(
            reverse("vacation-get-request", kwargs={"pk": vacation_object.pk})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")

    def test_get_manage_multiple_children(self):
        """Test managing multiple children."""
        self.test_user.area.parent = self.user.area
        self.test_user.area.save()
        VacationRequest.objects.create(**self.vacation_request_user)
        response = self.client.get(
            reverse("vacation-list"),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    @freeze_time("2024-05-21 10:00:00")
    def test_bypass_month_limitations(self):
        """Test bypassing the month limitation."""
        super().setUp()
        self.user.area = Area.objects.create(
            name="FISCALIA GENERAL DE LA NACION", manager=self.test_user
        )
        self.user.save()
        # Bypass get vacation on current month
        self.vacation_request["start_date"] = "2024-05-24"
        self.vacation_request["end_date"] = "2024-05-28"
        self.vacation_request["sat_is_working"] = True
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        # Bypass get vacation next month, after 20
        self.vacation_request["start_date"] = "2024-06-22"
        self.vacation_request["end_date"] = "2024-06-25"
        self.vacation_request["sat_is_working"] = True
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_vacation_area_persistence(self):
        """Test that the user's area is stored at creation time and doesn't change."""
        # Create a vacation request
        self.vacation_request["sat_is_working"] = False
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        vacation = VacationRequest.objects.get(pk=response.data["id"])
        original_area = vacation.user_area

        # Change the user's area
        new_area = Area.objects.create(name="New Test Area")
        self.user.area = new_area
        self.user.save()

        # Verify the vacation request still has the original area
        vacation.refresh_from_db()
        self.assertEqual(vacation.user_area, original_area)
        self.assertNotEqual(vacation.user_area, new_area)

    def test_vacation_area_in_response(self):
        """Test that the area is included in the API response."""
        # Create a vacation request
        self.vacation_request["sat_is_working"] = False
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Get the vacation request
        response = self.client.get(
            reverse("vacation-detail", kwargs={"pk": response.data["id"]})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["area"], self.user.area.name)

    def test_vacation_list_includes_area(self):
        """Test that the area is included in the list response."""
        # Create a vacation request
        self.vacation_request["sat_is_working"] = False
        response = self.client.post(
            reverse("vacation-list"),
            self.vacation_request,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Get the list of vacation requests
        response = self.client.get(reverse("vacation-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["area"], self.user.area.name)
