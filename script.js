// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyA2ZYXb2os2EmQcV8cDkpSqiCrpg4pbV-w",
    authDomain: "canteen-management-522ee.firebaseapp.com",
    databaseURL: "https://canteen-management-522ee-default-rtdb.firebaseio.com",
    projectId: "canteen-management-522ee",
    storageBucket: "canteen-management-522ee.firebasestorage.app",
    messagingSenderId: "419983098095",
    appId: "1:419983098095:web:f9bb890b545ab2fe9bdb1a"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// DOM Elements
const studentLoginBtn = document.getElementById('student-login-btn');
const staffLoginBtn = document.getElementById('staff-login-btn');
const adminLoginBtn = document.getElementById('admin-login-btn');
const loginModal = document.getElementById('login-modal');
const closeBtn = document.querySelector('.close-btn');
const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginSubmit = document.getElementById('login-submit');
const loginError = document.getElementById('login-error');
const modalTitle = document.getElementById('modal-title');

// Dashboard elements (only if they exist on the current page)
const studentDashboard = document.getElementById('student-dashboard');
const staffDashboard = document.getElementById('staff-dashboard');
const adminDashboard = document.getElementById('admin-dashboard');

// Student dashboard elements
const studentMenuBtn = document.getElementById('student-menu-btn');
const studentCartBtn = document.getElementById('student-cart-btn');
const studentOrdersBtn = document.getElementById('student-orders-btn');
const studentLogoutBtn = document.getElementById('student-logout-btn');
const menuSection = document.getElementById('menu-section');
const cartSection = document.getElementById('cart-section');
const ordersSection = document.getElementById('orders-section');
const menuItemsContainer = document.getElementById('menu-items');
const cartItemsContainer = document.getElementById('cart-items');
const studentOrderList = document.getElementById('student-order-list');
const cartTotal = document.getElementById('cart-total');
const cartCount = document.getElementById('cart-count');
const checkoutBtn = document.getElementById('checkout-btn');

// Staff dashboard elements
const staffOrdersBtn = document.getElementById('staff-orders-btn');
const staffMenuBtn = document.getElementById('staff-menu-btn');
const staffLogoutBtn = document.getElementById('staff-logout-btn');
const staffOrdersSection = document.getElementById('staff-orders-section');
const staffMenuSection = document.getElementById('staff-menu-section');
const orderList = document.getElementById('order-list');
const staffMenuItems = document.getElementById('staff-menu-items');

// Admin dashboard elements
const adminMenuBtn = document.getElementById('admin-menu-btn');
const adminUsersBtn = document.getElementById('admin-users-btn');
const adminLogoutBtn = document.getElementById('admin-logout-btn');
const adminMenuSection = document.getElementById('admin-menu-section');
const adminUsersSection = document.getElementById('admin-users-section');
const adminMenuItems = document.getElementById('admin-menu-items');
const usersContainer = document.getElementById('users-container');
const addItemForm = document.getElementById('add-item-form');
const addUserForm = document.getElementById('add-user-form');
const userTypeFilter = document.getElementById('user-type-filter');

// Global variables
let currentUser = null;
let userType = null;
let cart = [];
let menuItems = [];
let hasRedirected = false; // Track if we've already redirected
let adminCredentials = null;

// Event Listeners
if (studentLoginBtn) studentLoginBtn.addEventListener('click', () => openLoginModal('student'));
if (staffLoginBtn) staffLoginBtn.addEventListener('click', () => openLoginModal('staff'));
if (adminLoginBtn) adminLoginBtn.addEventListener('click', () => openLoginModal('admin'));
if (closeBtn) closeBtn.addEventListener('click', closeLoginModal);
if (loginForm) loginForm.addEventListener('submit', handleLogin);

