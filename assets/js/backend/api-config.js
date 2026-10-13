window.RafttApiConfig = {
  baseUrl: ['localhost', '127.0.0.1'].includes(location.hostname)
    ? 'http://127.0.0.1:3000'
    : 'https://raftt-back-end-production.up.railway.app',
};
