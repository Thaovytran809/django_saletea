from django.contrib import admin
from .models import NH,MH,KH,PKKH,Bill,Bill_Line
# Register your models here.
admin.site.register(NH)
admin.site.register(MH)
admin.site.register(KH)
admin.site.register(PKKH)
admin.site.register(Bill)
admin.site.register(Bill_Line)