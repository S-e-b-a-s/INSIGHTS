# Generated manually

from django.db import migrations, models
import decimal


class Migration(migrations.Migration):

    dependencies = [
        ('payslip', '0009_payslip_bearing'),
    ]

    operations = [
        migrations.AddField(
            model_name='payslip',
            name='disability_days',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='payslip',
            name='disability_value',
            field=models.DecimalField(decimal_places=2, default=decimal.Decimal('0'), max_digits=12),
        ),
    ]