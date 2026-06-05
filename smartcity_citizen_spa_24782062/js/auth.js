function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const loginMessage = document.getElementById('loginMessage');

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        const payload = {
            username: username,
            password: password,
        };

        loginMessage.innerHTML = `
            <div class="alert alert-info">
                Sedang memproses login...
            </div>
        `;

        try {
            const result = await requestAPI('/api/token/', 'POST', payload);

            if (result.ok && result.status === 200) {
                localStorage.setItem('access_token', result.data.access);
                localStorage.setItem('refresh_token', result.data.refresh);
                localStorage.setItem('username', username);

                updateNavbarUsername();

                loginMessage.innerHTML = `
                    <div class="alert alert-success">
                        Login berhasil. Mengalihkan ke dashboard...
                    </div>
                `;

                setTimeout(function () {
                    window.location.hash = '#dashboard';
                }, 600);
            } else {
                loginMessage.innerHTML = `
                    <div class="alert alert-danger">
                        Login gagal. Periksa kembali username dan password.
                    </div>
                `;
            }
        } catch (error) {
            loginMessage.innerHTML = `
                <div class="alert alert-danger">
                    Tidak dapat terhubung ke server backend.
                </div>
            `;
            console.error('Login error:', error);
        }
    });
}

function setupLogoutButton() {
    const logoutButton = document.getElementById('logoutButton');

    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener('click', function () {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('username');

        updateNavbarUsername();

        window.location.hash = '#login';
    });
}

function isAuthenticated() {
    return Boolean(localStorage.getItem('access_token'));
}

function getDisplayUsername() {
    const username = localStorage.getItem('username');

    if (username && username.trim() !== '') {
        return username;
    }

    return 'Citizen';
}

function updateNavbarUsername() {
    const navbarUsername = document.getElementById('navbarUsername');

    if (!navbarUsername) {
        return;
    }

    if (isAuthenticated()) {
        navbarUsername.textContent = `Halo, ${getDisplayUsername()}`;
    } else {
        navbarUsername.textContent = '';
    }
}