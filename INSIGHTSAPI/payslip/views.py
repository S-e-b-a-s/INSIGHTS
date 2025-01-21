"""Views for the payslip."""

import base64
import logging

from django.conf import settings
from django.db import connections
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.permissions import DjangoModelPermissions, IsAuthenticated
from rest_framework.response import Response

from users.models import User

from .models import Payslip
from .serializers import PayslipSerializer
from .tasks import send_email_with_attachment

logger = logging.getLogger("requests")


def convert_numeric_value(value):
    try:
        return float(value.replace(",", "."))
    except ValueError:
        return value


def send_payslip(payslips):
    payslip_data = []
    with open(str(settings.STATIC_ROOT) + "/images/Logo_cyc_text.png", "rb") as logo:
        logo = logo.read()
        logo = base64.b64encode(logo).decode("utf-8")

    for payslip in payslips:
        # iterate over the rows and multiply the values by 100 for the solidary_fund_percentage field
        payslip.solidarity_fund_percentage = "{:.1f}%".format(
            payslip.solidarity_fund_percentage * 100
        )
        payslip_data.append(payslip.to_json())
    queued_task = send_email_with_attachment.delay(
        payslip_data, logo, settings.EMAIL_HOST_USER
    )
    if not queued_task.state == "PENDING":
        return Response(
            {"error": "Ocurrió un error al enviar los desprendibles de nomina"},
            status=500,
        )
    return Response({"message": "Desprendibles de nomina enviados"}, status=201)


@api_view(["POST"])
def resend_payslip(request, pk):
    payslip = Payslip.objects.filter(pk=pk).first()
    if not payslip:
        return Response(
            {"error": "No se encontró el desprendible de nomina"}, status=404
        )
    if "email" in request.data:
        payslip.email = request.data["email"]
    response = send_payslip([payslip])
    if response.status_code == 201:
        return Response({"message": "Desprendible de nomina enviado"}, status=200)
    return response


