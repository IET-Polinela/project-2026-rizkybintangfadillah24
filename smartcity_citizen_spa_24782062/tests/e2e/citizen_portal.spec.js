const { test, expect } = require('@playwright/test');

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
const SPA_URL = process.env.SPA_URL || 'http://127.0.0.1:5500/index.html';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const CITIZEN_A_USERNAME = process.env.CITIZEN_A_USERNAME || 'warga';
const CITIZEN_A_PASSWORD = process.env.CITIZEN_A_PASSWORD || 'warga123';

const CITIZEN_B_USERNAME = process.env.CITIZEN_B_USERNAME || 'warga2';
const CITIZEN_B_PASSWORD = process.env.CITIZEN_B_PASSWORD || 'warga123';

const INVALID_ACCESS_TOKEN = 'invalid.expired.access.token';
const INVALID_REFRESH_TOKEN = 'invalid.expired.refresh.token';

function uniqueText(prefix) {
    return `${prefix} ${Date.now()} ${Math.floor(Math.random() * 100000)}`;
}

async function prepareSpaStorage(page, clearTokens = true) {
    await page.goto(SPA_URL, {
        waitUntil: 'domcontentloaded',
    });

    await page.evaluate(
        ({ backendUrl, shouldClearTokens }) => {
            localStorage.setItem('API_BASE_URL_OVERRIDE', backendUrl);

            if (shouldClearTokens) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('username');
            }
        },
        {
            backendUrl: BACKEND_URL,
            shouldClearTokens: clearTokens,
        }
    );
}

async function setSpaTokens(page, accessToken, refreshToken, username) {
    await page.evaluate(
        ({ access, refresh, user }) => {
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            localStorage.setItem('username', user);
        },
        {
            access: accessToken,
            refresh: refreshToken,
            user: username,
        }
    );
}

async function clearSpaTokens(page) {
    await page.evaluate(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('username');
    });
}

async function apiLogin(apiContext, username, password) {
    const response = await apiContext.post(`${BACKEND_URL}/api/token/`, {
        data: {
            username,
            password,
        },
    });

    if (!response.ok()) {
        throw new Error(
            `Gagal login API untuk ${username}. Status: ${response.status()} Body: ${await response.text()}`
        );
    }

    return await response.json();
}

async function apiCreateReport(apiContext, username, password, payload, submitAfterCreate = false) {
    const token = await apiLogin(apiContext, username, password);

    const createResponse = await apiContext.post(`${BACKEND_URL}/api/report/`, {
        headers: {
            Authorization: `Bearer ${token.access}`,
        },
        data: payload,
    });

    if (![200, 201].includes(createResponse.status())) {
        throw new Error(
            `Gagal membuat report. Status: ${createResponse.status()} Body: ${await createResponse.text()}`
        );
    }

    const report = await createResponse.json();

    if (submitAfterCreate) {
        const submitResponse = await apiContext.post(`${BACKEND_URL}/api/report/${report.id}/submit/`, {
            headers: {
                Authorization: `Bearer ${token.access}`,
            },
        });

        if (submitResponse.status() !== 200) {
            throw new Error(
                `Gagal submit report ${report.id}. Status: ${submitResponse.status()} Body: ${await submitResponse.text()}`
            );
        }

        return await submitResponse.json();
    }

    return report;
}

async function ensureFeedReports(apiContext, total = 25) {
    for (let index = 1; index <= total; index += 1) {
        await apiCreateReport(
            apiContext,
            CITIZEN_B_USERNAME,
            CITIZEN_B_PASSWORD,
            {
                title: uniqueText(`Feed Publik Playwright ${index}`),
                category: index % 2 === 0 ? 'Infrastruktur' : 'Kebersihan',
                location: `Lokasi Feed ${index}`,
                description: `Data feed publik untuk pengujian pagination nomor ${index}.`,
            },
            true
        );
    }
}

