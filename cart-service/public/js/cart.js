// Use relative paths prefixed with "/cart" so the Ingress rewrites to the cart service.
const API_BASE = '/cart/api/cart';
// Link back to the catalog UI (served under /catalog).
const CATALOG_URL = '/catalog';

// Get userId from URL parameter or localStorage
const urlParams = new URLSearchParams(window.location.search);
let USER_ID = urlParams.get('userId');

if (!USER_ID) {
  // Fallback to localStorage if no userId in URL
  USER_ID = localStorage.getItem('shophub_userId');
  if (!USER_ID) {
    USER_ID = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('shophub_userId', USER_ID);
  }
} else {
  // Save userId from URL to localStorage for future use
  localStorage.setItem('shophub_userId', USER_ID);
}

let cart = null;

// DOM Elements
const loading = document.getElementById('loading');
const emptyCart = document.getElementById('emptyCart');
const cartContent = document.getElementById('cartContent');
const cartItemsContainer = document.getElementById('cartItems');
const itemCount = document.getElementById('itemCount');
const headerTotal = document.getElementById('headerTotal');
const subtotalEl = document.getElementById('subtotal');
const shippingEl = document.getElementById('shipping');
const taxEl = document.getElementById('tax');
const totalEl = document.getElementById('total');
const clearCartBtn = document.getElementById('clearCart');
const proceedToCheckoutBtn = document.getElementById('proceedToCheckout');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('=== CART PAGE LOADED ===');
  console.log('localStorage keys:', Object.keys(localStorage));
  console.log('shophub_userId from storage:', localStorage.getItem('shophub_userId'));
  console.log('USER_ID being used:', USER_ID);

  // Update orders link with userId
  const ordersLink = document.getElementById('ordersLink');
  if (ordersLink) {
    // Checkout service is reachable at /checkout
    ordersLink.href = `/checkout/orders?userId=${USER_ID}`;
  }

  loadCart();
  setupEventListeners();
});

function setupEventListeners() {
  clearCartBtn.addEventListener('click', handleClearCart);
  if (proceedToCheckoutBtn) {
    proceedToCheckoutBtn.addEventListener('click', handleProceedToCheckout);
  }
}

function handleProceedToCheckout() {
  // Redirect to the checkout service (assumed to be exposed at /checkout)
  window.location.href = `/checkout?userId=${USER_ID}`;
}

async function loadCart() {
  showLoading();

  console.log('Loading cart for USER_ID:', USER_ID);
  console.log('API_BASE:', API_BASE);

  try {
    const response = await fetch(`${API_BASE}/${USER_ID}`);
    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error('Failed to load cart');
    }

    const result = await response.json();
    console.log('Cart result:', result);

    if (result.success) {
      cart = result.data;
      console.log('Cart items:', cart.items);
      console.log('Cart total:', cart.totalPrice);
      displayCart();
    } else {
      showError();
    }
  } catch (err) {
    console.error('Error loading cart:', err);
    showError();
  }
}

function displayCart() {
  hideLoading();

  if (!cart || cart.items.length === 0) {
    showEmptyCart();
    return;
  }

  showCartContent();
  renderCartItems();
  updateSummary();
}

function renderCartItems() {
  cartItemsContainer.innerHTML = '';

  cart.items.forEach(item => {
    const itemEl = createCartItemElement(item);
    cartItemsContainer.appendChild(itemEl);
  });
}

function createCartItemElement(item) {
  const div = document.createElement('div');
  div.className = 'cart-item';
  div.dataset.itemId = item.id;

  // Use price directly in INR
  const priceInINR = item.price;

  div.innerHTML = `
    <img src="${item.image}" alt="${item.name}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/100x100?text=No+Image'">
    <div class="cart-item-details">
      <h3 class="cart-item-name">${item.name}</h3>
      <p class="cart-item-price">₹${priceInINR.toLocaleString('en-IN')}</p>
      <div class="cart-item-actions">
        <div class="quantity-control">
          <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity - 1})">−</button>
          <span class="quantity-display">${item.quantity}</span>
          <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
        </div>
        <button class="remove-btn" onclick="removeItem('${item.id}')">Remove</button>
      </div>
    </div>
  `;

  return div;
}

function updateSummary() {
  // Use prices directly in INR
  const subtotal = cart.totalPrice;
  const shipping = subtotal > 8300 ? 0 : 830; // Free shipping over ₹8300
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + shipping + tax;

  itemCount.textContent = cart.totalItems;
  headerTotal.textContent = `₹${subtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  subtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  shippingEl.textContent = shipping === 0 ? 'FREE' : `₹${shipping.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  taxEl.textContent = `₹${tax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  totalEl.textContent = `₹${total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

async function updateQuantity(itemId, newQuantity) {
  try {
    const response = await fetch(`${API_BASE}/${USER_ID}/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ quantity: newQuantity })
    });

    if (!response.ok) {
      throw new Error('Failed to update quantity');
    }

    const result = await response.json();
    
    if (result.success) {
      cart = result.data;
      displayCart();
    }
  } catch (err) {
    console.error('Error updating quantity:', err);
    alert('Failed to update quantity. Please try again.');
  }
}

async function removeItem(itemId) {
  try {
    const response = await fetch(`${API_BASE}/${USER_ID}/items/${itemId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to remove item');
    }

    const result = await response.json();
    
    if (result.success) {
      cart = result.data;
      displayCart();
    }
  } catch (err) {
    console.error('Error removing item:', err);
    alert('Failed to remove item. Please try again.');
  }
}

async function handleClearCart() {
  if (!confirm('Are you sure you want to clear your cart?')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/${USER_ID}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to clear cart');
    }

    const result = await response.json();
    
    if (result.success) {
      cart = result.data;
      displayCart();
    }
  } catch (err) {
    console.error('Error clearing cart:', err);
    alert('Failed to clear cart. Please try again.');
  }
}

function showLoading() {
  loading.classList.remove('hidden');
  emptyCart.classList.add('hidden');
  cartContent.classList.add('hidden');
}

function hideLoading() {
  loading.classList.add('hidden');
}

function showEmptyCart() {
  emptyCart.classList.remove('hidden');
  cartContent.classList.add('hidden');
  headerTotal.textContent = '$0.00';
}

function showCartContent() {
  emptyCart.classList.add('hidden');
  cartContent.classList.remove('hidden');
}

function showError() {
  hideLoading();
  emptyCart.classList.remove('hidden');
  emptyCart.querySelector('h2').textContent = 'Oops! Something went wrong';
  emptyCart.querySelector('p').textContent = 'Failed to load your cart. Please refresh the page.';
}

// Expose functions for inline onclick handlers
window.updateQuantity = updateQuantity;
window.removeItem = removeItem;