class PayslipViewSet(viewsets.ModelViewSet):
    """Views for the payslip."""

    queryset = Payslip.objects.all()
    serializer_class = PayslipSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    def get_queryset(self):
        """Get the queryset."""
        if self.request.user.has_perm("payslip.view_payslip"):
            return Payslip.objects.all()
        return Payslip.objects.filter(identification=self.request.user.cedula)

    def create(self, request):
        """Create a payslip."""
        if not "file" in request.data:
            return Response({"error": "Debes subir un archivo"}, status=400)
        file_obj = request.data["file"]
        try:
            file_content = file_obj.read().decode("utf-8")
        except UnicodeDecodeError:
            return Response(
                {"error": "Asegúrate de guardar el archivo en formato CSV UTF-8."},
                status=400,
            )
        row_header = file_content.split("\n")[0]
        header_separated = row_header.split(";")
        header = [column.strip() for column in header_separated]
        rows = file_content.split("\n")[1:]
        payslips = []

        columns = [
            "TITULO DESPRENDIBLE",
            "CEDULA DESPRENDIBLE",
            "NOMBRE DESPRENDIBLE",
            "AREA DESPRENDIBLE",
            "CARGO DESPRENDIBLE",
            "SUELDO DESPRENDIBLE",
            "DIASLAB DESPRENDIBLE",
            "QUINCENA DESPRENDIBLE",
            "SUBSIDIOTRANS DESPRENDIBLE",
            "RODAMIENTO",
            "HORAS LABORADAS RECARGO NOCTURNO 35%",
            "RECARGO NOCTURNO 35%",
            "HORAS LABORADAS RECARGO NOCTURNO FESTIVO 75%",
            "RECARGO NOCTURNO FESTIVO 75%",
            "HORAS LABORADAS RECARGO DOMINICAL O FESTIVO 110%",
            "RECARGO DOMINICAL O FESTIVO 110%",
            "INCENTIVO DESPRENDIBLE",  # Bonus paycheck
            "PRIMA",
            "CESANTIAS",
            "TOTALDEV DESPRENDIBLE",
            "healthcare_contribution",
            "pension_contribution",
            "tax_withholding",
            "additional_deductions",
            "apsalpen",
            "solidarity_fund_percentage",
            "solidarity_fund",
            "total_deductions",
            "net_pay",
        ]

        for line in rows:
            if line.startswith(";;") or line == "":
                continue
            data = line.split(";")
            for column in columns:
                if column not in header:
                    return Response(
                        {
                            "Error": f"El archivo no tiene la columna {column}",
                        },
                        status=400,
                    )

            # Map column names to their respective data values
            data_dict = dict(zip(columns, data))

            # Query using the cedula
            user = User.objects.filter(cedula=data_dict["CEDULA DESPRENDIBLE"]).first()

            if user:
                identification = user.cedula
                email = user.email
            else:
                with connections["staffnet"].cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT * 
                        FROM personal_information 
                        JOIN employment_information 
                        ON personal_information.cedula = employment_information.cedula 
                        WHERE personal_information.cedula = %s
                        """,
                        [data_dict["CEDULA DESPRENDIBLE"]],
                    )
                    row = cursor.fetchone()
                    if cursor.description and row:
                        try:
                            db_columns = [col[0] for col in cursor.description]
                            result_dict = dict(zip(db_columns, row))
                            User.objects.create(
                                username=result_dict["usuario_windows"],
                                cedula=result_dict["cedula"],
                                first_name=result_dict["nombres"],
                                last_name=result_dict["apellidos"],
                                email=result_dict["correo"],
                            )
                            user = User.objects.get(
                                cedula=data_dict["CEDULA DESPRENDIBLE"]
                            )
                            email = user.email
                            identification = user.cedula
                        except Exception as e:
                            logger.error(e)
                            return Response(
                                {
                                    "Error": f"Ocurrió un error al crear el usuario {data_dict['NOMBRE DESPRENDIBLE']} - ({data_dict['CEDULA DESPRENDIBLE']})",
                                },
                                status=500,
                            )
                    else:
                        return Response(
                            {
                                "Error": f"No se encontró el usuario {data_dict['cedula']}, asegúrate de que esta registrado en StaffNet",
                            },
                            status=400,
                        )

            payslip = PayslipSerializer(
                data={
                    # Basic information
                    "title": data_dict["TITULO DESPRENDIBLE"],
                    "identification": identification,
                    "name": data_dict["NOMBRE DESPRENDIBLE"],
                    "area": data_dict["AREA DESPRENDIBLE"],
                    "job_title": data_dict["CARGO DESPRENDIBLE"],
                    "salary": convert_numeric_value(data_dict["SUELDO DESPRENDIBLE"]),
                    "days": data_dict["DIASLAB DESPRENDIBLE"],
                    "biweekly_period": convert_numeric_value(
                        data_dict[" QUINCENA DESPRENDIBLE "]
                    ),
                    # Earnings
                    "transport_allowance": convert_numeric_value(
                        data_dict["SUBSIDIOTRANS DESPRENDIBLE"]
                    ),
                    "bearing": convert_numeric_value(data_dict["RODAMIENTO"]),
                    "surcharge_night_shift_hours": convert_numeric_value(
                        data_dict["HORAS LABORADAS RECARGO NOCTURNO 35%"]
                    ),
                    "surcharge_night_shift_allowance": convert_numeric_value(
                        data_dict["RECARGO NOCTURNO 35%"]
                    ),
                    "surcharge_night_shift_holiday_hours": convert_numeric_value(
                        data_dict["HORAS LABORADAS RECARGO NOCTURNO FESTIVO 75%"]
                    ),
                    "surcharge_night_shift_holiday_allowance": convert_numeric_value(
                        data_dict["RECARGO NOCTURNO FESTIVO 75%"]
                    ),
                    "surcharge_holiday_hours": convert_numeric_value(
                        data_dict["HORAS LABORADAS RECARGO DOMINICAL O FESTIVO 110%"]
                    ),
                    "surcharge_holiday_allowance": convert_numeric_value(
                        data_dict["RECARGO DOMINICAL O FESTIVO 110%"]
                    ),
                    "bonus_paycheck": convert_numeric_value(
                        data_dict["INCENTIVO DESPRENDIBLE"]
                    ),
                    "biannual_bonus": convert_numeric_value(data_dict["PRIMA"]),
                    "severance": convert_numeric_value(data_dict["CESANTIAS"]),
                    "gross_earnings": convert_numeric_value(
                        data_dict["TOTALDEV DESPRENDIBLE"]
                    ),
                    # Deductions
                    "healthcare_contribution": convert_numeric_value(
                        data_dict["APORTESALUD DESPRENDIBLE"]
                    ),
                    "pension_contribution": convert_numeric_value(
                        data_dict["APORTEPENSION DESPRENDIBLE"]
                    ),
                    "tax_withholding": convert_numeric_value(
                        data_dict["RETEFUENTE DESPRENDIBLE"]
                    ),
                    "additional_deductions": convert_numeric_value(
                        data_dict["OTROSDESCUENTOS DESPRENDIBLE"]
                    ),
                    "apsalpen": convert_numeric_value(data_dict["APSALPEN INCENTIVO"]),
                    "solidarity_fund_percentage": convert_numeric_value(
                        data_dict["FONDO SOLIDARIDAD PORCENTAJE"]
                    ),
                    "solidarity_fund": convert_numeric_value(
                        data_dict["FONDO SOLIDARIDAD"]
                    ),
                    "total_deductions": convert_numeric_value(
                        data_dict["TOTALDEDUC DESPRENDIBLE"]
                    ),
                    # Final pay and contact
                    "net_pay": convert_numeric_value(
                        data_dict["TOTALRECIB DESPRENDIBLE"]
                    ),
                    "email": email,
                }
            )
            if payslip.is_valid(raise_exception=False):
                payslips.append(Payslip(**payslip.validated_data))
            else:
                return Response(
                    {"Error": payslip.errors, "cedula": data_dict["cedula"]}, status=400
                )

        Payslip.objects.bulk_create(payslips)
        # Make a pdf with the payslip and send it to the user
        return send_payslip(payslips)

    def retrieve(self, request, pk=None):
        """Retrieve a payslip."""
        payslip = Payslip.objects.filter(pk=pk).first()
        if not payslip:
            return Response(
                {"error": "No se encontró el desprendible de nomina"}, status=404
            )
        if payslip.identification == request.user.cedula or request.user.has_perm(
            "payslip.view_payslip"
        ):
            try:
                serializer = PayslipSerializer(payslip)
                return Response(serializer.data)
            except Payslip.DoesNotExist:
                return Response(
                    {"error": "No se encontró el desprendible de nomina"}, status=404
                )
        return Response(
            {"error": "No tienes permisos para ver esta información"}, status=403
        )

    # def list(self, request):
    #     """List payslips."""
    #     identification = self.request.query_params.get("identification")
    #     if request.user.has_perm("payslip.view_payslip"):
    #         payslips = Payslip.objects.all()
    #         serializer = PayslipSerializer(payslips, many=True)
    #         return Response(serializer.data)
    #     elif identification == request.user.cedula:
    #         payslips = Payslip.objects.filter(identification=identification)
    #         serializer = PayslipSerializer(payslips, many=True)
    #         return Response(serializer.data)
    #     return Response(
    #         {"error": "No tienes permisos para ver esta información"}, status=403
    #     )
