from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
# Create your models here.
class NH(models.Model):
    Ma_NH = models.CharField(max_length=10)
    Ten_NH = models.CharField(max_length=100, null=True)
    image = models.ImageField(upload_to='nhom_hang_images/', null=True, blank=True)
    def __str__(self):
        return f"[{self.Ma_NH}] {self.Ten_NH}"

class MH(models.Model):
    Ma_MH = models.CharField(max_length=10)
    Ten_MH = models.CharField(max_length=100, null=True)
    Don_Gia = models.FloatField(validators=[MinValueValidator(0.0)])
    Ma_NH = models.ForeignKey(NH, on_delete=models.CASCADE)
    image = models.ImageField(upload_to='mat_hang_images/', null=True, blank=True)
    def __str__(self):
        return f"[{self.Ma_MH}] {self.Ten_MH}"  

class PKKH(models.Model):
    Ma_PKKH = models.CharField(max_length=3)
    Mo_Ta = models.CharField(max_length=255, blank=True)
    def __str__(self):
        return f"[{self.Ma_PKKH}] {self.Mo_Ta}"
    
class KH(models.Model):
    Ma_KH = models.CharField(max_length=10, unique=True)
    Ten_KH = models.CharField(max_length=100, null=True)
    Ma_PKKH = models.ForeignKey(PKKH, on_delete=models.CASCADE)

    def save(self, *args, **kwargs):
        if not self.Ma_KH:
            last_cus = KH.objects.order_by('-id').first()
            if last_cus and last_cus.Ma_KH.startswith('CUZ'):
                hau_to = int(last_cus.Ma_KH[3:])
                new_id = f"CUZ{hau_to + 1:05d}" 
            else:
                new_id = "CUZ00001"
            self.Ma_KH = new_id
        super().save(*args, **kwargs)

class Bill(models.Model):
    Bill_id = models.CharField(max_length=10, unique=True)
    Thoi_gian = models.DateTimeField(default=timezone.now)
    Ma_KH = models.ForeignKey(KH, on_delete=models.CASCADE)

    def save(self, *args, **kwargs):
        if not self.Bill_id:
            last_bill = Bill.objects.order_by('-id').first()
            if last_bill and last_bill.Bill_id.startswith('ORD'):
                hau_to = int(last_bill.Bill_id[3:])
                new_id = f"ORD{hau_to + 1:07d}" 
            else:
                new_id = "ORD0000001"
            self.Bill_id = new_id
        super().save(*args, **kwargs)

class Bill_Line(models.Model):
    Line_id = models.CharField(max_length=10)
    SL = models.IntegerField(validators=[MinValueValidator(0)])
    Bill_id = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name='bill_lines')
    Ma_MH = models.ForeignKey(MH, on_delete=models.CASCADE)

    def save(self, *args, **kwargs):
        if not self.Line_id:
            last_line = Bill_Line.objects.order_by('-id').first()
            if last_line and last_line.Line_id.startswith('LN'):
                hau_to = int(last_line.Line_id[2:])
                new_id = f"LN{hau_to + 1:05d}"
            else:
                new_id = "LN00001"
            self.Line_id = new_id
        super().save(*args, **kwargs)





     


