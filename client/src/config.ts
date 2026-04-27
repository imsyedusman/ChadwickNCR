
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3001';
const API_URL = `${BASE_URL}/api`;

export { BASE_URL, API_URL };
export default API_URL;
