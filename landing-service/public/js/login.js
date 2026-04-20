const API_BASE = 'http://localhost:3000/api/auth';
const CATALOG_URL = 'http://localhost:3001';

// Don't redirect on page load - let user see the login form
// Only redirect after successful login

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
      // Store token and user info in localStorage
      localStorage.setItem('shophub_token', result.data.token);
      localStorage.setItem('shophub_user', JSON.stringify(result.data.user));
      // Also set a cookie so other origins (e.g., checkout-service) can access it
      // Store token in a cookie accessible across all ports on localhost (no domain attribute for broader scope)
      // Set a simple cookie accessible on all localhost ports (no SameSite or Secure flags for http)
      document.cookie = `shophub_token=${result.data.token}; path=/`;

      // Generate and store userId for cart service
      let userId = localStorage.getItem('shophub_userId');
      if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('shophub_userId', userId);
      }

      // Redirect to catalog
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
