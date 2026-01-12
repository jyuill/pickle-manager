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

export default api;
