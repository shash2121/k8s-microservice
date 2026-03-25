// Kubernetes service URLs - using relative paths through Ingress
// All API calls go through the Ingress which routes to appropriate services
const API_BASE = window.APP_CONFIG?.API_BASE || '/api/products';
const CART_API_BASE = window.APP_CONFIG?.CART_API_BASE || '/api/cart';
const LANDING_URL = window.APP_CONFIG?.LANDING_URL || '/';

// Get userId from localStorage (shared with cart service)
let USER_ID = localStorage.getItem('shophub_userId');
if (!USER_ID) {
  USER_ID = 'user_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('shophub_userId', USER_ID);
}

let currentPage = 1;
let currentCategory = 'all';
let currentSearch = '';
let minPrice = '';
let maxPrice = '';

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const productsTitle = document.getElementById('productsTitle');
const productsCount = document.getElementById('productsCount');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const minPriceInput = document.getElementById('minPrice');
const maxPriceInput = document.getElementById('maxPrice');
const applyPriceBtn = document.getElementById('applyPrice');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const retryBtn = document.getElementById('retryBtn');
const navLinks = document.querySelectorAll('.nav-link');
const cartCountEl = document.getElementById('cartCount');
const userInfoEl = document.getElementById('userInfo');
const logoutBtn = document.getElementById('logoutBtn');

// Initialize - NO redirect check (let user browse)
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  setupEventListeners();
  loadCartCount();
  updateCartLink();
  displayUserInfo();
});

function displayUserInfo() {
  const user = JSON.parse(localStorage.getItem('shophub_user') || '{}');
  if (userInfoEl) {
    userInfoEl.textContent = `Hi, ${user.name || 'User'}`;
  }
}

function updateCartLink() {
  const cartIcon = document.getElementById('cartIcon');
  if (cartIcon) {
    // Use relative path - Ingress will route to cart service
    cartIcon.href = `/cart?userId=${USER_ID}`;
  }
}

function setupEventListeners() {
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      currentCategory = link.dataset.category;
      currentPage = 1;
      loadProducts();
    });
  });

  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  applyPriceBtn.addEventListener('click', handlePriceFilter);

  retryBtn.addEventListener('click', () => {
    error.classList.add('hidden');
    loadProducts();
  });

  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadProducts();
    }
  });

  nextPageBtn.addEventListener('click', () => {
    currentPage++;
    loadProducts();
  });
}

function handleSearch() {
  currentSearch = searchInput.value.trim();
  currentPage = 1;
  loadProducts();
}

function handlePriceFilter() {
  minPrice = minPriceInput.value;
  maxPrice = maxPriceInput.value;
  currentPage = 1;
  loadProducts();
}

async function loadProducts() {
  showLoading();

  try {
    let url = `${API_BASE}/search?page=${currentPage}&limit=12`;

    if (currentCategory !== 'all') {
      url += `&category=${encodeURIComponent(currentCategory)}`;
    }

    if (currentSearch) {
      url += `&q=${encodeURIComponent(currentSearch)}`;
    }

    if (minPrice) {
      url += `&minPrice=${minPrice}`;
    }

    if (maxPrice) {
      url += `&maxPrice=${maxPrice}`;
    }

    console.log('Fetching:', url);
    const response = await fetch(url);
    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      throw new Error(`Failed to fetch products: ${response.status}`);
    }

    const result = await response.json();
    console.log('Response data:', result);

    if (result.success) {
      hideLoading();
      displayProducts(result.data);
      updateCount(result.count, result.total);
      updatePagination(result.page, result.totalPages);
    } else {
      showError();
    }
  } catch (err) {
    console.error('Error loading products:', err);
    showError();
  }
}

function displayProducts(products) {
  productsGrid.innerHTML = '';

  if (products.length === 0) {
    productsGrid.innerHTML = `
      <div class="error" style="grid-column: 1/-1;">
        <p>No products found matching your criteria.</p>
      </div>
    `;
    return;
  }

  products.forEach(product => {
    const card = createProductCard(product);
    productsGrid.appendChild(card);
  });
}

