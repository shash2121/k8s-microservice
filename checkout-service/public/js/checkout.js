// ShopHub Checkout Service - Frontend
// Clean, simple implementation for checkout flow

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    API_BASE: 'http://localhost:3002/api/cart',
    CHECKOUT_API: 'http://localhost:3003/api/checkout'
  };

  // State
  let state = {
    userId: null,
    cart: null,
    session: null,
    discount: 0
  };

  // DOM Elements
  const elements = {};

  // Initialize
  function init() {
    console.log('[init] Starting initialization');
    
    // Get user ID
    const urlParams = new URLSearchParams(window.location.search);
    state.userId = urlParams.get('userId') || localStorage.getItem('shophub_userId') || 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('shophub_userId', state.userId);
    console.log('[init] User ID:', state.userId);

    // Cache DOM elements
    elements.loading = document.getElementById('loading');
    elements.emptyCart = document.getElementById('emptyCart');
    elements.checkoutContent = document.getElementById('checkoutContent');
    elements.summaryItems = document.getElementById('summaryItems');
    elements.subtotal = document.getElementById('subtotal');
    elements.discount = document.getElementById('discount');
    elements.shipping = document.getElementById('shipping');
    elements.tax = document.getElementById('tax');
    elements.total = document.getElementById('total');
    elements.shippingForm = document.getElementById('shippingForm');
    elements.placeOrderBtn = document.getElementById('placeOrder');
    elements.applyDiscountBtn = document.getElementById('applyDiscount');
    elements.discountCode = document.getElementById('discountCode');
    elements.discountMessage = document.getElementById('discountMessage');
    elements.successModal = document.getElementById('successModal');
    elements.confirmModal = document.getElementById('confirmModal');
    elements.cardDetails = document.getElementById('cardDetails');
    elements.confirmYes = document.getElementById('confirmYes');
    elements.confirmNo = document.getElementById('confirmNo');

    // Debug: Log all element IDs
    console.log('[init] All elements:', Object.keys(elements));
    console.log('[init] placeOrderBtn:', elements.placeOrderBtn);
    console.log('[init] confirmYes:', elements.confirmYes);
    console.log('[init] confirmNo:', elements.confirmNo);

    // ENSURE MODALS ARE HIDDEN ON PAGE LOAD
    if (elements.successModal) {
      elements.successModal.style.display = 'none';
      console.log('[init] Success modal hidden');
    }
    if (elements.confirmModal) {
      elements.confirmModal.style.display = 'none';
      console.log('[init] Confirm modal hidden');
    }

    // Setup event listeners
    setupEventListeners();

    // Load cart
    loadCart();
  }

  function setupEventListeners() {
    console.log('[setupEventListeners] Setting up event listeners');
    console.log('[setupEventListeners] placeOrderBtn:', elements.placeOrderBtn);
    console.log('[setupEventListeners] confirmYes:', elements.confirmYes);
    console.log('[setupEventListeners] confirmNo:', elements.confirmNo);

    // Shipping form submit
    if (elements.shippingForm) {
      elements.shippingForm.addEventListener('submit', handleShippingSubmit);
      console.log('[setupEventListeners] Shipping form listener added');
    }

    // Place order button
    if (elements.placeOrderBtn) {
      // Add a simple test listener first
      elements.placeOrderBtn.addEventListener('click', function(e) {
        console.log('[test] Place order button clicked!');
        e.preventDefault();
      });
      console.log('[setupEventListeners] Test listener added to placeOrderBtn');
      
      // Add the actual listener
      elements.placeOrderBtn.addEventListener('click', showConfirmModal);
      console.log('[setupEventListeners] showConfirmModal listener added to placeOrderBtn');
    } else {
      console.error('[setupEventListeners] placeOrderBtn not found!');
    }

    // Confirmation modal buttons
    if (elements.confirmYes) {
      elements.confirmYes.addEventListener('click', confirmOrder);
      console.log('[setupEventListeners] Confirm yes listener added');
    }
    if (elements.confirmNo) {
      elements.confirmNo.addEventListener('click', hideConfirmModal);
      console.log('[setupEventListeners] Confirm no listener added');
    }

    // Discount button
    if (elements.applyDiscountBtn) {
      elements.applyDiscountBtn.addEventListener('click', applyDiscount);
      console.log('[setupEventListeners] Apply discount listener added');
    }

    // Payment method change
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
      radio.addEventListener('change', e => {
        if (elements.cardDetails) {
          elements.cardDetails.style.display = e.target.value === 'card' ? 'block' : 'none';
        }
      });
    });
  }

  // Cart operations
  async function loadCart() {
    showLoading();
    try {
      const response = await fetch(`${CONFIG.API_BASE}/${state.userId}`);
      const result = await response.json();

      if (result.success && result.data.items && result.data.items.length > 0) {
        state.cart = result.data;
        await createCheckoutSession();
        showCheckoutContent();
      } else {
        showEmptyCart();
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      showEmptyCart();
    }
  }

  async function createCheckoutSession() {
    try {
      const response = await fetch(`${CONFIG.CHECKOUT_API}/session/${state.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: state.cart.items })
      });
      const result = await response.json();
      if (result.success) {
        state.session = result.data;
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  }

  // UI helpers
  function showLoading() {
    elements.loading.classList.remove('hidden');
    elements.emptyCart.classList.add('hidden');
    elements.checkoutContent.classList.add('hidden');
  }

  function hideLoading() {
    elements.loading.classList.add('hidden');
  }

  function showEmptyCart() {
    hideLoading();
    elements.emptyCart.classList.remove('hidden');
    elements.checkoutContent.classList.add('hidden');
  }

  function showCheckoutContent() {
    hideLoading();
    elements.emptyCart.classList.add('hidden');
    elements.checkoutContent.classList.remove('hidden');
    renderOrderSummary();
  }

  function hideConfirmModal() {
    elements.confirmModal.classList.add('hidden');
    if (elements.confirmModal.style) {
      elements.confirmModal.style.display = 'none';
    }
  }

  function showConfirmModal() {
    const address = getShippingAddress();
    if (!validateAddress(address)) {
      alert('Please fill in all shipping address fields');
      elements.shippingForm.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    // Ensure the confirmation modal is visible. Remove the hidden class and explicitly set display.
    elements.confirmModal.classList.remove('hidden');
    if (elements.confirmModal.style) {
      elements.confirmModal.style.display = 'block';
    }
  }

  // Address handling
  function getShippingAddress() {
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

  function validateAddress(address) {
    return address.name && address.email && address.address && 
           address.city && address.state && address.pincode && address.phone;
  }

  async function handleShippingSubmit(e) {
    e.preventDefault();
    const address = getShippingAddress();
    
    if (!validateAddress(address)) {
      alert('Please fill in all shipping address fields');
      return;
    }

    try {
      const response = await fetch(`${CONFIG.CHECKOUT_API}/session/${state.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_shipping', shippingAddress: address })
      });
      const result = await response.json();
      
      if (result.success) {
        state.session = result.data;
        renderOrderSummary();
        alert('Shipping address saved!');
      } else {
        alert(result.error || 'Failed to save address');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Error saving address');
    }
  }

  // Discount handling
  async function applyDiscount() {
    const code = elements.discountCode.value.trim().toUpperCase();
    if (!code) {
      showDiscountMessage('Please enter a coupon code', 'error');
      return;
    }

    try {
      const response = await fetch(`${CONFIG.CHECKOUT_API}/session/${state.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply_discount', discountCode: code })
      });
      const result = await response.json();

      if (result.success) {
        state.discount = result.data.discount;
        state.session = result.data;
        renderOrderSummary();
        showDiscountMessage(`Discount applied! Saved ₹${state.discount.toLocaleString()}`, 'success');
      } else {
        showDiscountMessage(result.error || 'Invalid coupon', 'error');
      }
    } catch (error) {
      console.error('Error applying discount:', error);
      applyLocalDiscount(code);
    }
  }

  function applyLocalDiscount(code) {
    const discounts = {
      'WELCOME10': 0.10,
      'SAVE20': 0.20,
      'FLAT500': 500
    };

    const subtotal = (state.session?.subtotal || state.cart.totalPrice) || 0;
    const discount = discounts[code];

    if (!discount) {
      showDiscountMessage('Invalid coupon code', 'error');
      return;
    }

    if (discount < 1) {
      if (code === 'SAVE20' && subtotal < 5000) {
        showDiscountMessage('Minimum order ₹5,000 required', 'error');
        return;
      }
      state.discount = Math.round(subtotal * discount);
    } else {
      if (code === 'FLAT500' && subtotal < 3000) {
        showDiscountMessage('Minimum order ₹3,000 required', 'error');
        return;
      }
      state.discount = Math.min(discount, subtotal);
    }

    renderOrderSummary();
    showDiscountMessage(`Discount applied! Saved ₹${state.discount.toLocaleString()}`, 'success');
  }

  function showDiscountMessage(message, type) {
    elements.discountMessage.textContent = message;
    elements.discountMessage.className = `discount-message ${type}`;
    elements.discountMessage.style.display = 'block';
    setTimeout(() => {
      elements.discountMessage.style.display = 'none';
    }, 4000);
  }

  // Order summary
  function renderOrderSummary() {
    if (!state.session) return;

     // Render items
     elements.summaryItems.innerHTML = state.session.items.map(item => {
       return `
         <div class="summary-item">
           <img src="${item.image}" alt="${item.name}" class="summary-item-image" 
                onerror="this.src='https://via.placeholder.com/60x60?text=No+Image'">
           <div class="summary-item-details">
             <div class="summary-item-name">${item.name}</div>
             <div class="summary-item-quantity">Qty: ${item.quantity}</div>
           </div>
           <div class="summary-item-price">₹${(item.price * item.quantity).toLocaleString()}</div>
         </div>
       `;
     }).join('');

     // Calculate totals
     const subtotal = state.session.subtotal || state.cart.totalPrice || 0;
     const discount = state.discount || 0;
     const taxable = subtotal - discount;
     const shipping = taxable > 8300 ? 0 : 150;
     const tax = Math.round(taxable * 0.18);
     const total = taxable + tax + shipping;

     elements.subtotal.textContent = `₹${subtotal.toLocaleString()}`;
     elements.discount.textContent = `-₹${discount.toLocaleString()}`;
     elements.shipping.textContent = shipping === 0 ? 'FREE' : `₹${shipping.toLocaleString()}`;
     elements.tax.textContent = `₹${tax.toLocaleString()}`;
     elements.total.textContent = `₹${total.toLocaleString()}`;

     // Store for order placement
     state.session.shippingCostINR = shipping;
     state.session.taxINR = tax;
     state.session.totalINR = total;
  }

  // Order placement
  async function confirmOrder() {
    hideConfirmModal();
    await placeOrder();
  }

  async function placeOrder() {
    const address = getShippingAddress();
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;

    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    const paymentDetails = paymentMethod === 'card' ? {
      cardNumber: document.getElementById('cardNumber').value,
      expiry: document.getElementById('expiry').value,
      cvv: document.getElementById('cvv').value,
      cardName: document.getElementById('cardName').value
    } : {};

    elements.placeOrderBtn.disabled = true;
    elements.placeOrderBtn.textContent = 'Processing...';

    try {
      const response = await fetch(`${CONFIG.CHECKOUT_API}/session/${state.userId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod, paymentDetails, customerEmail: address.email })
      });

      const result = await response.json();

      if (result.success) {
        await clearCart();
        state.session = null;
        showSuccessModal(result.data.order);
      } else {
        alert(result.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order');
    } finally {
      elements.placeOrderBtn.disabled = false;
      elements.placeOrderBtn.textContent = 'Place Order';
    }
  }

  async function clearCart() {
    try {
      await fetch(`${CONFIG.API_BASE}/${state.userId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  }

  function showSuccessModal(order) {
    console.log('[showSuccessModal] Called with order:', order);
    if (!order) {
      console.log('[showSuccessModal] No order data, not showing modal');
      return;
    }
    document.getElementById('orderId').textContent = order.orderId;
    document.getElementById('orderUserId').textContent = state.userId;
    const totalINR = order.pricing?.total || state.session?.totalINR || 0;
    document.getElementById('orderTotal').textContent = `₹${totalINR.toLocaleString()}`;
    // Use inline style to ensure modal is shown
    elements.successModal.style.display = 'flex';
    document.getElementById('viewAllOrdersLink').href = `/orders?userId=${state.userId}`;
    
    const viewOrderBtn = document.getElementById('viewOrder');
    if (viewOrderBtn) {
      viewOrderBtn.addEventListener('click', function() {
        // Show order details in a popup or modal instead of navigating
        alert(`Order ID: ${order.orderId}\nTotal: ₹${order.pricing?.total.toLocaleString()}`);
      });
    }
  }

  // Expose applyCoupon for HTML onclick
  window.applyCoupon = function(code) {
    elements.discountCode.value = code;
    applyDiscount();
  };

  // Start when DOM is ready - use immediate execution for testing
  console.log('[checkout.js] Script loaded, ready state:', document.readyState);
  
  // Force immediate execution for debugging
  init();
})();