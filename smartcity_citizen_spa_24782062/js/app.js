let currentTab = 'my_reports';
let currentPage = 1;
let editingReportId = null;
let reportModalInstance = null;

function renderLoginPage() {
    const appContent = document.getElementById('app-content');

    updateNavbarUsername();

    appContent.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-12 col-md-6 col-lg-5">
                <div class="card portal-card shadow-sm">
                    <div class="card-body p-4">
                        <div class="text-center mb-4">
                            <i class="bi bi-person-circle display-4 text-primary"></i>
                            <h3 class="mt-3 mb-1">Login Citizen</h3>
                            <p class="text-muted mb-0">Masuk menggunakan akun Citizen yang sudah terdaftar.</p>
                        </div>

                        <div id="loginMessage"></div>

                        <form id="loginForm">
                            <div class="mb-3">
                                <label for="username" class="form-label">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    class="form-control"
                                    placeholder="Masukkan username"
                                    required
                                >
                            </div>

                            <div class="mb-3">
                                <label for="password" class="form-label">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    class="form-control"
                                    placeholder="Masukkan password"
                                    required
                                >
                            </div>

                            <button type="submit" class="btn btn-primary w-100">
                                <i class="bi bi-box-arrow-in-right me-1"></i>Login
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    setupLoginForm();
}

function renderDashboardPage() {
    const appContent = document.getElementById('app-content');

    if (!isAuthenticated()) {
        window.location.hash = '#login';
        return;
    }

    updateNavbarUsername();

    appContent.innerHTML = `
        <div class="dashboard-shell">
            <div class="row g-3">
                <aside class="col-12 col-lg-3 col-xl-2">
                    <button type="button" class="btn btn-primary w-100 sidebar-create-button mb-3" id="openCreateModalButton">
                        <i class="bi bi-plus-circle-fill me-1"></i>Buat Laporan Baru
                    </button>

                    <div class="card portal-card shadow-sm">
                        <div class="card-body">
                            <div class="sidebar-title mb-2">
                                <i class="bi bi-activity me-1"></i>Status Laporan Anda
                            </div>

                            <div class="summary-row">
                                <div class="summary-label">
                                    <i class="bi bi-pencil-square text-secondary"></i>
                                    <span>Draf</span>
                                </div>
                                <span class="badge text-bg-secondary summary-badge" id="summaryDraft">0</span>
                            </div>

                            <div class="summary-row">
                                <div class="summary-label">
                                    <i class="bi bi-send-fill text-warning"></i>
                                    <span>Diajukan</span>
                                </div>
                                <span class="badge text-bg-warning summary-badge" id="summaryReported">0</span>
                            </div>

                            <div class="summary-row">
                                <div class="summary-label">
                                    <i class="bi bi-shield-check text-info"></i>
                                    <span>Diverifikasi</span>
                                </div>
                                <span class="badge text-bg-info summary-badge" id="summaryVerified">0</span>
                            </div>

                            <div class="summary-row">
                                <div class="summary-label">
                                    <i class="bi bi-gear-fill text-primary"></i>
                                    <span>Diproses</span>
                                </div>
                                <span class="badge text-bg-primary summary-badge" id="summaryInProgress">0</span>
                            </div>

                            <div class="summary-row">
                                <div class="summary-label">
                                    <i class="bi bi-check-circle-fill text-success"></i>
                                    <span>Selesai</span>
                                </div>
                                <span class="badge text-bg-success summary-badge" id="summaryResolved">0</span>
                            </div>
                        </div>
                    </div>
                </aside>

                <section class="col-12 col-lg-9 col-xl-10">
                    <div class="report-board">
                        <ul class="nav report-tabs mb-3" id="reportTabs">
                            <li class="nav-item">
                                <button class="nav-link active" type="button" id="myReportsTabButton">
                                    <i class="bi bi-folder-fill me-1"></i>Laporan Saya
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" type="button" id="feedTabButton">
                                    <i class="bi bi-globe-americas me-1"></i>Feed Kota Publik
                                </button>
                            </li>
                        </ul>

                        <div id="reportListContainer">
                            <div class="text-center py-5 text-muted">
                                <div class="spinner-border text-primary mb-3" role="status"></div>
                                <p>Memuat data laporan...</p>
                            </div>
                        </div>

                        <div id="paginationContainer" class="mt-3"></div>
                    </div>
                </section>
            </div>
        </div>
    `;

    setupDashboardEvents();
    loadDashboardData(currentTab, currentPage);
}

