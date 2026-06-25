from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from main_app.models import Report

User = get_user_model()


class CRUDAndValidationTests(APITestCase):
    """
    MODUL 4: Pengujian CRUD dasar dan validasi input REST API.
    """

    def setUp(self):
        self.warga = User.objects.create_user(
            username='warga_crud',
            password='TestPass123!',
            is_admin=False,
            is_member=True,
            is_staff=False,
        )
        self.client.force_authenticate(user=self.warga)

    def test_FT_01_buat_laporan_dengan_data_lengkap(self):
        """
        FT-01: POST data laporan lengkap dan valid.
        Expected: HTTP 201 Created, reporter otomatis terisi, status menjadi DRAFT.
        """
        payload = {
            'title': 'Laporan Baru dari Test',
            'category': 'Infrastruktur',
            'description': 'Deskripsi laporan baru dari automated test.',
            'location': 'Gedung Lab Komputer',
        }

        response = self.client.post('/api/report/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        laporan = Report.objects.get(title='Laporan Baru dari Test')
        self.assertEqual(laporan.reporter, self.warga)
        self.assertEqual(laporan.status, 'DRAFT')
        self.assertEqual(laporan.category, 'Infrastruktur')

    def test_FT_02_ditolak_jika_judul_tidak_dikirim(self):
        """
        FT-02: POST laporan tanpa field title.
        Expected: HTTP 400 Bad Request dan data tidak tersimpan.
        """
        payload = {
            'category': 'Infrastruktur',
            'description': 'Deskripsi tanpa judul.',
            'location': 'Gedung Lab Komputer',
        }

        response = self.client.post('/api/report/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('title', response.data)
        self.assertFalse(Report.objects.filter(description='Deskripsi tanpa judul.').exists())

    def test_FT_03_ditolak_jika_deskripsi_tidak_dikirim(self):
        """
        FT-03: POST laporan tanpa field description.
        Expected: HTTP 400 Bad Request dan data tidak tersimpan.
        """
        payload = {
            'title': 'Laporan Tanpa Deskripsi',
            'category': 'Infrastruktur',
            'location': 'Gedung Lab Komputer',
        }

        response = self.client.post('/api/report/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('description', response.data)
        self.assertFalse(Report.objects.filter(title='Laporan Tanpa Deskripsi').exists())

    def test_FT_04_xss_script_disimpan_sebagai_string_literal(self):
        """
        FT-04: POST deskripsi berisi script XSS.
        Expected: HTTP 201 Created dan script tersimpan sebagai string literal.
        """
        kode_xss = '<script>alert("xss")</script>'

        payload = {
            'title': 'Laporan XSS Test',
            'category': 'Keamanan',
            'description': kode_xss,
            'location': 'Lab Keamanan Siber',
        }

        response = self.client.post('/api/report/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        laporan = Report.objects.get(title='Laporan XSS Test')
        self.assertIn('<script>', laporan.description)
        self.assertEqual(laporan.description, kode_xss)