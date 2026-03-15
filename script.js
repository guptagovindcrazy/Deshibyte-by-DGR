/* ============================================
   DESHIBYTE BY DGR - Enhanced JavaScript
   Modern ES6+, Cart Persistence, Better UX
   ============================================ */

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Toast notification system - replaces alerts
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'error', 'info'
 * @param {number} duration - Duration in ms (default: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || 'ℹ'}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Close notification">&times;</button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Smooth scroll to element with offset
 */
function scrollToElement(id) {
    const element = document.getElementById(id);
    if (!element) return;
    
    const offset = 80; // Account for fixed navbar
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;
    
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

/**
 * Toggle mobile menu with accessibility
 */
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    const hamburger = document.querySelector('.hamburger');
    const isOpen = menu.style.display === 'flex';
    
    menu.style.display = isOpen ? 'none' : 'flex';
    hamburger.setAttribute('aria-expanded', !isOpen);
}

/**
 * Modal management
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scroll
    }
}

// Close modals on outside click or Escape key
window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal-overlay')) {
        event.target.style.display = 'none';
        document.body.style.overflow = '';
    }
});

window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = '';
    }
});

/**
 * Product modal with better data handling
 */
function openProductModal(title, desc, highlights) {
    document.getElementById('modalProductTitle').innerText = title;
    document.getElementById('modalProductDesc').innerText = desc;
    document.getElementById('modalProductHighlights').innerText = highlights;
    openModal('productModal');
}

/**
 * Show/hide loading overlay
 */
function showLoading() {
    document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

// ============================================
// SCROLL ANIMATIONS (Optimized with Intersection Observer)
// ============================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target); // Stop observing once revealed
        }
    });
}, observerOptions);

// Observe all reveal elements
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});

// ============================================
// SCROLL PROGRESS BAR
// ============================================
window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    
    let progressBar = document.querySelector('.scroll-progress');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        document.body.appendChild(progressBar);
    }
    progressBar.style.width = scrolled + '%';
});

// ============================================
// RATING & REVIEW SYSTEM
// ============================================

let ratings = [5, 5, 4]; // Initial ratings matching static reviews

function updateAverageRating() {
    const sum = ratings.reduce((a, b) => a + b, 0);
    const avg = (sum / ratings.length).toFixed(1);
    const display = document.getElementById('averageRatingDisplay');
    if (display) {
        display.innerText = `⭐ ${avg} / 5 (${ratings.length} Reviews)`;
    }
}

function submitFeedback(event) {
    event.preventDefault();
    
    const name = document.getElementById('fbName').value.trim();
    const rating = parseInt(document.getElementById('fbRating').value);
    const review = document.getElementById('fbReview').value.trim();
    
    // Validation
    if (!name || !review) {
        showToast('Please fill out all fields', 'error');
        return;
    }
    
    if (review.length < 10) {
        showToast('Review must be at least 10 characters', 'error');
        return;
    }
    
    // Update data
    ratings.push(rating);
    updateAverageRating();
    
    const stars = '⭐'.repeat(rating);
    
    // Add to UI
    const carousel = document.getElementById('testimonialCarousel');
    const newReview = document.createElement('div');
    newReview.className = 'testimonial-card reveal active';
    newReview.innerHTML = `
        <p>"${review}"</p>
        <span class="testimonial-author">- ${name}</span>
        <div style="color: gold; margin-top: 5px;">${stars}</div>
    `;
    carousel.insertBefore(newReview, carousel.firstChild);
    
    showToast('Thank you! Your review has been added ✨', 'success');
    document.getElementById('feedbackForm').reset();
}

// ============================================
// CART MANAGEMENT (With LocalStorage Persistence)
// ============================================

const CART_STORAGE_KEY = 'deshibyte_cart';

// Cart state
let cart = [];
let currentSubtotal = 0;
let currentShipping = 0;
let currentGst = 0;
let currentTotal = 0;

// Load cart from localStorage on page load
function loadCartFromStorage() {
    try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
            cart = JSON.parse(stored);
            updateCartUI();
            showToast(`Welcome back! ${cart.length} item(s) in your cart`, 'info', 2000);
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        cart = [];
    }
}

