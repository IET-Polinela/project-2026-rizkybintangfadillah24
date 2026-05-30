function renderLoginPage() {
    const appContent = document.getElementById('app-content');

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

    appContent.innerHTML = `
        <div class="mb-4">
            <h2 class="fw-bold mb-1">Dashboard Citizen</h2>
            <p class="text-muted mb-0">
                Portal ini digunakan oleh warga untuk mengakses layanan Smart City berbasis API.
            </p>
        </div>

        <div class="row g-3">
            <aside class="col-12 col-lg-3">
                <div class="card portal-card shadow-sm dashboard-card">
                    <div class="card-body">
                        <h5 class="card-title">
                            <i class="bi bi-person-badge-fill text-primary me-2"></i>Profil Citizen
                        </h5>
                        <p class="text-muted mb-2">
                            Status login berhasil menggunakan JWT.
                        </p>
                        <span class="badge text-bg-success">Authenticated</span>
                    </div>
                </div>
            </aside>

            <section class="col-12 col-lg-6">
                <div class="card portal-card shadow-sm dashboard-card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h5 class="card-title mb-1">
                                    <i class="bi bi-clipboard2-data-fill text-primary me-2"></i>Ringkasan Laporan
                                </h5>
                                <p class="text-muted mb-0">
                                    Data laporan nantinya dapat diambil dari endpoint API Django.
                                </p>
                            </div>
                        </div>

                        <div class="row text-center g-3">
                            <div class="col-12 col-md-4">
                                <div class="border rounded p-3 bg-light">
                                    <h4 class="mb-0">API</h4>
                                    <small class="text-muted">Backend DRF</small>
                                </div>
                            </div>

                            <div class="col-12 col-md-4">
                                <div class="border rounded p-3 bg-light">
                                    <h4 class="mb-0">JWT</h4>
                                    <small class="text-muted">Authentication</small>
                                </div>
                            </div>

                            <div class="col-12 col-md-4">
                                <div class="border rounded p-3 bg-light">
                                    <h4 class="mb-0">SPA</h4>
                                    <small class="text-muted">Frontend</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <aside class="col-12 col-lg-3">
                <div class="card portal-card shadow-sm dashboard-card">
                    <div class="card-body">
                        <h5 class="card-title">
                            <i class="bi bi-shield-lock-fill text-primary me-2"></i>Token Login
                        </h5>
                        <p class="text-muted mb-2">
                            Access token dan refresh token tersimpan di localStorage setelah login berhasil.
                        </p>
                        <a href="#login" class="btn btn-outline-primary btn-sm">
                            <i class="bi bi-arrow-left-right me-1"></i>Ganti Akun
                        </a>
                    </div>
                </div>
            </aside>
        </div>
    `;
}

function renderNotFoundPage() {
    const appContent = document.getElementById('app-content');

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