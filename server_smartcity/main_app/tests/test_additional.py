from django.contrib.auth import get_user_model
from django.test import RequestFactory, TestCase
from django.urls import reverse
from rest_framework.test import APITestCase

from main_app.models import Report
from main_app.serializers import ReportSerializer

User = get_user_model()


class SerializerAndModelCoverageTests(APITestCase):
    """
    Test tambahan untuk menaikkan coverage model dan serializer.
    """

    def setUp(self):
        self.warga = User.objects.create_user(
            username='warga_serializer',
            password='Password123!',
            is_admin=False,
            is_member=True,
            is_staff=False,
        )

        self.warga_lain = User.objects.create_user(
            username='warga_lain_serializer',
            password='Password123!',
            is_admin=False,
            is_member=True,
            is_staff=False,
        )

        self.report = Report.objects.create(
            title='Laporan Serializer Uji',
            category='Lainnya',
            description='Deskripsi serializer.',
            location='Lokasi serializer.',
            status='REPORTED',
            reporter=self.warga,
        )

    def test_report_model_str(self):
        """
        Menguji __str__ model Report.
        """
        self.assertEqual(str(self.report), 'Laporan Serializer Uji')

    def test_report_serializer_tanpa_request_context(self):
        """
        Serializer tanpa request context harus menghasilkan is_owner False.
        """
        serializer = ReportSerializer(self.report, context={})

        self.assertEqual(serializer.data['reporter'], 'Warga Anonim')
        self.assertFalse(serializer.data['is_owner'])

    def test_report_serializer_dengan_request_owner(self):
        """
        Serializer dengan request user pemilik harus menghasilkan is_owner True.
        """
        factory = RequestFactory()
        request = factory.get('/api/report/')
        request.user = self.warga

        serializer = ReportSerializer(self.report, context={'request': request})

        self.assertEqual(serializer.data['reporter'], 'Warga Anonim')
        self.assertTrue(serializer.data['is_owner'])

    def test_report_serializer_dengan_request_bukan_owner(self):
        """
        Serializer dengan request user bukan pemilik harus menghasilkan is_owner False.
        """
        factory = RequestFactory()
        request = factory.get('/api/report/')
        request.user = self.warga_lain

        serializer = ReportSerializer(self.report, context={'request': request})

        self.assertEqual(serializer.data['reporter'], 'Warga Anonim')
        self.assertFalse(serializer.data['is_owner'])

    def test_report_model_default_status_reported(self):
        """
        Menguji default status model Report saat dibuat langsung melalui ORM.
        """
        report = Report.objects.create(
            title='Laporan Status Default',
            category='Infrastruktur',
            description='Deskripsi status default.',
            location='Lokasi status default.',
            reporter=self.warga,
        )

        self.assertEqual(report.status, 'REPORTED')