// Save cart to localStorage
function saveCartToStorage() {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
        console.error('Error saving cart:', error);
        showToast('Unable to save cart data', 'error');
    }
}

/**
 * Add product to cart with visual feedback
 */
function addToCart(productName, price, buttonElement) {
    const existingItem = cart.find(item => item.name === productName);
    
    if (existingItem) {
        existingItem.quantity += 1;
        showToast(`${productName} quantity increased to ${existingItem.quantity}`, 'success');
    } else {
        cart.push({ name: productName, price: price, quantity: 1 });
        showToast(`${productName} added to cart!`, 'success');
    }
    
    updateCartUI();
    saveCartToStorage();
    animateAddToCartButton(buttonElement);
}

/**
 * Animate add to cart button
 */
function animateAddToCartButton(buttonElement) {
    if (!buttonElement) return;
    
    const btnText = buttonElement.querySelector('.btn-text');
    const btnLoader = buttonElement.querySelector('.btn-loader');
    
    buttonElement.classList.add('adding');
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline';
    
    setTimeout(() => {
        btnText.textContent = 'Added!';
        btnLoader.style.display = 'none';
        btnText.style.display = 'inline';
        buttonElement.style.background = 'var(--success-green)';
        buttonElement.style.borderColor = 'var(--success-green)';
        buttonElement.style.color = 'white';
    }, 500);
    
    setTimeout(() => {
        btnText.textContent = 'Add to Cart';
        buttonElement.style.background = 'transparent';
        buttonElement.style.borderColor = 'var(--accent-gold)';
        buttonElement.style.color = 'var(--accent-gold)';
        buttonElement.classList.remove('adding');
    }, 1500);
}

/**
 * Change item quantity with animation
 */
function changeQuantity(index, delta) {
    const quantitySpan = document.querySelectorAll('.cart-controls span')[index];
    
    cart[index].quantity += delta;
    
    if (cart[index].quantity <= 0) {
        removeItem(index);
    } else {
        // Animate quantity change
        if (quantitySpan) {
            quantitySpan.classList.add('updating');
            setTimeout(() => quantitySpan.classList.remove('updating'), 200);
        }
        updateCartUI();
        saveCartToStorage();
    }
}

/**
 * Remove item from cart
 */
function removeItem(index) {
    const itemName = cart[index].name;
    cart.splice(index, 1);
    updateCartUI();
    saveCartToStorage();
    showToast(`${itemName} removed from cart`, 'info');
}

/**
 * Update cart UI - comprehensive display update
 */
