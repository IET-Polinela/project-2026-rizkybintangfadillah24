from django.contrib.auth import get_user_model
from django.urls import reverse
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from main_app.models import Report

User = get_user_model()


class WorkflowStateTests(APITestCase):
    """
    MODUL 3: Pengujian alur kerja status laporan melalui REST API.
    """

    def setUp(self):
        self.warga = User.objects.create_user(
            username='warga_wf',
            password='TestPass123!',
            is_admin=False,
            is_member=True,
            is_staff=False,
        )

        self.laporan_draft = Report.objects.create(
            title='Lampu Kampus Mati',
            category='Fasilitas Umum',
            description='Lampu di depan gedung rektorat tidak menyala.',
            location='Gedung Rektorat',
            status='DRAFT',
            reporter=self.warga,
        )

        self.laporan_reported = Report.objects.create(
            title='Saluran Air Tersumbat',
            category='Infrastruktur',
            description='Saluran air di samping kantin tersumbat.',
            location='Kantin Polinela',
            status='REPORTED',
            reporter=self.warga,
        )

        self.laporan_resolved = Report.objects.create(
            title='AC Rusak di Lab',
            category='Fasilitas Umum',
            description='AC di Lab CPS 1 sudah diperbaiki.',
            location='Lab CPS 1',
            status='RESOLVED',
            reporter=self.warga,
        )

    def test_WF_01_warga_mengajukan_draf_menjadi_reported(self):
        """
        WF-01: Pemilik draft mengajukan laporan.
        Expected: POST /submit/ berhasil dan status berubah menjadi REPORTED.
        """
        self.client.force_authenticate(user=self.warga)

        response = self.client.post(f'/api/report/{self.laporan_draft.id}/submit/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.laporan_draft.refresh_from_db()
        self.assertEqual(self.laporan_draft.status, 'REPORTED')

    def test_WF_02_tidak_bisa_edit_laporan_yang_sudah_reported(self):
        """
        WF-02: Warga mencoba mengedit laporan yang sudah REPORTED.
        Expected: HTTP 403 Forbidden dan data tidak berubah.
        """
        self.client.force_authenticate(user=self.warga)

        payload = {
            'title': 'Judul Tidak Boleh Berubah',
            'category': self.laporan_reported.category,
            'description': 'Deskripsi tidak boleh berubah.',
            'location': self.laporan_reported.location,
        }

        response = self.client.put(
            f'/api/report/{self.laporan_reported.id}/',
            payload,
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.laporan_reported.refresh_from_db()
        self.assertEqual(self.laporan_reported.title, 'Saluran Air Tersumbat')
        self.assertEqual(self.laporan_reported.description, 'Saluran air di samping kantin tersumbat.')

    def test_WF_05_laporan_resolved_tidak_bisa_diubah(self):
        """
        WF-05: Warga mencoba mengubah laporan yang sudah RESOLVED.
        Expected: HTTP 403 Forbidden dan data tetap aman.
        """
        self.client.force_authenticate(user=self.warga)

        payload = {
            'title': 'Judul RESOLVED Diubah Paksa',
            'category': self.laporan_resolved.category,
            'description': 'Deskripsi RESOLVED diubah paksa.',
            'location': self.laporan_resolved.location,
        }

        response = self.client.put(
            f'/api/report/{self.laporan_resolved.id}/',
            payload,
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.laporan_resolved.refresh_from_db()
        self.assertEqual(self.laporan_resolved.title, 'AC Rusak di Lab')
        self.assertEqual(self.laporan_resolved.status, 'RESOLVED')


class AdminWorkflowTests(TestCase):
    """
    MODUL 3b: Pengujian alur kerja status pada portal admin monolitik.
    """

    def setUp(self):
        self.admin = User.objects.create_user(
            username='admin_portal',
            password='AdminPass123!',
            is_admin=True,
            is_member=False,
            is_staff=True,
        )

        self.reporter = User.objects.create_user(
            username='warga_admin_wf',
            password='TestPass123!',
            is_admin=False,
            is_member=True,
            is_staff=False,
        )

        self.laporan_reported = Report.objects.create(
            title='Jalan Rusak di Blok C',
            category='Infrastruktur',
            description='Jalan berlubang parah di area parkir Blok C.',
            location='Blok C Polinela',
            status='REPORTED',
            reporter=self.reporter,
        )

    def test_WF_03_admin_mengubah_status_reported_ke_verified(self):
        """
        WF-03: Admin mengubah status laporan dari REPORTED ke VERIFIED.
        Expected: redirect dan status berubah menjadi VERIFIED.
        """
        self.client.login(username='admin_portal', password='AdminPass123!')

        response = self.client.post(
            reverse('update_status', kwargs={'pk': self.laporan_reported.id}),
            {'status': 'VERIFIED'},
        )

        self.assertEqual(response.status_code, status.HTTP_302_FOUND)

        self.laporan_reported.refresh_from_db()
        self.assertEqual(self.laporan_reported.status, 'VERIFIED')

    def test_WF_04_tidak_bisa_lompat_langsung_dari_reported_ke_resolved(self):
        """
        WF-04: Admin mencoba lompat status dari REPORTED langsung ke RESOLVED.
        Expected: request redirect, tetapi status tetap REPORTED.
        """
        self.client.login(username='admin_portal', password='AdminPass123!')

        response = self.client.post(
            reverse('update_status', kwargs={'pk': self.laporan_reported.id}),
            {'status': 'RESOLVED'},
        )

        self.assertEqual(response.status_code, status.HTTP_302_FOUND)

        self.laporan_reported.refresh_from_db()
        self.assertEqual(self.laporan_reported.status, 'REPORTED')