class MainAppMonolithicViewsCoverageTests(TestCase):
    """
    Test tambahan untuk view monolitik di main_app/views.py.
    """

    def setUp(self):
        self.admin = User.objects.create_user(
            username='admin_mono',
            password='Password123!',
            is_admin=True,
            is_member=False,
            is_staff=True,
        )

        self.citizen = User.objects.create_user(
            username='citizen_mono',
            password='Password123!',
            is_admin=False,
            is_member=True,
            is_staff=False,
        )

        self.report = Report.objects.create(
            title='Laporan Monolitik Uji',
            category='Infrastruktur',
            description='Ada kerusakan infrastruktur.',
            location='Bandung',
            status='REPORTED',
            reporter=self.citizen,
        )

        self.draft_report = Report.objects.create(
            title='Draft Tidak Muncul',
            category='Kebersihan',
            description='Draft ini tidak boleh muncul di daftar publik admin.',
            location='Lampung',
            status='DRAFT',
            reporter=self.citizen,
        )

    def test_home_view(self):
        """
        Menguji halaman home dapat diakses.
        """
        response = self.client.get(reverse('home'))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'main_app/home.html')

    def test_report_list_view_returns_200(self):
        """
        Menguji halaman daftar laporan dapat dirender.
        """
        response = self.client.get(reverse('report_list'))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'main_app/report_list.html')

    def test_report_list_view_excludes_draft(self):
        """
        Menguji daftar laporan tidak menampilkan laporan berstatus DRAFT.
        """
        response = self.client.get(reverse('report_list'))

        self.assertEqual(response.status_code, 200)

        reports = list(response.context['reports'])
        report_ids = [report.id for report in reports]

        self.assertIn(self.report.id, report_ids)
        self.assertNotIn(self.draft_report.id, report_ids)

    def test_report_detail_view_valid(self):
        """
        Menguji halaman detail laporan valid.
        """
        response = self.client.get(
            reverse('report_detail', kwargs={'pk': self.report.id})
        )

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'main_app/report_detail.html')

    def test_report_detail_view_invalid(self):
        """
        Menguji halaman detail laporan dengan ID tidak valid.
        """
        response = self.client.get(
            reverse('report_detail', kwargs={'pk': 999999})
        )

        self.assertEqual(response.status_code, 404)

    def test_report_detail_json_valid(self):
        """
        Menguji endpoint JSON detail laporan valid.
        """
        response = self.client.get(
            reverse('report_detail_json', kwargs={'pk': self.report.id})
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(data['id'], self.report.id)
        self.assertEqual(data['title'], 'Laporan Monolitik Uji')
        self.assertEqual(data['status'], 'REPORTED')

    def test_report_detail_json_invalid(self):
        """
        Menguji endpoint JSON detail laporan dengan ID tidak valid.
        """
        response = self.client.get(
            reverse('report_detail_json', kwargs={'pk': 999999})
        )

        self.assertEqual(response.status_code, 404)

    def test_report_search_json_tanpa_query(self):
        """
        Menguji endpoint search JSON tanpa query.
        """
        response = self.client.get(reverse('report_search_json'))

        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIn('reports', data)
        self.assertGreaterEqual(len(data['reports']), 1)

    def test_report_search_json_dengan_query(self):
        """
        Menguji endpoint search JSON dengan query yang cocok.
        """
        response = self.client.get(
            reverse('report_search_json') + '?q=Monolitik'
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIn('reports', data)
        self.assertGreaterEqual(len(data['reports']), 1)
        self.assertEqual(data['reports'][0]['title'], 'Laporan Monolitik Uji')

    def test_report_search_json_excludes_draft(self):
        """
        Menguji search JSON tidak menampilkan laporan DRAFT.
        """
        response = self.client.get(
            reverse('report_search_json') + '?q=Draft'
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()
        returned_titles = [item['title'] for item in data['reports']]

        self.assertNotIn('Draft Tidak Muncul', returned_titles)

    def test_report_create_view_unauthenticated_redirect(self):
        """
        Menguji user belum login tidak bisa membuka halaman tambah laporan.
        """
        response = self.client.get(reverse('add_report'))

        self.assertEqual(response.status_code, 302)

    def test_report_create_view_citizen_redirect(self):
        """
        Menguji citizen biasa tidak bisa membuka halaman tambah laporan admin.
        """
        self.client.login(username='citizen_mono', password='Password123!')

        response = self.client.get(reverse('add_report'))

        self.assertEqual(response.status_code, 302)

    def test_report_create_view_admin_get(self):
        """
        Menguji admin bisa membuka halaman tambah laporan.
        """
        self.client.login(username='admin_mono', password='Password123!')

        response = self.client.get(reverse('add_report'))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'main_app/add_report.html')

    def test_report_create_view_admin_post_valid(self):
        """
        Menguji admin bisa membuat laporan melalui form monolitik.
        """
        self.client.login(username='admin_mono', password='Password123!')

        payload = {
            'title': 'Laporan Form Baru',
            'category': 'Infrastruktur',
            'description': 'Deskripsi baru dari form.',
            'location': 'Jakarta',
            'status': 'DRAFT',
        }

        response = self.client.post(reverse('add_report'), payload)

        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('report_list'))
        self.assertTrue(
            Report.objects.filter(title='Laporan Form Baru').exists()
        )

    def test_report_update_view_unauthenticated_redirect(self):
        """
        Menguji user belum login tidak bisa membuka halaman edit laporan.
        """
        response = self.client.get(
            reverse('edit_report', kwargs={'pk': self.report.id})
        )

        self.assertEqual(response.status_code, 302)

    def test_report_update_view_citizen_redirect(self):
        """
        Menguji citizen biasa tidak bisa membuka halaman edit laporan admin.
        """
        self.client.login(username='citizen_mono', password='Password123!')

        response = self.client.get(
            reverse('edit_report', kwargs={'pk': self.report.id})
        )

        self.assertEqual(response.status_code, 302)

    def test_report_update_view_admin_get_forbidden(self):
        """
        Menguji admin tidak boleh membuka halaman edit isi laporan.
        """
        self.client.login(username='admin_mono', password='Password123!')

        response = self.client.get(
            reverse('edit_report', kwargs={'pk': self.report.id})
        )

        self.assertEqual(response.status_code, 403)

    def test_report_update_view_admin_post_forbidden_data_tetap(self):
        """
        Menguji admin tidak boleh mengubah isi laporan dan data tetap sama.
        """
        self.client.login(username='admin_mono', password='Password123!')

        original_title = self.report.title
        original_category = self.report.category
        original_description = self.report.description
        original_location = self.report.location
        original_status = self.report.status

        payload = {
            'title': 'Laporan Terupdate Oleh Admin',
            'category': 'Infrastruktur',
            'description': 'Deskripsi terupdate.',
            'location': 'Jakarta',
            'status': 'REPORTED',
        }

        response = self.client.post(
            reverse('edit_report', kwargs={'pk': self.report.id}),
            payload,
        )

        self.assertEqual(response.status_code, 403)

        self.report.refresh_from_db()
        self.assertEqual(self.report.title, original_title)
        self.assertEqual(self.report.category, original_category)
        self.assertEqual(self.report.description, original_description)
        self.assertEqual(self.report.location, original_location)
        self.assertEqual(self.report.status, original_status)

    def test_report_delete_view_unauthenticated_redirect(self):
        """
        Menguji user belum login tidak bisa membuka halaman hapus laporan.
        """
        response = self.client.get(
            reverse('delete_report', kwargs={'pk': self.report.id})
        )

        self.assertEqual(response.status_code, 302)

    def test_report_delete_view_citizen_redirect(self):
        """
        Menguji citizen biasa tidak bisa membuka halaman hapus laporan admin.
        """
        self.client.login(username='citizen_mono', password='Password123!')

        response = self.client.get(
            reverse('delete_report', kwargs={'pk': self.report.id})
        )

        self.assertEqual(response.status_code, 302)

    def test_report_delete_view_admin_get_forbidden(self):
        """
        Menguji admin tidak boleh membuka halaman hapus laporan.
        """
        self.client.login(username='admin_mono', password='Password123!')

        response = self.client.get(
            reverse('delete_report', kwargs={'pk': self.report.id})
        )

        self.assertEqual(response.status_code, 403)

    def test_report_delete_view_admin_post_forbidden_data_tetap(self):
        """
        Menguji admin tidak boleh menghapus laporan dan data tetap tersedia.
        """
        self.client.login(username='admin_mono', password='Password123!')

        response = self.client.post(
            reverse('delete_report', kwargs={'pk': self.report.id})
        )

        self.assertEqual(response.status_code, 403)
        self.assertTrue(Report.objects.filter(id=self.report.id).exists())

    def test_report_update_status_valid_transition(self):
        """
        Menguji admin bisa mengubah status REPORTED menjadi VERIFIED.
        """
        self.client.login(username='admin_mono', password='Password123!')

        response = self.client.post(
            reverse('update_status', kwargs={'pk': self.report.id}),
            {'status': 'VERIFIED'},
        )

        self.assertEqual(response.status_code, 302)

        self.report.refresh_from_db()
        self.assertEqual(self.report.status, 'VERIFIED')

    def test_report_update_status_invalid_transition_tidak_mengubah_status(self):
        """
        Menguji admin tidak bisa lompat status REPORTED langsung ke RESOLVED.
        """
        self.client.login(username='admin_mono', password='Password123!')

        response = self.client.post(
            reverse('update_status', kwargs={'pk': self.report.id}),
            {'status': 'RESOLVED'},
        )

        self.assertEqual(response.status_code, 302)

        self.report.refresh_from_db()
        self.assertEqual(self.report.status, 'REPORTED')