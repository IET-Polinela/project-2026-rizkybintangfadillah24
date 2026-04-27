from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import CustomUser


class CitizenRegistrationForm(UserCreationForm):
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'Masukkan email'
        })
    )

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password1', 'password2']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['username'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Masukkan username'
        })
        self.fields['password1'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Masukkan password'
        })
        self.fields['password2'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Konfirmasi password'
        })

    def save(self, commit=True):
        user = super().save(commit=False)
        user.is_admin = False
        user.is_member = True
        if commit:
            user.save()
        return user