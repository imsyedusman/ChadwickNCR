
// In production, we use relative paths so it automatically uses HTTPS if the site is HTTPS
const isProd = import.meta.env.PROD;

const BASE_URL = isProd ? '' : (import.meta.env.VITE_BASE_URL || 'http://localhost:3001');
const API_URL = isProd ? '/api' : `${BASE_URL}/api`;

export { BASE_URL, API_URL };
export default API_URL;
