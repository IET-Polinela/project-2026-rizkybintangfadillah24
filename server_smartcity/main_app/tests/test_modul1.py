from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AuthenticationTests(APITestCase):
    """
    MODUL 1: Pengujian autentikasi JWT dan pembatasan akses role.
    """

    def setUp(self):
        self.warga = User.objects.create_user(
            username='warga_test',
            password='Password123!',
            is_admin=False,
            is_member=True,
            is_staff=False,
        )

        self.admin = User.objects.create_user(
            username='admin_test',
            password='AdminPass123!',
            is_admin=True,
            is_member=False,
            is_staff=True,
        )

    def test_AUTH_01_login_warga_dengan_kredensial_valid(self):
        """
        AUTH-01: Login warga dengan username dan password valid.
        Expected: HTTP 200 OK, response berisi access dan refresh.
        """
        payload = {
            'username': 'warga_test',
            'password': 'Password123!',
        }

        response = self.client.post('/api/token/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_AUTH_02_login_warga_dengan_password_salah(self):
        """
        AUTH-02: Login warga dengan password salah.
        Expected: HTTP 401 Unauthorized, access token tidak diterbitkan.
        """
        payload = {
            'username': 'warga_test',
            'password': 'passwordSALAH',
        }

        response = self.client.post('/api/token/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertNotIn('access', response.data)

    def test_AUTH_03_warga_tidak_bisa_akses_halaman_dashboard_admin(self):
        """
        AUTH-03: Warga biasa mencoba mengakses halaman internal /dashboard/.
        Expected: ditolak dengan redirect/login atau forbidden.
        """
        self.client.login(username='warga_test', password='Password123!')

        response = self.client.get('/dashboard/')

        self.assertIn(
            response.status_code,
            [status.HTTP_302_FOUND, status.HTTP_403_FORBIDDEN],
        )