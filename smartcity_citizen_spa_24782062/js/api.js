const DEFAULT_API_BASE_URL = 'http://103.151.63.86:8010';

function getApiBaseUrl() {
    const overrideFromWindow = window.API_BASE_URL_OVERRIDE;
    const overrideFromStorage = localStorage.getItem('API_BASE_URL_OVERRIDE');

    if (overrideFromWindow && overrideFromWindow.trim() !== '') {
        return overrideFromWindow.trim();
    }

    if (overrideFromStorage && overrideFromStorage.trim() !== '') {
        return overrideFromStorage.trim();
    }

    return DEFAULT_API_BASE_URL;
}

function clearAuthSession() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
}

function redirectToLogin() {
    clearAuthSession();

    if (typeof updateNavbarUsername === 'function') {
        updateNavbarUsername();
    }

    window.location.hash = '#login';
}

async function parseJsonResponse(response) {
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
        return await response.json();
    }

    return null;
}

async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
        return false;
    }

    try {
        const response = await fetch(`${getApiBaseUrl()}/api/token/refresh/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                refresh: refreshToken,
            }),
        });

        const data = await parseJsonResponse(response);

        if (!response.ok || !data || !data.access) {
            return false;
        }

        localStorage.setItem('access_token', data.access);

        return true;
    } catch (error) {
        console.error('Gagal melakukan refresh token:', error);
        return false;
    }
}

async function requestAPI(endpoint, method = 'GET', bodyData = null, retryOnUnauthorized = true) {
    const accessToken = localStorage.getItem('access_token');

    const headers = {
        'Content-Type': 'application/json',
    };

    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
    }

    const options = {
        method: method,
        headers: headers,
    };

    if (bodyData !== null) {
        options.body = JSON.stringify(bodyData);
    }

    try {
        const response = await fetch(`${getApiBaseUrl()}${endpoint}`, options);
        const data = await parseJsonResponse(response);

        if (response.status === 401 && retryOnUnauthorized) {
            const refreshed = await refreshAccessToken();

            if (refreshed) {
                return await requestAPI(endpoint, method, bodyData, false);
            }

            redirectToLogin();

            return {
                ok: false,
                status: 401,
                data: data,
            };
        }

        return {
            ok: response.ok,
            status: response.status,
            data: data,
        };
    } catch (error) {
        console.error('Request API gagal:', error);

        return {
            ok: false,
            status: 0,
            data: {
                detail: 'Tidak dapat terhubung ke backend API.',
            },
        };
    }
}