const API_BASE = 'http://localhost:3000/api/auth';
const LOGIN_URL = '/login';

document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');

  errorMessage.classList.remove('show');
  successMessage.classList.remove('show');

  // Validation
  if (password !== confirmPassword) {
    errorMessage.textContent = 'Passwords do not match';
    errorMessage.classList.add('show');
    return;
  }

  if (password.length < 6) {
    errorMessage.textContent = 'Password must be at least 6 characters';
    errorMessage.classList.add('show');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
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

      successMessage.textContent = 'Account created successfully! Redirecting...';
      successMessage.classList.add('show');

      // Redirect to catalog after short delay
      setTimeout(() => {
        window.location.href = 'http://localhost:3001';
      }, 1500);
    } else {
      errorMessage.textContent = result.error || 'Registration failed';
      errorMessage.classList.add('show');
    }
  } catch (error) {
    console.error('Registration error:', error);
    errorMessage.textContent = 'Network error. Please try again.';
    errorMessage.classList.add('show');
  }
});