function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';

  const stockStatus = getStockStatus(product.stock);
  const stars = getStarRating(product.rating);

  // Convert price to INR (1 USD = 83 INR approximately)
  const priceInINR = Math.round(product.price * 83);

  card.innerHTML = `
    <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/300x220?text=No+Image'">
    <div class="product-info">
      <span class="product-category">${product.category}</span>
      <h3 class="product-name">${product.name}</h3>
      <p class="product-description">${product.description}</p>
      <div class="product-rating">
        <span class="stars">${stars}</span>
        <span class="rating-count">(${product.reviews} reviews)</span>
      </div>
      <div class="product-footer">
        <span class="product-price">₹${priceInINR.toLocaleString('en-IN')}</span>
        <button class="btn-add-cart" data-product='${JSON.stringify(product).replace(/'/g, "&apos;")}' onclick="addToCart(event, this)">Add to Cart</button>
      </div>
    </div>
  `;

  return card;
}

function getStockStatus(stock) {
  if (stock === 0) {
    return { text: 'Out of Stock', class: 'out' };
  } else if (stock < 50) {
    return { text: `Only ${stock} left`, class: 'low' };
  } else {
    return { text: 'In Stock', class: '' };
  }
}

function getStarRating(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  let stars = '';

  for (let i = 0; i < fullStars; i++) {
    stars += '★';
  }

  if (hasHalfStar) {
    stars += '½';
  }

  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    stars += '☆';
  }

  return stars + ` ${rating.toFixed(1)}`;
}

function updateCount(count, total) {
  productsCount.textContent = `${total} item${total !== 1 ? 's' : ''}`;

  if (currentCategory !== 'all') {
    productsTitle.textContent = currentCategory;
  } else if (currentSearch) {
    productsTitle.textContent = `Search: "${currentSearch}"`;
  } else if (minPrice || maxPrice) {
    productsTitle.textContent = 'Filtered Products';
  } else {
    productsTitle.textContent = 'All Products';
  }
}

function updatePagination(page, totalPages) {
  pageInfo.textContent = `Page ${page} of ${totalPages}`;
  prevPageBtn.disabled = page <= 1;
  nextPageBtn.disabled = page >= totalPages;

  if (totalPages <= 1) {
    pagination.classList.add('hidden');
  } else {
    pagination.classList.remove('hidden');
  }
}

function showLoading() {
  loading.classList.remove('hidden');
  error.classList.add('hidden');
  productsGrid.innerHTML = '';
  pagination.classList.add('hidden');
}

function hideLoading() {
  loading.classList.add('hidden');
}

function showError() {
  loading.classList.add('hidden');
  error.classList.remove('hidden');
}

// Cart Integration
async function loadCartCount() {
  try {
    console.log('Loading cart count for USER_ID:', USER_ID);
    const response = await fetch(`${CART_API_BASE}/${USER_ID}`);

    if (!response.ok) {
      throw new Error('Failed to load cart');
    }

    const result = await response.json();
    console.log('Cart count result:', result);

    if (result.success) {
      updateCartCount(result.data.totalItems);
    }
  } catch (err) {
    console.error('Error loading cart count:', err);
  }
}

function updateCartCount(count) {
  if (cartCountEl) {
    cartCountEl.textContent = count;
  }
}

async function addToCart(event, button) {
  event.stopPropagation();

  const productData = button.dataset.product;

  console.log('addToCart called');
  console.log('USER_ID:', USER_ID);
  console.log('productData:', productData);

  if (!productData) {
    console.error('No product data found');
    return;
  }

  const product = JSON.parse(productData.replace(/&apos;/g, "'"));
  console.log('Parsed product:', product);

  const btnOriginalText = button.textContent;
  button.textContent = 'Adding...';
  button.disabled = true;

  try {
    console.log('Sending to cart API:', {
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    });

    const response = await fetch(`${CART_API_BASE}/${USER_ID}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1
      })
    });

    console.log('Cart API response status:', response.status);

    if (!response.ok) {
      throw new Error('Failed to add to cart');
    }

    const result = await response.json();
    console.log('Cart API result:', result);

    if (result.success) {
      updateCartCount(result.data.totalItems);
      button.textContent = 'Added!';
      button.style.background = '#10b981';

      setTimeout(() => {
        button.textContent = btnOriginalText;
        button.disabled = false;
        button.style.background = '';
      }, 1500);
    }
  } catch (err) {
    console.error('Error adding to cart:', err);
    button.textContent = 'Error';
    button.style.background = '#ef4444';

    setTimeout(() => {
      button.textContent = btnOriginalText;
      button.disabled = false;
      button.style.background = '';
    }, 1500);
  }
}

function handleLogout() {
  localStorage.removeItem('shophub_token');
  localStorage.removeItem('shophub_user');
  window.location.href = LANDING_URL;
}

// Expose addToCart to global scope for onclick handler
window.addToCart = addToCart;
