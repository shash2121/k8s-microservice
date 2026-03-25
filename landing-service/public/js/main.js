// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href !== '#') {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  });
});

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('shophub_token');
  if (token) {
    // Update nav to show user info
    updateNavForLoggedInUser();
  }
});

function updateNavForLoggedInUser() {
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    const user = JSON.parse(localStorage.getItem('shophub_user') || '{}');
    navLinks.innerHTML = `
      <a href="http://localhost:3001" class="nav-link">Shop</a>
      <a href="http://localhost:3002" class="nav-link">Cart</a>
      <span class="nav-link">Hi, ${user.name || 'User'}</span>
      <button onclick="logout()" class="btn btn-outline">Logout</button>
    `;
  }
}

function logout() {
  localStorage.removeItem('shophub_token');
  localStorage.removeItem('shophub_user');
  window.location.reload();
}
