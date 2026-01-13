import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Ensure protocol is present to avoid relative path issues
if (!baseURL.startsWith('http')) {
    baseURL = `https://${baseURL}`;
}

console.log('API Base URL:', baseURL);

const api = axios.create({
    baseURL,
});

// Request Interceptor: Attach Password
api.interceptors.request.use((config) => {
    const pwd = localStorage.getItem('admin_password');
    if (pwd) {
        config.headers['X-Admin-Password'] = pwd;
    }
    return config;
});

// Response Interceptor: Handle 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Trigger global event for App to handle (show login modal)
            window.dispatchEvent(new Event('auth:unauthorized'));
        }
        return Promise.reject(error);
    }
);

export default api;