async function loginSpa(page, username, password) {
    await prepareSpaStorage(page, true);

    await page.goto(`${SPA_URL}#login`, {
        waitUntil: 'domcontentloaded',
    });

    await expect(page.locator('#loginForm')).toBeVisible({
        timeout: 10000,
    });

    await page.locator('#username').fill(username);
    await page.locator('#password').fill(password);

    await Promise.all([
        page.waitForFunction(
            () => window.location.hash === '#dashboard',
            null,
            { timeout: 15000 }
        ),
        page.locator('#loginForm button[type="submit"]').click(),
    ]);

    await expect(page.locator('#reportListContainer')).toBeVisible({
        timeout: 15000,
    });
}

async function loginAdmin(page) {
    await page.goto(`${BACKEND_URL}/admin/login/?next=/dashboard/`, {
        waitUntil: 'domcontentloaded',
    });

    await page.waitForSelector('form', {
        state: 'visible',
        timeout: 10000,
    });

    await page.locator('input[name="username"]').fill(ADMIN_USERNAME);
    await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);

    await Promise.all([
        page.waitForURL(
            (url) => !url.pathname.includes('/admin/login/'),
            { timeout: 15000 }
        ),
        page.locator('input[type="submit"], button[type="submit"]').first().click(),
    ]);

    await page.goto(`${BACKEND_URL}/dashboard/`, {
        waitUntil: 'networkidle',
    });
}

async function openCreateReportModal(page) {
    const openCreateModalButton = page.locator('#openCreateModalButton');

    await expect(openCreateModalButton).toBeVisible({
        timeout: 15000,
    });

    await openCreateModalButton.click();

    await expect(page.locator('#reportModal')).toBeVisible({
        timeout: 10000,
    });

    await expect(page.locator('#reportForm')).toBeVisible();
}

async function fillReportForm(page, titlePrefix = 'Laporan Playwright') {
    await page.locator('#reportTitle').fill(uniqueText(titlePrefix));
    await page.locator('#reportCategory').fill('Infrastruktur');
    await page.locator('#reportLocation').fill('Gedung Lab Analisis, Lantai 2');
    await page.locator('#reportDescription').fill(
        'Laporan dibuat otomatis menggunakan Playwright untuk pengujian end-to-end.'
    );
}

async function getBadgeNumber(page, selector) {
    const text = await page.locator(selector).innerText();
    const parsed = Number.parseInt(text.trim(), 10);

    return Number.isNaN(parsed) ? 0 : parsed;
}

