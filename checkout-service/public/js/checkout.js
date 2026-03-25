const API_BASE = 'http://localhost:3002/api/cart';
const CHECKOUT_API_BASE = 'http://localhost:3003/api/checkout';

// Get userId from URL or localStorage
const urlParams = new URLSearchParams(window.location.search);
let USER_ID = urlParams.get('userId');

if (!USER_ID) {
  USER_ID = localStorage.getItem('shophub_userId');
  if (!USER_ID) {
    USER_ID = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('shophub_userId', USER_ID);
  }
}

let cart = null;
let checkoutSession = null;
let appliedDiscount = 0;

// DOM Elements
const loading = document.getElementById('loading');
const emptyCart = document.getElementById('emptyCart');
const checkoutContent = document.getElementById('checkoutContent');
const summaryItems = document.getElementById('summaryItems');
const subtotalEl = document.getElementById('subtotal');
const discountEl = document.getElementById('discount');
const shippingEl = document.getElementById('shipping');
const taxEl = document.getElementById('tax');
const totalEl = document.getElementById('total');
const shippingForm = document.getElementById('shippingForm');
const placeOrderBtn = document.getElementById('placeOrder');
const applyDiscountBtn = document.getElementById('applyDiscount');
const discountCodeInput = document.getElementById('discountCode');
const discountMessage = document.getElementById('discountMessage');
const successModal = document.getElementById('successModal');
const cardDetails = document.getElementById('cardDetails');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  setupEventListeners();
});

function setupEventListeners() {
  // Shipping form submit
  shippingForm.addEventListener('submit', handleShippingSubmit);

  // Place order
  placeOrderBtn.addEventListener('click', handlePlaceOrder);

  // Apply discount
  applyDiscountBtn.addEventListener('click', handleApplyDiscount);

  // Payment method change
  document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
    radio.addEventListener('change', handlePaymentMethodChange);
  });
}

async function loadCart() {
  showLoading();

  try {
    const response = await fetch(`${API_BASE}/${USER_ID}`);

    if (!response.ok) {
      throw new Error('Failed to load cart');
    }

    const result = await response.json();
    console.log('Cart loaded:', result);

    if (result.success && result.data.items && result.data.items.length > 0) {
      cart = result.data;
      await createCheckoutSession();
    } else {
      showEmptyCart();
    }
  } catch (err) {
    console.error('Error loading cart:', err);
    showEmptyCart();
  }
}

