# Generated by Django 5.1.4 on 2025-03-14 18:08

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('django_ass', '0005_alter_bill_bill_id_alter_bill_thoi_gian_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='mh',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='mat_hang_images/'),
        ),
        migrations.AddField(
            model_name='nh',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='nhom_hang_images/'),
        ),
        migrations.AlterField(
            model_name='mh',
            name='Ma_MH',
            field=models.CharField(max_length=10),
        ),
        migrations.AlterField(
            model_name='nh',
            name='Ma_NH',
            field=models.CharField(max_length=10),
        ),
        migrations.AlterField(
            model_name='pkkh',
            name='Ma_PKKH',
            field=models.CharField(max_length=3),
        ),
        migrations.AlterField(
            model_name='pkkh',
            name='Mo_Ta',
            field=models.CharField(blank=True, default=django.utils.timezone.now, max_length=255),
            preserve_default=False,
        ),
    ]