if (studentMenuBtn) studentMenuBtn.addEventListener('click', () => toggleStudentSection('menu'));
if (studentCartBtn) studentCartBtn.addEventListener('click', () => toggleStudentSection('cart'));
if (studentOrdersBtn) studentOrdersBtn.addEventListener('click', () => toggleStudentSection('orders'));
if (studentLogoutBtn) studentLogoutBtn.addEventListener('click', logout);

if (staffOrdersBtn) staffOrdersBtn.addEventListener('click', () => toggleStaffSection('orders'));
if (staffMenuBtn) staffMenuBtn.addEventListener('click', () => toggleStaffSection('menu'));
if (staffLogoutBtn) staffLogoutBtn.addEventListener('click', logout);

if (adminMenuBtn) adminMenuBtn.addEventListener('click', () => toggleAdminSection('menu'));
if (adminUsersBtn) adminUsersBtn.addEventListener('click', () => toggleAdminSection('users'));
if (adminLogoutBtn) adminLogoutBtn.addEventListener('click', logout);

if (checkoutBtn) checkoutBtn.addEventListener('click', handleCheckout);
if (addItemForm) addItemForm.addEventListener('submit', addMenuItem);
if (addUserForm) addUserForm.addEventListener('submit', addUser);
if (userTypeFilter) userTypeFilter.addEventListener('change', loadUsers);

// Initialize the app
function init() {
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            checkUserType(user.uid)
                .then(type => {
                    if (!type) {
                        // User type not found, force logout
                        return auth.signOut();
                    }

                    userType = type;
                    
                    // If we're on the login page and haven't redirected yet
                    if (isLoginPage() && !hasRedirected) {
                        redirectToDashboard(type);
                        hasRedirected = true;
                    } 
                    // If we're on a dashboard page
                    else if (!isLoginPage()) {
                        showDashboard();
                        // Load appropriate data based on user type
                        switch(type) {
                            case 'student':
                                if (menuItemsContainer) loadMenuItems();
                                if (cartCount) loadCart();
                                if (studentOrderList) loadStudentOrders();
                                break;
                            case 'staff':
                                if (staffMenuItems) loadMenuItems();
                                if (orderList) loadOrders();
                                break;
                            case 'admin':
                                if (adminMenuItems) loadMenuItems();
                                if (usersContainer) loadUsers();
                                if (orderList) loadOrders();
                                break;
                        }
                    }
                })
                .catch(error => {
                    console.error("Error checking user type:", error);
                    auth.signOut();
                });
        } else {
            // User is signed out
            currentUser = null;
            userType = null;
            hasRedirected = false;
            
            // If we're on a dashboard page, redirect to login
            if (!isLoginPage()) {
                window.location.href = 'index.html';
            }
        }
    });

    // Initial load of common elements
    if (menuItemsContainer || staffMenuItems || adminMenuItems) {
        loadMenuItems();
    }
}

// Check if current page is the login page
function isLoginPage() {
    return window.location.pathname.endsWith('index.html') || 
           window.location.pathname === '/';
}