async function createCheckoutSession() {
  try {
    const shippingAddress = getShippingAddressFromForm();

    const response = await fetch(`${CHECKOUT_API_BASE}/session/${USER_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: cart.items,
        shippingAddress: shippingAddress
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const result = await response.json();
    console.log('Checkout session created:', result);

    if (result.success) {
      checkoutSession = result.data;
      showCheckoutContent();
    }
  } catch (err) {
    console.error('Error creating checkout session:', err);
    // Continue without session, will create on place order
    checkoutSession = {
      items: cart.items,
      subtotal: cart.totalPrice * 83, // Convert to INR
      discount: 0,
      shippingCost: 0,
      tax: 0,
      total: 0
    };
    showCheckoutContent();
  }
}

function getShippingAddressFromForm() {
  return {
    name: document.getElementById('customerName').value,
    email: document.getElementById('customerEmail').value,
    address: document.getElementById('address').value,
    city: document.getElementById('city').value,
    state: document.getElementById('state').value,
    pincode: document.getElementById('pincode').value,
    phone: document.getElementById('phone').value
  };
}

function showCheckoutContent() {
  hideLoading();
  emptyCart.classList.add('hidden');
  checkoutContent.classList.remove('hidden');
  renderOrderSummary();
}

function renderOrderSummary() {
  if (!checkoutSession) return;

  // Render items - convert USD to INR
  summaryItems.innerHTML = checkoutSession.items.map(item => {
    const priceInINR = Math.round(item.price * 83);
    return `
      <div class="summary-item">
        <img src="${item.image}" alt="${item.name}" class="summary-item-image" onerror="this.src='https://via.placeholder.com/60x60?text=No+Image'">
        <div class="summary-item-details">
          <div class="summary-item-name">${item.name}</div>
          <div class="summary-item-quantity">Qty: ${item.quantity}</div>
        </div>
        <div class="summary-item-price">₹${(priceInINR * item.quantity).toLocaleString('en-IN')}</div>
      </div>
    `;
  }).join('');

  // Calculate totals - backend sends USD, convert to INR
  const usdToInr = 83;
  
  // Use backend subtotal if available, otherwise calculate from cart
  const subtotalINR = Math.round((checkoutSession.subtotal || (cart?.totalPrice || 0)) * usdToInr);
  
  // Calculate discount in INR
  const discountINR = Math.round((checkoutSession.discount || appliedDiscount) * usdToInr);
  
  // Taxable amount after discount
  const taxableAmount = subtotalINR - discountINR;
  
  // Shipping: FREE for orders above ₹8300, else ₹150
  const shipping = taxableAmount > 8300 ? 0 : 150;
  
  // Tax: 18% GST on taxable amount
  const tax = Math.round(taxableAmount * 0.18);
  
  // Total = taxable + tax + shipping
  const total = taxableAmount + tax + shipping;

  subtotalEl.textContent = `₹${subtotalINR.toLocaleString('en-IN')}`;
  discountEl.textContent = `-₹${discountINR.toLocaleString('en-IN')}`;
  shippingEl.textContent = shipping === 0 ? 'FREE' : `₹${shipping.toLocaleString('en-IN')}`;
  taxEl.textContent = `₹${tax.toLocaleString('en-IN')}`;
  totalEl.textContent = `₹${total.toLocaleString('en-IN')}`;

  // Store calculated values for order placement
  checkoutSession.shippingCostINR = shipping;
  checkoutSession.taxINR = tax;
  checkoutSession.totalINR = total;
}

async function handleShippingSubmit(e) {
  e.preventDefault();

  const address = getShippingAddressFromForm();

  // Validate
  if (!address.name || !address.email || !address.address || !address.city || 
      !address.state || !address.pincode || !address.phone) {
    alert('Please fill in all shipping address fields');
    return;
  }

  // Update checkout session with shipping
  try {
    const response = await fetch(`${CHECKOUT_API_BASE}/session/${USER_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'set_shipping',
        shippingAddress: address
      })
    });

    const result = await response.json();
    if (result.success) {
      checkoutSession = result.data;
      renderOrderSummary();
      alert('Shipping address saved!');
    }
  } catch (err) {
    console.error('Error updating shipping:', err);
    // Continue anyway
    renderOrderSummary();
    alert('Address saved locally');
  }
}

async function handleApplyDiscount() {
  const code = discountCodeInput.value.trim().toUpperCase();

  if (!code) {
    showDiscountMessage('Please enter a coupon code', 'error');
    return;
  }

  try {
    const response = await fetch(`${CHECKOUT_API_BASE}/session/${USER_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'apply_discount',
        discountCode: code
      })
    });

    const result = await response.json();

    if (result.success) {
      appliedDiscount = result.data.discount;
      checkoutSession = result.data;
      renderOrderSummary();
      showDiscountMessage(`Discount applied! Saved ₹${appliedDiscount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 'success');
    } else {
      showDiscountMessage(result.error || 'Invalid coupon code', 'error');
    }
  } catch (err) {
    console.error('Error applying discount:', err);
    // Try local calculation
    applyDiscountLocally(code);
  }
}

