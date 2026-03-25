// Kubernetes service URLs - injected via ConfigMap
const API_BASE = window.APP_CONFIG?.API_BASE || '/api/auth';
const CATALOG_URL = window.APP_CONFIG?.CATALOG_URL || '/';

// For Kubernetes, we use relative paths since all services are accessed through the Ingress
// The Ingress will route /api/auth to landing-service, /api/products to catalog-service, etc.

document.addEventListener('DOMContentLoaded', () => {
  // Check if already logged in
  const token = localStorage.getItem('shophub_token');
  if (token) {
    // Redirect to catalog - Ingress will handle routing
    window.location.href = CATALOG_URL;
  }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('errorMessage');

  errorMessage.classList.remove('show');
  errorMessage.textContent = '';

  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (result.success) {
      // Store token and user info
      localStorage.setItem('shophub_token', result.data.token);
      localStorage.setItem('shophub_user', JSON.stringify(result.data.user));

      // Generate and store userId for cart service
      let userId = localStorage.getItem('shophub_userId');
      if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('shophub_userId', userId);
      }

      // Redirect to catalog - Ingress will handle routing
      window.location.href = CATALOG_URL;
    } else {
      errorMessage.textContent = result.error || 'Login failed';
      errorMessage.classList.add('show');
    }
  } catch (error) {
    console.error('Login error:', error);
    errorMessage.textContent = 'Network error. Please try again.';
    errorMessage.classList.add('show');
  }
});