function updateCartUI() {
    let totalItems = 0;
    currentSubtotal = 0;
    
    cart.forEach(item => {
        totalItems += item.quantity;
        currentSubtotal += (item.price * item.quantity);
    });
    
    // Update cart badge
    const badge = document.getElementById('cart-count-badge');
    if (badge) {
        badge.innerText = totalItems;
        if (totalItems > 0) {
            badge.style.animation = 'pulse 0.3s ease';
            setTimeout(() => badge.style.animation = '', 300);
        }
    }
    
    const container = document.getElementById('cartItemsContainer');
    const summary = document.getElementById('cartSummary');
    
    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-cart-state"><p>Your cart is empty</p><p style="font-size: 0.9rem; margin-top: 10px;">Add some delicious Bihari snacks!</p></div>';
        summary.style.display = 'none';
        document.getElementById('freeShippingMsg').innerText = '';
        hideCheckoutForm();
    } else {
        // Build cart items HTML
        container.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">₹${item.price} each</div>
                    <button class="remove-btn" onclick="removeItem(${index})" aria-label="Remove ${item.name}">Remove</button>
                </div>
                <div class="cart-controls">
                    <button class="qty-btn" type="button" onclick="changeQuantity(${index}, -1)" aria-label="Decrease quantity">-</button>
                    <span aria-label="Quantity">${item.quantity}</span>
                    <button class="qty-btn" type="button" onclick="changeQuantity(${index}, 1)" aria-label="Increase quantity">+</button>
                </div>
                <div style="font-weight: bold; width: 60px; text-align: right;">
                    ₹${item.price * item.quantity}
                </div>
            </div>
        `).join('');
        
        // Calculate finances
        currentShipping = currentSubtotal < 499 ? 50 : 0;
        currentGst = parseFloat((currentSubtotal * 0.05).toFixed(2));
        currentTotal = Math.round(currentSubtotal + currentShipping + currentGst);
        
        // Update summary
        document.getElementById('cartSubtotal').innerText = currentSubtotal;
        document.getElementById('cartShipping').innerText = currentShipping;
        document.getElementById('cartGst').innerText = currentGst;
        document.getElementById('cartFinalTotal').innerText = currentTotal;
        summary.style.display = 'block';
        
        // Shipping progress message
        const shipMsg = document.getElementById('freeShippingMsg');
        if (currentSubtotal < 499) {
            const needed = 499 - currentSubtotal;
            shipMsg.innerText = `Add ₹${needed} more for FREE Shipping!`;
            shipMsg.style.color = '#e67e22';
        } else {
            shipMsg.innerText = '🎉 You\'ve unlocked FREE Shipping!';
            shipMsg.style.color = 'var(--success-green)';
        }
    }
}

/**
 * Show checkout form
 */
function showCheckoutForm() {
    if (cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }
    document.getElementById('cartItemsContainer').style.display = 'none';
    document.getElementById('proceedToCheckoutBtn').style.display = 'none';
    document.getElementById('orderForm').style.display = 'block';
}

/**
 * Hide checkout form
 */
function hideCheckoutForm() {
    document.getElementById('cartItemsContainer').style.display = 'block';
    const checkoutBtn = document.getElementById('proceedToCheckoutBtn');
    if (checkoutBtn) checkoutBtn.style.display = 'block';
    document.getElementById('orderForm').style.display = 'none';
}

// ============================================
// PDF INVOICE GENERATION
// ============================================

/**
 * Generate PDF invoice with error handling
 */
function generatePDF(details) {
    try {
        if (!window.jspdf) {
            throw new Error('PDF library not loaded');
        }
        
        showLoading();
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(22);
        doc.setTextColor(59, 9, 24);
        doc.text('Deshibyte by DGR', 20, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('TAX INVOICE', 170, 20);
        doc.text('Bihar ki dhrohar | FSSAI: 23325060003669', 20, 28);
        doc.line(20, 35, 190, 35);
        
        // Customer details
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text('Billed To:', 20, 45);
        doc.setFontSize(10);
        doc.text(`Name: ${details.name}`, 20, 52);
        doc.text(`Phone: ${details.phone}`, 20, 58);
        
        const addressLines = doc.splitTextToSize(`Address: ${details.address}`, 80);
        doc.text(addressLines, 20, 64);
        
        doc.line(20, 80, 190, 80);
        
        // Table header
        doc.setFont('helvetica', 'bold');
        doc.text('Item', 20, 90);
        doc.text('Qty', 120, 90);
        doc.text('Price', 140, 90);
        doc.text('Total', 170, 90);
        doc.line(20, 95, 190, 95);
        
        // Items
        doc.setFont('helvetica', 'normal');
        let y = 105;
        cart.forEach((item, i) => {
            doc.text(`${i + 1}. ${item.name}`, 20, y);
            doc.text(`${item.quantity}`, 122, y);
            doc.text(`Rs. ${item.price}`, 140, y);
            doc.text(`Rs. ${item.price * item.quantity}`, 170, y);
            y += 10;
        });
        
        // Totals
        doc.line(20, y, 190, y);
        y += 10;
        doc.text('Subtotal:', 140, y);
        doc.text(`Rs. ${currentSubtotal}`, 170, y);
        y += 8;
        doc.text('Shipping:', 140, y);
        doc.text(`Rs. ${currentShipping}`, 170, y);
        y += 8;
        doc.text('GST (5%):', 140, y);
        doc.text(`Rs. ${currentGst}`, 170, y);
        y += 10;
        
        doc.setFont('helvetica', 'bold');
        doc.text('Final Payable:', 140, y);
        doc.text(`Rs. ${currentTotal}`, 170, y);
        
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.text('Thank you for choosing authentic taste! - Deshibyte', 105, 280, null, null, 'center');
        
        // Save with timestamp
        const timestamp = new Date().getTime();
        doc.save(`Deshibyte_Invoice_${details.phone}_${timestamp}.pdf`);
        
        hideLoading();
        return true;
    } catch (error) {
        console.error('PDF generation error:', error);
        hideLoading();
        showToast('Unable to generate PDF. Please screenshot your order.', 'error', 5000);
        return false;
    }
}

// ============================================
// ORDER SUBMISSION
// ============================================

/**
 * Submit order with validation and error handling
 */
function submitOrder(event) {
    event.preventDefault();
    
    // Honeypot check (bot prevention)
    if (document.getElementById('botCheck').value !== '') {
        console.warn('Bot detected');
        return;
    }
    
    if (cart.length === 0) {
        showToast('Please add items to your cart first', 'error');
        return;
    }
    
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    
    // Validation
    if (!name || !phone || !address) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    if (name.length < 3) {
        showToast('Please enter a valid name', 'error');
        return;
    }
    
    const phoneRegex = /^[6-9][0-9]{9}$/;
    if (!phoneRegex.test(phone)) {
        showToast('Please enter a valid 10-digit Indian mobile number', 'error');
        return;
    }
    
    if (address.length < 20) {
        showToast('Please enter a complete address with pincode', 'error');
        return;
    }
    
    if (!paymentMethod) {
        showToast('Please select a payment method', 'error');
        return;
    }
    
    // Generate PDF
    const pdfSuccess = generatePDF({ name, phone, address });
    
    // Build WhatsApp message
    let message = `*🧾 NEW ORDER - DESHIBYTE BY DGR*%0A`;
    message += `_Bihar ki dhrohar_%0A`;
    message += `-----------------------------------%0A%0A`;
    message += `*👤 CUSTOMER DETAILS:*%0A`;
    message += `*Name:* ${encodeURIComponent(name)}%0A`;
    message += `*Phone:* ${phone}%0A`;
    message += `*Address:* ${encodeURIComponent(address)}%0A%0A`;
    message += `*🛒 ORDER:*%0A`;
    
    cart.forEach((item, index) => {
        message += `${index + 1}. *${encodeURIComponent(item.name)}*%0A   Qty: ${item.quantity} x ₹${item.price} = ₹${item.price * item.quantity}%0A`;
    });
    
    message += `%0A-----------------------------------%0A`;
    message += `Subtotal: ₹${currentSubtotal}%0A`;
    message += `Shipping: ₹${currentShipping}%0A`;
    message += `GST (5%%): ₹${currentGst}%0A`;
    message += `-----------------------------------%0A`;
    message += `*💰 FINAL PAYABLE: ₹${currentTotal}*%0A`;
    message += `*💳 Payment Method: ${paymentMethod.toUpperCase()}*%0A`;
    message += `-----------------------------------%0A`;
    
    // Open WhatsApp
    window.open(`https://wa.me/919310404279?text=${message}`, '_blank');
    
    // Clear cart and reset
    cart = [];
    updateCartUI();
    saveCartToStorage();
    hideCheckoutForm();
    closeModal('cartModal');
    document.getElementById('orderForm').reset();
    
    showToast(
        pdfSuccess 
            ? 'Order confirmed! Your invoice is downloading and WhatsApp is opening.' 
            : 'Order confirmed! WhatsApp is opening. Please screenshot your order.',
        'success',
        5000
    );
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Load cart from storage
    loadCartFromStorage();
    
    // Initialize average rating
    updateAverageRating();
    
    // Add keyboard navigation for logo
    const logo = document.querySelector('.logo-container');
    if (logo) {
        logo.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                scrollToElement('home');
            }
        });
    }
    
    console.log('✨ Deshibyte by DGR - Loaded successfully!');
});

// ============================================
// ERROR HANDLING
// ============================================

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Don't show toast for every error, but log it
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});