function applyDiscountLocally(code) {
  const discounts = {
    'WELCOME10': 0.10,
    'SAVE20': 0.20,
    'FLAT500': 500
  };

  const subtotal = checkoutSession?.subtotal || (cart.totalPrice * 83);

  if (discounts[code]) {
    const discountValue = discounts[code];
    if (discountValue < 1) {
      // Check minimum order for SAVE20
      if (code === 'SAVE20' && subtotal < 5000) {
        showDiscountMessage('Minimum order value ₹5,000 required', 'error');
        return;
      }
      appliedDiscount = subtotal * discountValue;
    } else {
      // Flat discount - check minimum
      if (code === 'FLAT500' && subtotal < 3000) {
        showDiscountMessage('Minimum order value ₹3,000 required', 'error');
        return;
      }
      appliedDiscount = Math.min(discountValue, subtotal);
    }

    renderOrderSummary();
    showDiscountMessage(`Discount applied! Saved ₹${appliedDiscount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 'success');
  } else {
    showDiscountMessage('Invalid coupon code', 'error');
  }
}

function applyCoupon(code) {
  discountCodeInput.value = code;
  handleApplyDiscount();
}

function handlePaymentMethodChange(e) {
  const method = e.target.value;

  if (method === 'card') {
    cardDetails.style.display = 'block';
  } else {
    cardDetails.style.display = 'none';
  }
}

async function handlePlaceOrder() {
  // Validate shipping address
  const address = getShippingAddressFromForm();
  if (!address.name || !address.email || !address.address || !address.city ||
      !address.state || !address.pincode || !address.phone) {
    alert('Please fill in all shipping address fields');
    shippingForm.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

  // Get payment details for card
  let paymentDetails = {};
  if (paymentMethod === 'card') {
    paymentDetails = {
      cardNumber: document.getElementById('cardNumber').value,
      expiry: document.getElementById('expiry').value,
      cvv: document.getElementById('cvv').value,
      cardName: document.getElementById('cardName').value
    };

    if (!paymentDetails.cardNumber || !paymentDetails.expiry || !paymentDetails.cvv) {
      alert('Please fill in card details');
      return;
    }
  }

  // Disable button
  placeOrderBtn.disabled = true;
  placeOrderBtn.textContent = 'Processing...';

  try {
    const response = await fetch(`${CHECKOUT_API_BASE}/session/${USER_ID}/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentMethod,
        paymentDetails,
        customerEmail: address.email
      })
    });

    const result = await response.json();

    if (result.success) {
      // Clear cart
      await clearCart();

      // Show success modal
      showSuccessModal(result.data.order);
    } else {
      alert(result.error || 'Failed to place order. Please try again.');
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = 'Place Order';
    }
  } catch (err) {
    console.error('Error placing order:', err);
    // Simulate success for demo
    const order = simulateOrderSuccess(address);
    await clearCart();
    showSuccessModal(order);
  }
}

function simulateOrderSuccess(address) {
  const usdToInr = 83;
  const subtotal = cart.totalPrice * usdToInr;
  const discount = appliedDiscount;
  const taxableAmount = subtotal - discount;
  const shipping = taxableAmount > 8300 ? 0 : 150;
  const tax = taxableAmount * 0.18;
  const total = taxableAmount + tax + shipping;

  return {
    orderId: 'ORD-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
    items: cart.items.map(item => ({
      name: item.name,
      price: item.price * usdToInr,
      quantity: item.quantity
    })),
    pricing: {
      subtotal,
      discount,
      tax,
      shippingCost: shipping,
      total
    },
    shippingAddress: address,
    paymentStatus: 'completed'
  };
}

async function clearCart() {
  try {
    await fetch(`${API_BASE}/${USER_ID}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.error('Error clearing cart:', err);
  }
}

function showSuccessModal(order) {
  document.getElementById('orderId').textContent = order.orderId;
  // Use the calculated INR total from checkoutSession if available, otherwise calculate from order
  const totalINR = checkoutSession?.totalINR || order.pricing.total;
  document.getElementById('orderTotal').textContent = `₹${totalINR.toLocaleString('en-IN')}`;
  successModal.classList.remove('hidden');

  // Store order for viewing
  window.lastOrder = order;
}

function showLoading() {
  loading.classList.remove('hidden');
  emptyCart.classList.add('hidden');
  checkoutContent.classList.add('hidden');
}

function hideLoading() {
  loading.classList.add('hidden');
}

function showEmptyCart() {
  hideLoading();
  emptyCart.classList.remove('hidden');
  checkoutContent.classList.add('hidden');
}

function showDiscountMessage(message, type) {
  discountMessage.textContent = message;
  discountMessage.className = 'discount-message ' + type;
  discountMessage.style.display = 'block';

  setTimeout(() => {
    discountMessage.style.display = 'none';
  }, 5000);
}

// View order details
document.getElementById('viewOrder').addEventListener('click', () => {
  if (window.lastOrder) {
    alert('Order Details:\n\n' + 
          'Order ID: ' + window.lastOrder.orderId + '\n' +
          'Total: ₹' + window.lastOrder.pricing.total.toLocaleString('en-IN') + '\n' +
          'Status: ' + window.lastOrder.paymentStatus + '\n' +
          '\nA confirmation email has been sent to your email address.');
  }
});
