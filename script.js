/* ---------------------------
   A/L & O/L Exam Countdown - Complete Version
   Author: Sadeepa & Shamika
----------------------------*/

// GitHub Gist Configuration
const GIST_ID = '5ba047e2b5c15dee6ade09af9ee5d1e6';
const GIST_RAW_URL = `https://gist.githubusercontent.com/sadeepa0813/${GIST_ID}/raw/comments.json`;

// Global Variables
let currentBatch = '2026';
let comments = [];
let likedComments = new Set();

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const htmlElement = document.documentElement;

const DEFAULT_THEME = 'dark';
const THEME_KEY = 'theme';
const currentTheme = localStorage.getItem(THEME_KEY) || DEFAULT_THEME;

htmlElement.setAttribute('data-theme', currentTheme);

if (themeIcon) {
    if (currentTheme === 'light') {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
}

function toggleTheme() {
    const theme = htmlElement.getAttribute('data-theme');
    const newTheme = theme === 'dark' ? 'light' : 'dark';

    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);

    if (themeIcon) {
        if (newTheme === 'light') {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
            showNotification('🌞', 'Light mode enabled');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
            showNotification('🌙', 'Dark mode enabled');
        }
    }
}

if (themeToggle) themeToggle.addEventListener('click', toggleTheme);


// 🔔 Notification Toast
function showNotification(icon, message) {
    const notificationToast = document.getElementById('notificationToast');
    const notificationIcon = document.getElementById('notificationIcon');
    const notificationMessage = document.getElementById('notificationMessage');

    if (!notificationToast || !notificationIcon || !notificationMessage) return;

    notificationIcon.textContent = icon;
    notificationMessage.textContent = message;

    notificationToast.classList.add('show');
    setTimeout(() => notificationToast.classList.remove('show'), 3000);
}


// ❗ Custom Alert Box
function showAlert(icon, title, message, callback = null) {
    const alertIcon = document.getElementById('alertIcon');
    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');
    const alertPopup = document.getElementById('alertPopup');

    if (!alertPopup) return;

    alertIcon.textContent = icon;
    alertTitle.textContent = title;
    alertMessage.textContent = message;

    alertPopup.classList.add('show');
    document.body.style.overflow = 'hidden';

    window.alertCallback = callback;
}

function closeAlert() {
    const alertPopup = document.getElementById('alertPopup');
    if (!alertPopup) return;

    alertPopup.classList.remove('show');
    document.body.style.overflow = '';

    if (window.alertCallback) {
        window.alertCallback();
        window.alertCallback = null;
    }
}


// 🔒 Disable Inspect Elements
document.addEventListener('keydown', function (e) {
    if (e.key === 'F12' || (e.ctrlKey && e.key.toLowerCase() === 'u')) {
        e.preventDefault();
    }
    if (e.ctrlKey && e.shiftKey && (e.key.toLowerCase() === 'i' || e.key.toLowerCase() === 'c')) {
        e.preventDefault();
    }
});

document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
});


// 📞 Contact Popup
function openContactPopup() {
    const popup = document.getElementById('contactPopup');
    if (!popup) return;

    popup.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeContactPopup() {
    const popup = document.getElementById('contactPopup');
    if (!popup) return;

    popup.classList.remove('show');
    document.body.style.overflow = '';
}

const contactBtn = document.getElementById('contactBtn');
if (contactBtn) contactBtn.addEventListener('click', openContactPopup);

const contactPopup = document.getElementById('contactPopup');
if (contactPopup) {
    contactPopup.addEventListener('click', function (e) {
        if (e.target === this) closeContactPopup();
    });
}