// Open login modal with specific user type
function openLoginModal(type) {
    userType = type;
    modalTitle.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} Login`;
    loginModal.style.display = 'block';
}

// Close login modal
function closeLoginModal() {
    loginModal.style.display = 'none';
    loginError.textContent = '';
    loginForm.reset();
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    const email = loginEmail.value;
    const password = loginPassword.value;

    loginSubmit.disabled = true;
    loginSubmit.textContent = 'Logging in...';

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Login successful
            closeLoginModal();
            return checkUserType(userCredential.user.uid);
        })
        .then((type) => {
            if (type === 'admin') {
                storeAdminCredentials();
            }
        })
        .catch((error) => {
            // Handle errors
            loginError.textContent = error.message;
            loginSubmit.disabled = false;
            loginSubmit.textContent = 'Login';
        });
}

// Check user type after login
function checkUserType(uid) {
    return database.ref(`users/${uid}`).once('value')
        .then(snapshot => {
            const userData = snapshot.val();
            if (userData) {
                return userData.type;
            } else {
                // User not found in database
                loginError.textContent = 'User not authorized';
                return auth.signOut().then(() => null);
            }
        })
        .catch(error => {
            console.error('Error checking user type:', error);
            return auth.signOut().then(() => null);
        });
}

// Redirect to appropriate dashboard
function redirectToDashboard(type) {
    let dashboardUrl;
    switch (type) {
        case 'student':
            dashboardUrl = 'student.html';
            break;
        case 'staff':
            dashboardUrl = 'staff.html';
            break;
        case 'admin':
            dashboardUrl = 'admin.html';
            break;
        default:
            return;
    }
    
    // Open in new tab
    window.open(dashboardUrl, '_blank');
}

// Show appropriate dashboard based on user type
function showDashboard() {
    if (!currentUser) return;
    
    // Hide all dashboards first
    if (studentDashboard) studentDashboard.classList.add('hidden');
    if (staffDashboard) staffDashboard.classList.add('hidden');
    if (adminDashboard) adminDashboard.classList.add('hidden');

    // Show the correct dashboard
    switch (userType) {
        case 'student':
            if (studentDashboard) studentDashboard.classList.remove('hidden');
            break;
        case 'staff':
            if (staffDashboard) staffDashboard.classList.remove('hidden');
            break;
        case 'admin':
            if (adminDashboard) adminDashboard.classList.remove('hidden');
            break;
        default:
            auth.signOut();
    }
}

// Toggle student sections
function toggleStudentSection(section) {
    menuSection.classList.add('hidden');
    cartSection.classList.add('hidden');
    ordersSection.classList.add('hidden');

    switch(section) {
        case 'menu':
            menuSection.classList.remove('hidden');
            break;
        case 'cart':
            cartSection.classList.remove('hidden');
            renderCart();
            break;
        case 'orders':
            ordersSection.classList.remove('hidden');
            loadStudentOrders();
            break;
    }
}

// Toggle staff sections
function toggleStaffSection(section) {
    if (section === 'orders') {
        staffOrdersSection.classList.remove('hidden');
        staffMenuSection.classList.add('hidden');
    } else {
        staffOrdersSection.classList.add('hidden');
        staffMenuSection.classList.remove('hidden');
    }
}

// Toggle admin sections
function toggleAdminSection(section) {
    if (section === 'menu') {
        adminMenuSection.classList.remove('hidden');
        adminUsersSection.classList.add('hidden');
    } else {
        adminMenuSection.classList.add('hidden');
        adminUsersSection.classList.remove('hidden');
    }
}

// Load menu items from Firebase
function loadMenuItems() {
    database.ref('menu').on('value', snapshot => {
        menuItems = [];
        snapshot.forEach(childSnapshot => {
            const item = childSnapshot.val();
            item.id = childSnapshot.key;
            menuItems.push(item);
        });
        
        if (menuItemsContainer) renderMenuItems();
        if (staffMenuItems) renderStaffMenuItems();
        if (adminMenuItems) renderAdminMenuItems();
    });
}

// Render menu items for students
function renderMenuItems() {
    menuItemsContainer.innerHTML = '';

    menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.innerHTML = `
        <img src="${item.image || 'https://via.placeholder.com/250x180?text=No+Image'}" alt="${item.name}" class="menu-item-img">
        <div class="menu-item-content">
          <h3 class="menu-item-title">${item.name}</h3>
          <p class="menu-item-desc">${item.description || ''}</p>
          <p class="menu-item-price">₹${item.price}</p>
          <div class="menu-item-actions">
            ${item.soldOut ?
                '<button class="sold-out">Sold Out</button>' :
                `<button class="add-to-cart" data-id="${item.id}">Add to Cart</button>`
            }
          </div>
        </div>
      `;
        menuItemsContainer.appendChild(menuItem);
    });

    // Add event listeners to add to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', addToCart);
    });
}

// Add item to cart
function addToCart(e) {
    const itemId = e.target.getAttribute('data-id');
    const item = menuItems.find(i => i.id === itemId);

    if (item) {
        const existingItem = cart.find(i => i.id === itemId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: itemId,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: 1
            });
        }
        saveCart();
        updateCartCount();
    }
}

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem(`cart_${currentUser.uid}`);
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem(`cart_${currentUser.uid}`, JSON.stringify(cart));
    updateCartCount();
}

// Update cart count
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = count;
}

// Render cart items
function renderCart() {
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Your cart is empty</p>';
        cartTotal.textContent = '0';
        return;
    }

    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
        <div class="cart-item-info">
          <img src="${item.image || 'https://via.placeholder.com/60x60?text=No+Image'}" alt="${item.name}" class="cart-item-img">
          <div>
            <p class="cart-item-name">${item.name}</p>
            <p class="cart-item-price">₹${item.price} x ${item.quantity} = ₹${itemTotal}</p>
          </div>
        </div>
        <div class="cart-item-quantity">
          <button class="quantity-btn minus" data-id="${item.id}">-</button>
          <span>${item.quantity}</span>
          <button class="quantity-btn plus" data-id="${item.id}">+</button>
          <span class="remove-item" data-id="${item.id}">&times;</span>
        </div>
      `;
        cartItemsContainer.appendChild(cartItem);
    });

    cartTotal.textContent = total;

    // Add event listeners to quantity buttons
    document.querySelectorAll('.quantity-btn.minus').forEach(button => {
        button.addEventListener('click', decreaseQuantity);
    });

    document.querySelectorAll('.quantity-btn.plus').forEach(button => {
        button.addEventListener('click', increaseQuantity);
    });

    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', removeItem);
    });
}