function setupDashboardEvents() {
    const myReportsTabButton = document.getElementById('myReportsTabButton');
    const feedTabButton = document.getElementById('feedTabButton');
    const openCreateModalButton = document.getElementById('openCreateModalButton');

    myReportsTabButton.addEventListener('click', function () {
        currentTab = 'my_reports';
        currentPage = 1;
        myReportsTabButton.classList.add('active');
        feedTabButton.classList.remove('active');
        loadDashboardData(currentTab, currentPage);
    });

    feedTabButton.addEventListener('click', function () {
        currentTab = 'feed';
        currentPage = 1;
        feedTabButton.classList.add('active');
        myReportsTabButton.classList.remove('active');
        loadDashboardData(currentTab, currentPage);
    });

    openCreateModalButton.addEventListener('click', function () {
        openCreateModal();
    });

    setupReportModalButtons();
}

function setupReportModalButtons() {
    const saveDraftButton = document.getElementById('saveDraftButton');
    const submitReportButton = document.getElementById('submitReportButton');

    saveDraftButton.onclick = function () {
        submitReportForm(false);
    };

    submitReportButton.onclick = function () {
        submitReportForm(true);
    };
}

async function loadDashboardData(tab = 'my_reports', page = 1) {
    currentTab = tab;
    currentPage = page;

    const reportListContainer = document.getElementById('reportListContainer');
    const paginationContainer = document.getElementById('paginationContainer');

    reportListContainer.innerHTML = `
        <div class="text-center py-5 text-muted">
            <div class="spinner-border text-primary mb-3" role="status"></div>
            <p>Memuat data laporan...</p>
        </div>
    `;
    paginationContainer.innerHTML = '';

    try {
        const endpoint = `/api/report/?tab=${encodeURIComponent(tab)}&page=${page}`;
        const result = await requestAPI(endpoint, 'GET');

        if (result.ok && result.status === 200) {
            const paginatedData = result.data;
            const reports = paginatedData.results || [];

            renderList(reports, tab);
            renderPagination(paginatedData, tab, page);
            loadSummaryStats();
        } else if (result.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('username');
            updateNavbarUsername();
            window.location.hash = '#login';
        } else {
            reportListContainer.innerHTML = `
                <div class="alert alert-danger">
                    Gagal memuat data laporan dari server.
                </div>
            `;
        }
    } catch (error) {
        console.error('Gagal memuat data dashboard:', error);
        reportListContainer.innerHTML = `
            <div class="alert alert-danger">
                Tidak dapat terhubung ke backend API.
            </div>
        `;
    }
}

async function loadSummaryStats() {
    try {
        const result = await requestAPI('/api/report/?tab=my_reports&page_size=1000', 'GET');

        if (!result.ok || result.status !== 200) {
            return;
        }

        const reports = result.data.results || [];

        const totalDraft = reports.filter(report => report.status === 'DRAFT').length;
        const totalReported = reports.filter(report => report.status === 'REPORTED').length;
        const totalVerified = reports.filter(report => report.status === 'VERIFIED').length;
        const totalInProgress = reports.filter(report => report.status === 'IN_PROGRESS').length;
        const totalResolved = reports.filter(report => report.status === 'RESOLVED').length;

        document.getElementById('summaryDraft').textContent = totalDraft;
        document.getElementById('summaryReported').textContent = totalReported;
        document.getElementById('summaryVerified').textContent = totalVerified;
        document.getElementById('summaryInProgress').textContent = totalInProgress;
        document.getElementById('summaryResolved').textContent = totalResolved;
    } catch (error) {
        console.error('Gagal memuat rekap status:', error);
    }
}

function renderList(reports, tab) {
    const reportListContainer = document.getElementById('reportListContainer');

    if (!reports.length) {
        reportListContainer.innerHTML = `
            <div class="card portal-card shadow-sm">
                <div class="card-body text-center py-5 text-muted">
                    <i class="bi bi-inbox display-4"></i>
                    <h5 class="mt-3">Belum ada laporan</h5>
                    <p class="mb-0">Data laporan pada tab ini belum tersedia.</p>
                </div>
            </div>
        `;
        return;
    }

    reportListContainer.innerHTML = `
        <div class="row g-3">
            ${reports.map(report => createReportCard(report, tab)).join('')}
        </div>
    `;
}

