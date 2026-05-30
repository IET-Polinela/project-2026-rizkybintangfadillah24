function handleRoute() {
    const hash = window.location.hash || '#login';

    if (hash === '#login') {
        renderLoginPage();
    } else if (hash === '#dashboard') {
        renderDashboardPage();
    } else {
        renderNotFoundPage();
    }
}

window.addEventListener('hashchange', handleRoute);

window.addEventListener('DOMContentLoaded', function () {
    setupLogoutButton();
    handleRoute();
});