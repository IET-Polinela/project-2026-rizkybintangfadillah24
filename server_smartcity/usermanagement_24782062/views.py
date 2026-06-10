from django.contrib import messages
from django.contrib.auth.views import LoginView, LogoutView
from django.shortcuts import redirect, render
from django.urls import reverse_lazy
from django.views import View

from .forms import CitizenRegistrationForm


class CustomLoginView(LoginView):
    template_name = 'usermanagement_24782062/login.html'
    redirect_authenticated_user = True

    def form_valid(self, form):
        messages.success(self.request, 'Berhasil login.')
        return super().form_valid(form)

    def get_success_url(self):
        return reverse_lazy('report_list')


class CustomLogoutView(LogoutView):
    def dispatch(self, request, *args, **kwargs):
        messages.success(request, 'Berhasil logout.')
        return super().dispatch(request, *args, **kwargs)


class RegisterView(View):
    template_name = 'usermanagement_24782062/register.html'

    def get(self, request):
        form = CitizenRegistrationForm()
        return render(request, self.template_name, {'form': form})

    def post(self, request):
        form = CitizenRegistrationForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Registrasi berhasil. Silakan login.')
            return redirect('login')
        return render(request, self.template_name, {'form': form})