// Decrease item quantity
function decreaseQuantity(e) {
    const itemId = e.target.getAttribute('data-id');
    const item = cart.find(i => i.id === itemId);

    if (item && item.quantity > 1) {
        item.quantity -= 1;
        saveCart();
        renderCart();
    }
}

// Increase item quantity
function increaseQuantity(e) {
    const itemId = e.target.getAttribute('data-id');
    const item = cart.find(i => i.id === itemId);

    if (item) {
        item.quantity += 1;
        saveCart();
        renderCart();
    }
}

// Remove item from cart
function removeItem(e) {
    const itemId = e.target.getAttribute('data-id');
    cart = cart.filter(i => i.id !== itemId);
    saveCart();
    renderCart();
}

// Handle checkout
async function handleCheckout() {
    try {
        if (!currentUser) throw new Error("Please login first");
        if (cart.length === 0) throw new Error("Your cart is empty");

        // Convert cart array to items object EXACTLY as rules expect
        const itemsObj = {};
        cart.forEach((item, index) => {
            itemsObj[`item${index}`] = {  // Must use this format (object with keys)
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            };
        });

        // Create order data that MATCHES the rules exactly
        const orderData = {
            studentId: currentUser.uid,
            studentName: currentUser.email.split('@')[0],
            items: itemsObj,  // Must be object, not array
            total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            status: "Pending", // Must be exactly "Pending"
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };

        // Debug: log the exact structure being sent
        console.log("Order data being sent:", JSON.stringify(orderData, null, 2));

        // Push to Firebase
        const orderRef = database.ref('orders').push();
        await orderRef.set(orderData);

        // Clear cart on success
        cart = [];
        saveCart();
        alert(`Order #${orderRef.key} placed successfully!`);
        
        // Show the orders section after checkout
        toggleStudentSection('orders');
        
    } catch (error) {
        console.error("Checkout error:", error);
        alert(`Checkout failed: ${error.message}`);
    }
}

