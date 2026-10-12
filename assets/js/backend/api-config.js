// Development configuration. Set the deployed API URL explicitly for production.
window.RafttApiConfig = {
  baseUrl: ['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://127.0.0.1:3000' : '',
};