test.describe('Modul AUTH Citizen SPA', () => {
    test('AUTH-04: akses #dashboard tanpa token diarahkan ke #login', async ({ page }) => {
        await prepareSpaStorage(page, true);
        await clearSpaTokens(page);

        await page.goto(`${SPA_URL}#dashboard`, {
            waitUntil: 'domcontentloaded',
        });

        await page.waitForFunction(
            () => window.location.hash === '#login',
            null,
            { timeout: 5000 }
        );

        await expect(page).toHaveURL(/#login/);
        await expect(page.locator('#loginForm')).toBeVisible();
    });

    test('AUTH-05: access_token expired tetapi refresh_token valid, aduan tetap berhasil diajukan', async ({ page, request }) => {
        const token = await apiLogin(request, CITIZEN_A_USERNAME, CITIZEN_A_PASSWORD);

        await loginSpa(page, CITIZEN_A_USERNAME, CITIZEN_A_PASSWORD);

        await openCreateReportModal(page);
        await fillReportForm(page, 'AUTH-05 Silent Refresh');

        await setSpaTokens(
            page,
            INVALID_ACCESS_TOKEN,
            token.refresh,
            CITIZEN_A_USERNAME
        );

        const submitResponsePromise = page.waitForResponse(
            (response) =>
                response.url().includes('/api/report/') &&
                response.url().includes('/submit/') &&
                response.status() === 200,
            { timeout: 20000 }
        );

        await page.locator('#submitReportButton').click();

        await submitResponsePromise;

        await expect(page.locator('#reportModal')).not.toBeVisible({
            timeout: 15000,
        });

        const accessTokenAfter = await page.evaluate(() => localStorage.getItem('access_token'));
        const refreshTokenAfter = await page.evaluate(() => localStorage.getItem('refresh_token'));

        expect(accessTokenAfter).not.toBeNull();
        expect(accessTokenAfter).not.toBe(INVALID_ACCESS_TOKEN);
        expect(refreshTokenAfter).toBe(token.refresh);
        await expect(page).toHaveURL(/#dashboard/);
    });

    test('AUTH-06: submit aduan dengan access_token dan refresh_token kadaluarsa diarahkan ke #login', async ({ page }) => {
        await loginSpa(page, CITIZEN_A_USERNAME, CITIZEN_A_PASSWORD);

        await openCreateReportModal(page);
        await fillReportForm(page, 'AUTH-06 Token Invalid');

        await setSpaTokens(
            page,
            INVALID_ACCESS_TOKEN,
            INVALID_REFRESH_TOKEN,
            CITIZEN_A_USERNAME
        );

        await page.locator('#saveDraftButton').click();

        await page.waitForFunction(
            () => window.location.hash === '#login',
            null,
            { timeout: 15000 }
        );

        await expect(page).toHaveURL(/#login/);
        await expect(page.locator('#loginForm')).toBeVisible();

        const accessTokenAfter = await page.evaluate(() => localStorage.getItem('access_token'));
        const refreshTokenAfter = await page.evaluate(() => localStorage.getItem('refresh_token'));
        const usernameAfter = await page.evaluate(() => localStorage.getItem('username'));

        expect(accessTokenAfter).toBeNull();
        expect(refreshTokenAfter).toBeNull();
        expect(usernameAfter).toBeNull();
    });
});

test.describe('Modul UI Admin dan Citizen', () => {
    test('UI-01: Chart.js pada Dashboard Admin ter-render', async ({ page, request }) => {
        await apiCreateReport(
            request,
            CITIZEN_B_USERNAME,
            CITIZEN_B_PASSWORD,
            {
                title: uniqueText('Dashboard Admin Chart'),
                category: 'Infrastruktur',
                location: 'Lokasi Dashboard',
                description: 'Data laporan untuk memastikan dashboard admin memiliki data.',
            },
            true
        );

        await loginAdmin(page);

        await expect(page).toHaveURL(/\/dashboard\/?/);
        await expect(page.locator('#statusChart')).toBeVisible({
            timeout: 15000,
        });
        await expect(page.locator('#categoryChart')).toBeVisible({
            timeout: 15000,
        });
        await expect(page.locator('#latestReportedTable')).toBeVisible();
        await expect(page.locator('#latestResolvedTable')).toBeVisible();
    });

    test('UI-02: Live Search pada daftar laporan admin berjalan tanpa reload halaman', async ({ page, request }) => {
        const keyword = uniqueText('Search Playwright');

        await apiCreateReport(
            request,
            CITIZEN_B_USERNAME,
            CITIZEN_B_PASSWORD,
            {
                title: keyword,
                category: 'Infrastruktur',
                location: 'Lokasi Search',
                description: 'Data laporan untuk pengujian live search admin.',
            },
            true
        );

        await loginAdmin(page);

        await page.goto(`${BACKEND_URL}/reports/`, {
            waitUntil: 'networkidle',
        });

        const searchInput = page.locator('#searchInput');
        const tableBody = page.locator('#reportTableBody');

        await expect(searchInput).toBeVisible({
            timeout: 15000,
        });
        await expect(tableBody).toBeVisible();

        const responsePromise = page.waitForResponse(
            (response) =>
                response.url().includes('/reports/search/?q=') &&
                response.status() === 200,
            { timeout: 15000 }
        );

        await searchInput.fill(keyword);

        const searchResponse = await responsePromise;

        expect(searchResponse.status()).toBe(200);

        await expect(tableBody).toContainText(keyword, {
            timeout: 15000,
        });
    });

    test('UI-03: Feed Kota menampilkan maksimal 10 kartu pada halaman awal', async ({ page, request }) => {
        await ensureFeedReports(request, 25);

        await loginSpa(page, CITIZEN_A_USERNAME, CITIZEN_A_PASSWORD);

        await expect(page.locator('#feedTabButton')).toBeVisible({
            timeout: 15000,
        });

        await page.locator('#feedTabButton').click();

        await expect(page.locator('#reportListContainer')).toBeVisible();

        const cards = page.locator('#reportListContainer .report-card');

        await expect(cards.first()).toBeVisible({
            timeout: 15000,
        });

        const cardCount = await cards.count();

        expect(cardCount).toBeGreaterThan(0);
        expect(cardCount).toBeLessThanOrEqual(10);

        await expect(page.locator('#reportListContainer')).toContainText('Warga Anonim');
        await expect(page.locator('#paginationContainer')).toBeVisible();
    });

    test('UI-04: tombol Buat Laporan Baru membuka modal laporan', async ({ page }) => {
        await loginSpa(page, CITIZEN_A_USERNAME, CITIZEN_A_PASSWORD);

        const openCreateModalButton = page.locator('#openCreateModalButton');

        await expect(openCreateModalButton).toBeVisible({
            timeout: 15000,
        });

        await expect(page.locator('#reportModal')).not.toBeVisible();

        await openCreateModalButton.click();

        await expect(page.locator('#reportModal')).toBeVisible({
            timeout: 10000,
        });
        await expect(page.locator('#reportForm')).toBeVisible();
        await expect(page.locator('#reportTitle')).toBeVisible();
        await expect(page.locator('#reportCategory')).toBeVisible();
        await expect(page.locator('#reportLocation')).toBeVisible();
        await expect(page.locator('#reportDescription')).toBeVisible();
        await expect(page.locator('#saveDraftButton')).toBeVisible();
        await expect(page.locator('#submitReportButton')).toBeVisible();
    });

    test('UI-05: isi form laporan dan simpan draft menutup modal serta menaikkan badge Draf', async ({ page }) => {
        await loginSpa(page, CITIZEN_A_USERNAME, CITIZEN_A_PASSWORD);

        const initialDraftCount = await getBadgeNumber(page, '#summaryDraft');

        await openCreateReportModal(page);
        await fillReportForm(page, 'UI-05 Simpan Draft');

        await page.locator('#saveDraftButton').click();

        await expect(page.locator('#reportModal')).not.toBeVisible({
            timeout: 15000,
        });

        await expect.poll(
            async () => await getBadgeNumber(page, '#summaryDraft'),
            {
                timeout: 15000,
            }
        ).toBeGreaterThan(initialDraftCount);
    });

    test('UI-06: navbar responsif pada viewport mobile 400x800', async ({ page }) => {
        await page.setViewportSize({
            width: 400,
            height: 800,
        });

        await prepareSpaStorage(page, true);

        await page.goto(SPA_URL, {
            waitUntil: 'domcontentloaded',
        });

        await expect(page.locator('.navbar')).toBeVisible();

        const navbarToggler = page.locator('.navbar-toggler');

        await expect(navbarToggler).toBeVisible();

        const navbarMenu = page.locator('#navbarMenu');

        if ((await navbarMenu.count()) > 0) {
            const hasShowClassBeforeClick = await navbarMenu.evaluate((element) =>
                element.classList.contains('show')
            );

            expect(hasShowClassBeforeClick).toBe(false);
        }

        await navbarToggler.click();

        if ((await navbarMenu.count()) > 0) {
            await expect(navbarMenu).toHaveClass(/show/);
        }
    });
});