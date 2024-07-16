import { Router, navigateTo } from '/static/js/Router.js';
import { handleCallback } from './services/callbackHandler.js';

document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('root');
    if (root) {
        const path = window.location.pathname;
        if (path.startsWith('/callback')) {
            handleCallback();
        } else {
            Router();
            window.addEventListener('popstate', Router);
        }
    }
});

document.body.addEventListener('click', (e) => {
    if (e.target.matches('[data-link]')) {
        e.preventDefault();
        navigateTo(e.target.href);
    }
});
