from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from main_app.models import Report

User = get_user_model()


class PrivacyAndDataHidingTests(APITestCase):
    """
    MODUL 2: Pengujian visibilitas data dan privasi pelapor.
    """

    def setUp(self):
        self.warga_a = User.objects.create_user(
            username='warga_a',
            password='TestPass123!',
            is_admin=False,
            is_member=True,
            is_staff=False,
        )

        self.warga_b = User.objects.create_user(
            username='warga_b',
            password='TestPass123!',
            is_admin=False,
            is_member=True,
            is_staff=False,
        )

        self.draft_milik_b = Report.objects.create(
            title='Draf Rahasia Warga B',
            category='Infrastruktur',
            description='Ini adalah draf milik warga B.',
            location='Lokasi Rahasia',
            status='DRAFT',
            reporter=self.warga_b,
        )

        self.laporan_publik_a = Report.objects.create(
            title='Jalan Berlubang Milik Warga A',
            category='Infrastruktur',
            description='Ada lubang besar di jalan depan kampus.',
            location='Jl. Soekarno Hatta',
            status='REPORTED',
            reporter=self.warga_a,
        )

        self.laporan_publik_b = Report.objects.create(
            title='Sampah Menumpuk Milik Warga B',
            category='Kebersihan',
            description='Sampah menumpuk selama beberapa hari.',
            location='Jl. Gatot Subroto',
            status='REPORTED',
            reporter=self.warga_b,
        )

    def test_PRIV_01_feed_kota_menyembunyikan_identitas_reporter(self):
        """
        PRIV-01: Warga A membuka feed publik.
        Expected: laporan publik menampilkan reporter sebagai Warga Anonim.
        """
        self.client.force_authenticate(user=self.warga_a)

        response = self.client.get('/api/report/?tab=feed')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = response.data.get('results', [])
        self.assertGreater(len(results), 0)

        for laporan in results:
            self.assertEqual(laporan['reporter'], 'Warga Anonim')
            self.assertFalse(laporan['is_owner'])

    def test_PRIV_02_laporan_saya_menampilkan_data_milik_sendiri(self):
        """
        PRIV-02: Warga A membuka tab my_reports.
        Expected: hanya laporan milik Warga A yang muncul dan is_owner bernilai True.
        """
        self.client.force_authenticate(user=self.warga_a)

        response = self.client.get('/api/report/?tab=my_reports')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = response.data.get('results', [])
        self.assertGreater(len(results), 0)

        returned_ids = [item['id'] for item in results]

        self.assertIn(self.laporan_publik_a.id, returned_ids)
        self.assertNotIn(self.laporan_publik_b.id, returned_ids)
        self.assertNotIn(self.draft_milik_b.id, returned_ids)

        for laporan in results:
            self.assertEqual(laporan['reporter'], 'Warga Anonim')
            self.assertTrue(laporan['is_owner'])

    def test_PRIV_03_tidak_bisa_baca_draf_orang_lain(self):
        """
        PRIV-03: Warga A mencoba membaca detail draft milik Warga B.
        Expected: HTTP 404 Not Found.
        """
        self.client.force_authenticate(user=self.warga_a)

        response = self.client.get(f'/api/report/{self.draft_milik_b.id}/')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_PRIV_04_tidak_bisa_modifikasi_draf_orang_lain(self):
        """
        PRIV-04: Warga A mencoba mengubah draft milik Warga B.
        Expected: HTTP 404 Not Found dan data asli tetap aman.
        """
        self.client.force_authenticate(user=self.warga_a)

        payload = {
            'title': 'Judul Diubah Paksa',
            'category': self.draft_milik_b.category,
            'description': 'Deskripsi diubah paksa.',
            'location': self.draft_milik_b.location,
        }

        response = self.client.put(
            f'/api/report/{self.draft_milik_b.id}/',
            payload,
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        self.draft_milik_b.refresh_from_db()
        self.assertEqual(self.draft_milik_b.title, 'Draf Rahasia Warga B')
        self.assertEqual(self.draft_milik_b.description, 'Ini adalah draf milik warga B.')