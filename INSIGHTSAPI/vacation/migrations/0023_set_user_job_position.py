from django.db import migrations


def set_user_job_position(apps, schema_editor):
    # Get the models involved
    VacationRequest = apps.get_model("vacation", "VacationRequest")
    User = apps.get_model("users", "User")

    # Iterate over all VacationRequest instances to set user_job_position
    for request in VacationRequest.objects.all():
        if request.user and request.user.job_position:
            request.user_job_position = request.user.job_position
            request.save(update_fields=["user_job_position"])


class Migration(migrations.Migration):
    operations = [
        migrations.RunPython(set_user_job_position),
    ]

    dependencies = [
        ("vacation", "0022_alter_vacationrequest_sat_is_working"),
    ]
