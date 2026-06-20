# Generated manually for rotating 3-day family invite codes.

from datetime import timedelta

from django.db import migrations, models


def shorten_existing_invites(apps, schema_editor):
    ParentChildInvite = apps.get_model('green_app', 'ParentChildInvite')
    for invite in ParentChildInvite.objects.all():
        if invite.created_at:
            invite.expires_at = invite.created_at + timedelta(days=3)
            invite.save(update_fields=['expires_at'])


class Migration(migrations.Migration):

    dependencies = [
        ('green_app', '0007_userprofile_gender'),
    ]

    operations = [
        migrations.AlterField(
            model_name='parentchildinvite',
            name='code',
            field=models.CharField(db_index=True, max_length=7, unique=True, verbose_name='Invite code'),
        ),
        migrations.RunPython(shorten_existing_invites, migrations.RunPython.noop),
    ]
