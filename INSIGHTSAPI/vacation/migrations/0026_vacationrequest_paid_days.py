# Generated manually for adding paid_days field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('vacation', '0025_populate_user_area'),
    ]

    operations = [
        migrations.AddField(
            model_name='vacationrequest',
            name='paid_days',
            field=models.PositiveIntegerField(blank=True, help_text='Días a pagar en vez de tomar, opcional.', null=True),
        ),
    ] 