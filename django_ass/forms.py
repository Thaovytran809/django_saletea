from django import forms
from .models import KH, PKKH, NH, MH

class UploadFileForm(forms.Form):
    file = forms.FileField(label="Chọn file CSV")
class CustomerForm(forms.ModelForm):
    class Meta:
        model = KH
        fields = ['Ten_KH', 'Ma_PKKH']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['Ma_PKKH'].queryset = PKKH.objects.all()
class NHForm(forms.ModelForm):
    class Meta:
        model = NH
        fields = ['Ma_NH', 'Ten_NH', 'image']

class MHForm(forms.ModelForm):
    class Meta:
        model = MH
        fields = ['Ma_MH', 'Ten_MH', 'Don_Gia', 'Ma_NH', 'image']