function createReportCard(report, tab) {
    const statusInfo = getStatusInfo(report.status);
    const canEditDraft = tab === 'my_reports' && report.is_owner && report.status === 'DRAFT';

    return `
        <div class="col-12 col-xl-6">
            <div class="card report-card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <span class="badge ${statusInfo.badgeClass} text-uppercase">${statusInfo.label}</span>
                        <span class="report-category">${escapeHtml(report.category)}</span>
                    </div>

                    <h5 class="report-title mb-2">${escapeHtml(report.title)}</h5>

                    <p class="report-description mb-3">
                        ${escapeHtml(report.description)}
                    </p>

                    <div class="small-divider"></div>

                    <div class="report-meta mb-1">
                        <strong>Lokasi:</strong> ${escapeHtml(report.location)}
                    </div>

                    <div class="report-meta mb-3">
                        <strong>Oleh:</strong> ${escapeHtml(report.reporter)}
                    </div>

                    <div class="mt-auto">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span class="small fw-semibold">Progress Laporan:</span>
                            <span class="progress-label">${statusInfo.progressLabel} (${statusInfo.progress}%)</span>
                        </div>

                        <div class="progress status-progress">
                            <div
                                class="progress-bar progress-bar-striped ${statusInfo.progressClass}"
                                role="progressbar"
                                style="width: ${statusInfo.progress}%"
                                aria-valuenow="${statusInfo.progress}"
                                aria-valuemin="0"
                                aria-valuemax="100"
                            ></div>
                        </div>

                        ${canEditDraft ? `
                            <div class="d-flex justify-content-end gap-2 mt-3">
                                <button type="button" class="btn btn-sm btn-outline-primary" onclick="editDraft(${report.id})">
                                    <i class="bi bi-pencil-square me-1"></i>Edit
                                </button>
                                <button type="button" class="btn btn-sm btn-primary" onclick="submitExistingDraft(${report.id})">
                                    <i class="bi bi-send me-1"></i>Ajukan
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderPagination(paginatedData, tab, page) {
    const paginationContainer = document.getElementById('paginationContainer');

    const hasPrevious = Boolean(paginatedData.previous);
    const hasNext = Boolean(paginatedData.next);

    if (!hasPrevious && !hasNext) {
        paginationContainer.innerHTML = '';
        return;
    }

    paginationContainer.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <button
                type="button"
                class="btn btn-outline-primary btn-sm"
                ${hasPrevious ? '' : 'disabled'}
                onclick="loadDashboardData('${tab}', ${page - 1})"
            >
                <i class="bi bi-chevron-left me-1"></i>Previous
            </button>

            <span class="text-muted small">Halaman ${page}</span>

            <button
                type="button"
                class="btn btn-outline-primary btn-sm"
                ${hasNext ? '' : 'disabled'}
                onclick="loadDashboardData('${tab}', ${page + 1})"
            >
                Next<i class="bi bi-chevron-right ms-1"></i>
            </button>
        </div>
    `;
}

function openCreateModal() {
    editingReportId = null;

    const reportForm = document.getElementById('reportForm');
    const reportFormMessage = document.getElementById('reportFormMessage');
    const reportModalLabel = document.getElementById('reportModalLabel');

    reportForm.reset();
    reportFormMessage.innerHTML = '';
    reportModalLabel.innerHTML = `<i class="bi bi-file-earmark-plus me-2"></i>Tambah Laporan Baru`;

    showReportModal();
}

async function editDraft(id) {
    const reportFormMessage = document.getElementById('reportFormMessage');
    const reportModalLabel = document.getElementById('reportModalLabel');

    try {
        const result = await requestAPI(`/api/report/${id}/`, 'GET');

        if (!result.ok || result.status !== 200) {
            alert('Gagal mengambil data laporan.');
            return;
        }

        const report = result.data;

        editingReportId = id;

        document.getElementById('reportTitle').value = report.title;
        document.getElementById('reportCategory').value = report.category;
        document.getElementById('reportLocation').value = report.location;
        document.getElementById('reportDescription').value = report.description;

        reportFormMessage.innerHTML = '';
        reportModalLabel.innerHTML = `<i class="bi bi-pencil-square me-2"></i>Edit Draft Laporan`;

        showReportModal();
    } catch (error) {
        console.error('Gagal mengambil draft:', error);
        alert('Tidak dapat terhubung ke backend API.');
    }
}

async function submitReportForm(shouldSubmitAfterSave) {
    const reportForm = document.getElementById('reportForm');
    const reportFormMessage = document.getElementById('reportFormMessage');

    const payload = {
        title: document.getElementById('reportTitle').value.trim(),
        category: document.getElementById('reportCategory').value.trim(),
        location: document.getElementById('reportLocation').value.trim(),
        description: document.getElementById('reportDescription').value.trim(),
    };

    if (!payload.title || !payload.category || !payload.location || !payload.description) {
        reportFormMessage.innerHTML = `
            <div class="alert alert-warning">
                Semua field wajib diisi.
            </div>
        `;
        return;
    }

    const isEditing = editingReportId !== null;
    const endpoint = isEditing ? `/api/report/${editingReportId}/` : '/api/report/';
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const result = await requestAPI(endpoint, method, payload);

        if (result.ok && [200, 201].includes(result.status)) {
            const savedReportId = result.data.id;

            if (shouldSubmitAfterSave) {
                const submitResult = await requestAPI(`/api/report/${savedReportId}/submit/`, 'POST');

                if (!submitResult.ok || submitResult.status !== 200) {
                    reportFormMessage.innerHTML = `
                        <div class="alert alert-danger">
                            Draft tersimpan, tetapi gagal diajukan.
                        </div>
                    `;
                    return;
                }
            }

            closeReportModal();
            reportForm.reset();
            editingReportId = null;
            loadDashboardData(currentTab, currentPage);
        } else {
            reportFormMessage.innerHTML = `
                <div class="alert alert-danger">
                    Gagal menyimpan laporan. Periksa kembali data yang diisi.
                </div>
            `;
        }
    } catch (error) {
        console.error('Gagal menyimpan laporan:', error);
        reportFormMessage.innerHTML = `
            <div class="alert alert-danger">
                Tidak dapat terhubung ke backend API.
            </div>
        `;
    }
}

async function submitExistingDraft(id) {
    const confirmSubmit = confirm('Yakin ingin mengajukan laporan ini? Setelah diajukan, laporan tidak dapat diedit sebagai draft.');

    if (!confirmSubmit) {
        return;
    }

    try {
        const result = await requestAPI(`/api/report/${id}/submit/`, 'POST');

        if (result.ok && result.status === 200) {
            loadDashboardData(currentTab, currentPage);
        } else {
            alert('Gagal mengajukan laporan.');
        }
    } catch (error) {
        console.error('Gagal mengajukan laporan:', error);
        alert('Tidak dapat terhubung ke backend API.');
    }
}

function showReportModal() {
    const reportModalElement = document.getElementById('reportModal');

    if (!reportModalInstance) {
        reportModalInstance = new bootstrap.Modal(reportModalElement);
    }

    reportModalInstance.show();
}

function closeReportModal() {
    if (reportModalInstance) {
        reportModalInstance.hide();
    }
}

function getStatusInfo(status) {
    const statusMap = {
        DRAFT: {
            label: 'DRAFT',
            progressLabel: 'Draf',
            progress: 10,
            badgeClass: 'text-bg-secondary',
            progressClass: 'bg-secondary',
        },
        REPORTED: {
            label: 'REPORTED',
            progressLabel: 'Diajukan',
            progress: 25,
            badgeClass: 'text-bg-warning',
            progressClass: 'bg-warning',
        },
        VERIFIED: {
            label: 'VERIFIED',
            progressLabel: 'Diverifikasi',
            progress: 50,
            badgeClass: 'text-bg-info',
            progressClass: 'bg-info',
        },
        IN_PROGRESS: {
            label: 'IN_PROGRESS',
            progressLabel: 'Diproses',
            progress: 75,
            badgeClass: 'text-bg-primary',
            progressClass: 'bg-primary',
        },
        RESOLVED: {
            label: 'RESOLVED',
            progressLabel: 'Selesai',
            progress: 100,
            badgeClass: 'text-bg-success',
            progressClass: 'bg-success',
        },
    };

    return statusMap[status] || {
        label: status,
        progressLabel: status,
        progress: 10,
        badgeClass: 'text-bg-dark',
        progressClass: 'bg-dark',
    };
}

function formatDate(dateString) {
    if (!dateString) {
        return '-';
    }

    return new Date(dateString).toLocaleString('id-ID');
}

function escapeHtml(text) {
    if (text === null || text === undefined) {
        return '';
    }

    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function renderNotFoundPage() {
    const appContent = document.getElementById('app-content');

    updateNavbarUsername();

    appContent.innerHTML = `
        <div class="card portal-card shadow-sm">
            <div class="card-body text-center p-5">
                <i class="bi bi-exclamation-triangle-fill display-4 text-warning"></i>
                <h3 class="mt-3">Halaman Tidak Ditemukan</h3>
                <p class="text-muted">Route yang diminta tidak tersedia.</p>
                <a href="#login" class="btn btn-primary">Kembali ke Login</a>
            </div>
        </div>
    `;
}