// Load student orders
function loadStudentOrders() {
    if (!currentUser) return;

    studentOrderList.innerHTML = '<p class="loading">Loading your orders...</p>';

    database.ref('orders')
        .orderByChild('studentId')
        .equalTo(currentUser.uid)
        .on('value', snapshot => {
            studentOrderList.innerHTML = '';

            if (!snapshot.exists()) {
                studentOrderList.innerHTML = '<p class="no-orders">You have no orders yet.</p>';
                return;
            }

            snapshot.forEach(childSnapshot => {
                const order = childSnapshot.val();
                order.id = childSnapshot.key;
                renderStudentOrder(order);
            });
        });
}

// Render student order
function renderStudentOrder(order) {
    const orderCard = document.createElement('div');
    orderCard.className = 'order-card';
    
    // Convert items object to array if needed
    const itemsArray = typeof order.items === 'object' ? Object.values(order.items) : order.items;
    
    orderCard.innerHTML = `
        <div class="order-header">
            <span class="order-id">Order #${order.id}</span>
            <span class="order-time">${formatOrderTime(order.createdAt)}</span>
            <span class="order-status status-${order.status.toLowerCase()}">${order.status}</span>
        </div>
        <div class="order-items">
            ${itemsArray.map(item => `
                <div class="order-item">
                    <span>${item.name} x ${item.quantity}</span>
                    <span>₹${item.price * item.quantity}</span>
                </div>
            `).join('')}
        </div>
        <div class="order-total">
            <strong>Total: ₹${order.total}</strong>
        </div>
    `;
    
    studentOrderList.appendChild(orderCard);
}

// Format order time
function formatOrderTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
}

// Load orders for staff
function loadOrders() {
    database.ref('orders').orderByChild('status').on('value', snapshot => {
        orderList.innerHTML = '';

        snapshot.forEach(childSnapshot => {
            const order = childSnapshot.val();
            order.id = childSnapshot.key;

            if (order.status !== 'Completed') {
                renderOrder(order);
            }
        });
    });
}

// Render order for staff
function renderOrder(order) {
    const orderCard = document.createElement('div');
    orderCard.className = 'order-card';
    orderCard.innerHTML = `
      <div class="order-header">
        <span class="order-student">${order.studentName}</span>
        <span class="order-status status-${order.status.toLowerCase()}">${order.status}</span>
      </div>
      <div class="order-items">
        ${Object.values(order.items).map(item => `
          <div class="order-item">
            <span>${item.name} x ${item.quantity}</span>
            <span>₹${item.price * item.quantity}</span>
          </div>
        `).join('')}
      </div>
      <div class="order-total">
        <strong>Total: ₹${order.total}</strong>
      </div>
      <button class="update-status-btn" data-id="${order.id}">Update Status</button>
    `;

    orderList.appendChild(orderCard);

    // Add event listener to update status button
    orderCard.querySelector('.update-status-btn').addEventListener('click', updateOrderStatus);
}

// Update order status
function updateOrderStatus(e) {
    const orderId = e.target.getAttribute('data-id');
    const orderRef = database.ref(`orders/${orderId}`);

    orderRef.once('value')
        .then(snapshot => {
            const order = snapshot.val();
            let newStatus;

            switch (order.status) {
                case 'Pending':
                    newStatus = 'Preparing';
                    break;
                case 'Preparing':
                    newStatus = 'Ready';
                    break;
                case 'Ready':
                    newStatus = 'Completed';
                    break;
                default:
                    newStatus = 'Pending';
            }

            return orderRef.update({ status: newStatus });
        })
        .catch(error => {
            console.error('Error updating order status:', error);
        });
}

