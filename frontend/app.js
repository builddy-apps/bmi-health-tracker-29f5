// Dark Mode Management
const DARK_MODE_KEY = 'bmi-tracker-dark-mode';

function initDarkMode() {
    const saved = localStorage.getItem(DARK_MODE_KEY);
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (saved === 'true' || (saved === null && systemPrefersDark)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem(DARK_MODE_KEY, isDark);
    return isDark;
}

// API Helpers
const API_BASE = '/api';

async function fetchWithTimeout(url, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout. Please try again.');
        }
        throw error;
    }
}

async function handleErrors(response) {
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Request failed with status ${response.status}`);
    }
    return response.json();
}

async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetchWithTimeout(`${API_BASE}${endpoint}`, options);
        return await handleErrors(response);
    } catch (error) {
        showToast(error.message, 'error');
        throw error;
    }
}

// Toast Notification System
function showToast(message, type = 'info', duration = 4000) {
    const existingContainer = document.getElementById('toast-container');
    const container = existingContainer || createToastContainer();
    
    const toast = document.createElement('div');
    const colors = {
        success: 'bg-emerald-500 text-white',
        error: 'bg-rose-500 text-white',
        info: 'bg-sky-500 text-white'
    };
    const icons = {
        success: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
        error: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
        info: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
    };
    
    toast.className = `${colors[type]} px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 transform transition-all duration-300 translate-x-full opacity-0`;
    toast.innerHTML = `${icons[type]}<span class="font-medium">${message}</span>`;
    
    container.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
    });
    
    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
    document.body.appendChild(container);
    return container;
}

// Date Formatting Helpers
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDateTime(dateString) {
    return `${formatDate(dateString)} at ${formatTime(dateString)}`;
}

// BMI Category Utilities
const BMI_CATEGORIES = {
    underweight: { min: 0, max: 18.5, label: 'Underweight', color: '#3b82f6' },
    normal: { min: 18.5, max: 25, label: 'Normal Weight', color: '#22c55e' },
    overweight: { min: 25, max: 30, label: 'Overweight', color: '#eab308' },
    obese: { min: 30, max: 100, label: 'Obese', color: '#ef4444' }
};

function getBMICategory(bmi) {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
}

function getBMIColor(category) {
    return BMI_CATEGORIES[category]?.color || '#6b7280';
}

function getBMIColors() {
    return {
        underweight: BMI_CATEGORIES.underweight.color,
        normal: BMI_CATEGORIES.normal.color,
        overweight: BMI_CATEGORIES.overweight.color,
        obese: BMI_CATEGORIES.obese.color
    };
}

function getCategoryInfo(category) {
    return BMI_CATEGORIES[category] || { label: 'Unknown', color: '#6b7280' };
}

// Shared State Management
const state = {
    lastCalculation: null,
    history: [],
    isLoading: false,
    
    set(key, value) {
        this[key] = value;
        if (key === 'lastCalculation') {
            localStorage.setItem('bmi-last-calculation', JSON.stringify(value));
        }
    },
    
    get(key) {
        return this[key];
    },
    
    loadSavedCalculation() {
        const saved = localStorage.getItem('bmi-last-calculation');
        if (saved) {
            try {
                this.lastCalculation = JSON.parse(saved);
                return this.lastCalculation;
            } catch {
                return null;
            }
        }
        return null;
    },
    
    clearSavedCalculation() {
        this.lastCalculation = null;
        localStorage.removeItem('bmi-last-calculation');
    }
};

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    state.loadSavedCalculation();
    
    // Setup dark mode toggle if button exists
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            const isDark = toggleDarkMode();
            darkModeToggle.innerHTML = isDark 
                ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>'
                : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>';
        });
    }
});

// Export for use in other modules
export {
    initDarkMode,
    toggleDarkMode,
    fetchWithTimeout,
    handleErrors,
    apiCall,
    showToast,
    formatDate,
    formatTime,
    formatDateTime,
    getBMICategory,
    getBMIColor,
    getBMIColors,
    getCategoryInfo,
    state,
    debounce,
    clamp,
    lerp
};