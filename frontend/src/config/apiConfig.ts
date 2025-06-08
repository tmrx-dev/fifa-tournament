// API Configuration
const isDevelopment = import.meta.env.DEV;

export const API_CONFIG = {
  BASE_URL: isDevelopment 
    ? 'http://localhost:3000/api'
    : 'https://fifa-dev-api.azurewebsites.net/api',
  
  AUTH_BASE_URL: isDevelopment
    ? 'http://localhost:3000'
    : 'https://fifa-dev-api.azurewebsites.net'
};

export default API_CONFIG;