// Render menu items for staff
function renderStaffMenuItems() {
    staffMenuItems.innerHTML = '';

    menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.innerHTML = `
          <img src="${item.image || 'https://via.placeholder.com/250x180?text=No+Image'}" alt="${item.name}" class="menu-item-img">
          <div class="menu-item-content">
            <h3 class="menu-item-title">${item.name}</h3>
            <p class="menu-item-desc">${item.description || ''}</p>
            <p class="menu-item-price">₹${item.price}</p>
            <div class="menu-item-actions">
              <button class="${item.soldOut ? 'add-to-cart' : 'sold-out'}" data-id="${item.id}">
                ${item.soldOut ? 'Mark Available' : 'Mark Sold Out'}
              </button>
            </div>
          </div>
        `;
        staffMenuItems.appendChild(menuItem);
    });

    // Add event listeners to toggle sold out status
    document.querySelectorAll('.menu-item-actions button').forEach(button => {
        button.addEventListener('click', toggleSoldOutStatus);
    });
}

// Toggle sold out status
function toggleSoldOutStatus(e) {
    const itemId = e.target.getAttribute('data-id');
    const itemRef = database.ref(`menu/${itemId}`);

    itemRef.once('value')
        .then(snapshot => {
            const item = snapshot.val();
            return itemRef.update({ soldOut: !item.soldOut });
        })
        .catch(error => {
            console.error('Error updating item status:', error);
        });
}

// Render menu items for admin
function renderAdminMenuItems() {
    adminMenuItems.innerHTML = '';

    menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.innerHTML = `
          <img src="${item.image || 'https://via.placeholder.com/250x180?text=No+Image'}" alt="${item.name}" class="menu-item-img">
          <div class="menu-item-content">
            <h3 class="menu-item-title">${item.name}</h3>
            <p class="menu-item-desc">${item.description || ''}</p>
            <p class="menu-item-price">₹${item.price}</p>
            <div class="menu-item-actions">
              <button class="sold-out delete-item" data-id="${item.id}">Delete Item</button>
            </div>
          </div>
        `;
        adminMenuItems.appendChild(menuItem);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-item').forEach(button => {
        button.addEventListener('click', deleteMenuItem);
    });
}

// Add menu item
function addMenuItem(e) {
    e.preventDefault();

    const name = document.getElementById('item-name').value;
    const description = document.getElementById('item-description').value;
    const price = parseFloat(document.getElementById('item-price').value);
    const image = document.getElementById('item-image').value;

    if (!name || !price) {
        alert('Name and price are required');
        return;
    }

    const newItem = {
        name,
        description,
        price,
        image,
        soldOut: false
    };

    database.ref('menu').push(newItem)
        .then(() => {
            addItemForm.reset();
        })
        .catch(error => {
            console.error('Error adding menu item:', error);
        });
}

// Delete menu item
function deleteMenuItem(e) {
    const itemId = e.target.getAttribute('data-id');
    if (confirm('Are you sure you want to delete this item?')) {
        database.ref(`menu/${itemId}`).remove()
            .catch(error => {
                console.error('Error deleting menu item:', error);
            });
    }
}

// Load users for admin
function loadUsers() {
    // Check if user is admin first
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    database.ref(`users/${currentUser.uid}/type`).once('value')
        .then(snapshot => {
            const userType = snapshot.val();
            if (userType !== 'admin') {
                throw new Error('PERMISSION_DENIED: Only admins can view users');
            }

            const selectedType = userTypeFilter ? userTypeFilter.value : 'all';
            if (usersContainer) {
                usersContainer.innerHTML = '<p class="loading-users">Loading users...</p>';
            }

            return database.ref('users').once('value');
        })
        .then(snapshot => {
            if (!usersContainer) return;
            
            usersContainer.innerHTML = '';

            if (!snapshot.exists()) {
                usersContainer.innerHTML = '<p class="no-users-message">No users found in database.</p>';
                return;
            }

            const selectedType = userTypeFilter ? userTypeFilter.value : 'all';
            let hasUsers = false;

            snapshot.forEach(childSnapshot => {
                const user = childSnapshot.val();
                
                // Filter by selected type
                if (selectedType === 'all' || user.type === selectedType) {
                    hasUsers = true;
                    const userCard = document.createElement('div');
                    userCard.className = 'user-card';
                    userCard.innerHTML = `
                        <div>
                            <span class="user-email">${user.email}</span>
                            <span class="user-type type-${user.type}">${user.type}</span>
                        </div>
                        ${user.type !== 'admin' ? `<span class="delete-user" data-id="${childSnapshot.key}">&times;</span>` : ''}
                    `;
                    usersContainer.appendChild(userCard);
                }
            });

            if (!hasUsers) {
                usersContainer.innerHTML = `<p class="no-users-message">No ${selectedType === 'all' ? '' : selectedType + ' '}users found.</p>`;
            }

            // Add delete button event listeners
            document.querySelectorAll('.delete-user').forEach(btn => {
                btn.addEventListener('click', deleteUser);
            });
        })
        .catch(error => {
            console.error("Error loading users:", error);
            if (usersContainer) {
                usersContainer.innerHTML = `
                    <p class="error-message">
                        ${error.message.includes('PERMISSION_DENIED') 
                            ? 'You need admin privileges to view users' 
                            : 'Error loading users: ' + error.message}
                    </p>
                `;
            }
        });
}

// Add user
function addUser(e) {
    e.preventDefault();

    const type = document.getElementById('user-type').value;
    const email = document.getElementById('user-email').value;
    const password = document.getElementById('user-password').value;

    if (!type || !email || !password) {
        alert('All fields are required');
        return;
    }

    // Store current admin credentials
    const currentUser = auth.currentUser;
    if (!currentUser) {
        alert('Session expired. Please login again.');
        return;
    }

    // Get current user's auth token before creating new user
    currentUser.getIdToken()
        .then((idToken) => {
            // Create new user
            return auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    const newUser = userCredential.user;
                    
                    // Add user to database using admin credentials
                    return database.ref(`users/${newUser.uid}`).set({
                        email: email,
                        type: type
                    }, (error) => {
                        if (error) {
                            throw error;
                        }
                        return newUser;
                    });
                });
        })
        .then(() => {
            // Re-authenticate admin to maintain session
            return auth.signInWithEmailAndPassword(currentUser.email, prompt("Please re-enter your admin password to continue:"));
        })
        .then(() => {
            addUserForm.reset();
            alert(`${type} user created successfully!`);
            return loadUsers();
        })
        .catch(error => {
            console.error('Error adding user:', error);
            
            // Re-authenticate admin if session was lost
            if (error.code === 'auth/requires-recent-login') {
                auth.signInWithEmailAndPassword(currentUser.email, prompt("Session expired. Please re-enter your admin password:"))
                    .then(() => loadUsers());
            }
            
            if (error.code === 'auth/email-already-in-use') {
                alert('This email is already registered.');
            } else {
                alert('Error: ' + error.message);
            }
            
            loadUsers();
        });
}

// Delete user
function deleteUser(e) {
    const userId = e.target.getAttribute('data-id');

    if (confirm('Are you sure you want to delete this user?')) {
        // Delete from database
        database.ref(`users/${userId}`).remove()
            .then(() => {
                // Delete from authentication (requires admin privileges)
                // Note: In a real app, this would need to be done via a Cloud Function
                // as client-side SDK doesn't allow deleting other users directly
                console.log('User removed from database. Note: User still exists in authentication.');
                loadUsers();
            })
            .catch(error => {
                console.error('Error deleting user:', error);
            });
    }
}

// Logout
function logout() {
    auth.signOut()
        .then(() => {
            cart = [];
            saveCart();
            window.location.href = 'index.html';
        })
        .catch(error => {
            console.error('Error signing out:', error);
        });
}

// Store admin credentials for session maintenance
function storeAdminCredentials() {
    if (auth.currentUser && userType === 'admin') {
        adminCredentials = {
            email: auth.currentUser.email,
            // Note: In production, use a more secure method than prompt()
            password: prompt("Please enter your admin password for session maintenance:")
        };
    }
}

// Initialize the app
init();
