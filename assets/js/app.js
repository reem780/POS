import { api } from './api.js';
import { translations } from './i18n.js';

// --- STATE MANAGEMENT ---
const state = {
    user: null,
    settings: {},
    currentPage: 'login',
    lang: localStorage.getItem('lang') || 'en',
    darkMode: localStorage.getItem('darkMode') === 'true',
    cart: [],
    products: [],
    categories: [],
    exchangeRate: 89500,
    currency: 'USD',
    loading: false,
    error: null
};

// --- HELPERS ---
const t = (key) => translations[state.lang][key] || key;

const formatCurrency = (amount, symbol = state.currency) => {
    const val = symbol === 'LBP' ? amount * state.exchangeRate : amount;
    return new Intl.NumberFormat(state.lang === 'ar' ? 'ar-LB' : 'en-US', {
        style: 'currency',
        currency: symbol === 'LBP' ? 'LBP' : 'USD'
    }).format(val);
};

const notify = (msg, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

const playSound = (type) => {
    // In a real app, I'd have audio files. Here I'll mock it or use an Oscillator
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'add') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    }
};

// --- ROUTER & NAVIGATION ---
const navigate = (page) => {
    // Navigation Guards
    const isAdmin = state.user?.role === 'admin';
    const restrictedPages = ['products', 'categories', 'settings'];
    
    if (state.user && !isAdmin && restrictedPages.includes(page)) {
        page = 'dashboard';
        notify('Access Denied', 'danger');
    }

    state.currentPage = page;
    window.location.hash = page;
    render();
};

window.addEventListener('hashchange', () => {
    const page = window.location.hash.substring(1) || 'dashboard';
    if (page !== state.currentPage) navigate(page);
});

// --- API ACTIONS ---
const login = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const credentials = Object.fromEntries(formData);
    // Trim credentials
    Object.keys(credentials).forEach(key => credentials[key] = credentials[key].trim());
    
    try {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerText = '...';
        
        const res = await api.auth.login(credentials);
        state.user = res.user;
        state.settings = await api.settings.get();
        navigate('dashboard');
    } catch (err) {
        console.error('Login error:', err.message);
        alert(err.message);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerText = t('login');
    }
};

const logout = async () => {
    await api.auth.logout();
    state.user = null;
    navigate('login');
};

const addToCart = (product) => {
    const existing = state.cart.find(item => item.id === product.id);
    if (existing) {
        if (existing.quantity + 1 > existing.stock) {
            notify('Cannot add more than available stock', 'danger');
            return;
        }
        existing.quantity += 1;
    } else {
        if (1 > product.quantity) {
            notify('Out of stock', 'danger');
            return;
        }
        state.cart.push({ ...product, stock: product.quantity, quantity: 1 });
    }
    playSound('add');
    render();
};

const updateCartQty = (id, delta) => {
    const item = state.cart.find(i => i.id === id);
    if (item) {
        if (delta > 0 && item.quantity + delta > item.stock) {
            notify('Cannot add more than available stock', 'danger');
            return;
        }
        item.quantity += delta;
        if (item.quantity <= 0) {
            state.cart = state.cart.filter(i => i.id !== id);
        }
    }
    render();
};

// --- VIEWS ---
const LoginView = () => `
    <div class="login-container">
        <div class="card login-card">
            <h1>Transactly</h1>
            <p class="text-muted">Supermarket POS System</p>
            <form id="login-form">
                <div class="form-group">
                    <label>${t('username')}</label>
                    <input type="text" name="username" required>
                </div>
                <div class="form-group">
                    <label>${t('password')}</label>
                    <input type="password" name="password" required>
                </div>
                <button type="submit" class="btn btn-primary w-full">${t('login')}</button>
            </form>
            <div class="mt-4 text-xs text-muted opacity-60">
                <p>Admin: admin / admin123</p>
                <p>Cashier: cashier / cashier123</p>
            </div>
        </div>
    </div>
`;

const Sidebar = () => {
    const isAdmin = state.user?.role === 'admin';
    return `
    <div class="sidebar">
        <div class="sidebar-header">
            <h2 class="sidebar-text">Transactly</h2>
        </div>
        <nav class="sidebar-nav">
            <a href="#dashboard" class="nav-item ${state.currentPage === 'dashboard' ? 'active' : ''}">
                <span class="sidebar-text">${t('dashboard')}</span>
            </a>
            <a href="#pos" class="nav-item ${state.currentPage === 'pos' ? 'active' : ''}">
                <span class="sidebar-text">${t('pos')}</span>
            </a>
            <a href="#sales" class="nav-item ${state.currentPage === 'sales' ? 'active' : ''}">
                <span class="sidebar-text">${t('sales')}</span>
            </a>
            ${isAdmin ? `
                <a href="#products" class="nav-item ${state.currentPage === 'products' ? 'active' : ''}">
                    <span class="sidebar-text">${t('products')}</span>
                </a>
                <a href="#categories" class="nav-item ${state.currentPage === 'categories' ? 'active' : ''}">
                    <span class="sidebar-text">${t('categories')}</span>
                </a>
                <a href="#settings" class="nav-item ${state.currentPage === 'settings' ? 'active' : ''}">
                    <span class="sidebar-text">${t('settings')}</span>
                </a>
            ` : ''}
        </nav>
        <div class="sidebar-footer">
            <div class="px-4 mb-2">
                <p class="sidebar-text text-sm font-bold">${state.user?.username}</p>
                <p class="sidebar-text text-xs opacity-60">${state.user?.role}</p>
            </div>
            <button onclick="window.logout()" class="nav-item w-full text-sm border-t border-white/10 mt-2">
                ${t('logout')}
            </button>
        </div>
    </div>
`};

const DashboardView = async () => {
    if (state.user?.role === 'admin') {
        try {
            const summary = await api.sales.summary();
            return `
                <div class="view-header">
                    <h1>${t('admin_overview')}</h1>
                </div>
                <div class="grid grid-4">
                    <div class="card stat-card shadow-lg border-l-4 border-accent">
                        <p class="text-muted text-sm uppercase font-semibold">${t('daily')}</p>
                        <h2 class="text-2xl font-bold">${formatCurrency(summary.daily)}</h2>
                    </div>
                    <div class="card stat-card shadow-lg border-l-4 border-success">
                        <p class="text-muted text-sm uppercase font-semibold">${t('weekly')}</p>
                        <h2 class="text-2xl font-bold">${formatCurrency(summary.weekly)}</h2>
                    </div>
                    <div class="card stat-card shadow-lg border-l-4 border-primary">
                        <p class="text-muted text-sm uppercase font-semibold">${t('monthly')}</p>
                        <h2 class="text-2xl font-bold">${formatCurrency(summary.monthly)}</h2>
                    </div>
                    <div class="card stat-card shadow-lg border-l-4 border-danger">
                        <p class="text-danger text-sm uppercase font-semibold">${t('low_stock')}</p>
                        <h2 class="text-2xl font-bold text-danger">${summary.lowStock}</h2>
                    </div>
                </div>
                <div class="mt-8">
                    <div class="card h-64 flex items-center justify-center text-muted border-dashed border-2 border-border">
                        <p>Recent Activities Pulse chart would go here</p>
                    </div>
                </div>
            `;
        } catch (err) {
            console.error('Dashboard Summary Error:', err);
            return `<div class="card text-danger">Error loading dashboard summary: ${err.message}</div>`;
        }
    } else {
        return `
            <div class="view-header">
                <h1>${t('welcome_back')}, ${state.user?.username}</h1>
                <p class="text-muted">${t('ready')}?</p>
            </div>
            <div class="grid grid-2">
                <div class="card action-card cursor-pointer hover:bg-accent hover:text-white transition-all p-8 flex flex-col items-center justify-center gap-4 border-2 border-transparent hover:border-accent" onclick="navigate('pos')">
                    <div class="bg-light p-4 rounded-full text-accent shadow-sm">🛒</div>
                    <h2 class="text-xl font-bold">${t('start_sale')}</h2>
                    <p class="text-sm text-center opacity-80">Shortcut: F1 to Search, F2 to Pay</p>
                </div>
                <div class="card action-card cursor-pointer hover:bg-success hover:text-white transition-all p-8 flex flex-col items-center justify-center gap-4 border-2 border-transparent hover:border-success" onclick="navigate('sales')">
                    <div class="bg-light p-4 rounded-full text-success shadow-sm">📋</div>
                    <h2 class="text-xl font-bold">${t('sales')}</h2>
                    <p class="text-sm text-center opacity-80">${t('view_recent')}</p>
                </div>
            </div>
        `;
    }
};

const POSView = async () => {
    const products = await api.products.list();
    const subtotal = state.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const taxRate = parseFloat(state.settings.tax_rate || 0) / 100;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    return `
        <div class="pos-layout">
            <div class="pos-products">
                <div class="search-bar">
                    <input type="text" id="pos-search" placeholder="${t('search_product')}" oninput="window.filterPOS(this.value)">
                </div>
                <div class="products-grid" id="pos-products-list">
                    ${products.map(p => `
                        <div class="card product-item" onclick="window.addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')})">
                            ${p.image ? `<div class="product-image"><img src="${p.image}" alt="${p.name}" loading="lazy" referrerPolicy="no-referrer"></div>` : '<div class="product-image placeholder">📦</div>'}
                            <div class="product-info">
                                <h3 class="font-medium">${p.name}</h3>
                                <p class="text-sm text-muted">${p.barcode}</p>
                                <p class="text-accent font-bold">${formatCurrency(p.price)}</p>
                                <p class="text-xs ${p.quantity < 10 ? 'text-danger' : 'text-muted'}">Stock: ${p.quantity}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="pos-cart card">
                <h3>${t('pos')}</h3>
                <div class="cart-items">
                    ${state.cart.length === 0 ? `<p class="text-muted text-center py-8">Cart is empty</p>` : state.cart.map(item => `
                        <div class="cart-item">
                            <div class="item-info">
                                <span class="font-medium">${item.name}</span>
                                <span class="text-xs text-muted">${formatCurrency(item.price)}</span>
                            </div>
                            <div class="item-qty">
                                <button onclick="window.updateCartQty(${item.id}, -1)">-</button>
                                <span>${item.quantity}</span>
                                <button onclick="window.updateCartQty(${item.id}, 1)">+</button>
                            </div>
                            <div class="item-total">
                                ${formatCurrency(item.price * item.quantity)}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="cart-summary">
                    <div class="summary-row"><span>${t('subtotal')}</span><span>${formatCurrency(subtotal)}</span></div>
                    <div class="summary-row"><span>${t('tax')} (${state.settings.tax_rate}%)</span><span>${formatCurrency(tax)}</span></div>
                    <div class="summary-row total-row"><span>${t('total')}</span><span>${formatCurrency(total)}</span></div>
                </div>
                <div class="payment-section">
                    <input type="number" id="cash-received" placeholder="${t('cash_received')}" class="mb-2">
                    <button class="btn btn-primary w-full" onclick="window.processSale(${total})">${t('pay')}</button>
                </div>
            </div>
        </div>
    `;
};

const SettingsView = async () => {
    const settings = state.settings;
    return `
        <div class="view-header">
            <h1>${t('settings')}</h1>
        </div>
        <div class="card">
            <h3>${t('store_settings')}</h3>
            <form id="settings-form" onsubmit="window.saveSettings(event)">
                <div class="grid grid-2 mt-4">
                    <div class="form-group">
                        <label>${t('store_name')}</label>
                        <input type="text" name="store_name" value="${settings.store_name || ''}">
                    </div>
                    <div class="form-group">
                        <label>${t('store_address')}</label>
                        <input type="text" name="store_address" value="${settings.store_address || ''}">
                    </div>
                    <div class="form-group">
                        <label>${t('currency')}</label>
                        <select name="currency">
                            <option value="USD" ${settings.currency === 'USD' ? 'selected' : ''}>USD</option>
                            <option value="LBP" ${settings.currency === 'LBP' ? 'selected' : ''}>LBP</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>${t('exchange_rate')}</label>
                        <input type="number" name="exchange_rate" value="${settings.exchange_rate || 89500}">
                    </div>
                    <div class="form-group">
                        <label>${t('tax')} (%)</label>
                        <input type="number" name="tax_rate" value="${settings.tax_rate || 0}">
                    </div>
                    <div class="form-group">
                        <label>${t('language')}</label>
                        <select name="language" onchange="window.setLang(this.value)">
                            <option value="en" ${state.lang === 'en' ? 'selected' : ''}>${t('english')}</option>
                            <option value="ar" ${state.lang === 'ar' ? 'selected' : ''}>${t('arabic')}</option>
                        </select>
                    </div>
                </div>
                <div class="mt-4">
                    <label class="flex items-center gap-2">
                        <input type="checkbox" onchange="window.toggleDarkMode()" ${state.darkMode ? 'checked' : ''}>
                        ${t('dark_mode')}
                    </label>
                </div>
                <button type="submit" class="btn btn-primary mt-4">${t('save')}</button>
            </form>
        </div>
    `;
};

const SalesView = async () => {
    const sales = await api.sales.list();
    return `
        <div class="view-header">
            <h1>${t('sales')}</h1>
        </div>
        <div class="card overflow-x-auto">
            <table class="w-full text-left">
                <thead>
                    <tr class="border-b">
                        <th class="p-2">ID</th>
                        <th class="p-2">Date</th>
                        <th class="p-2">Cashier</th>
                        <th class="p-2">Total</th>
                        <th class="p-2">Paid</th>
                        <th class="p-2">Change</th>
                    </tr>
                </thead>
                <tbody>
                    ${sales.map(s => `
                        <tr class="border-b hover:bg-light">
                            <td class="p-2">#${s.id}</td>
                            <td class="p-2">${new Date(s.created_at).toLocaleString()}</td>
                            <td class="p-2">${s.user_name}</td>
                            <td class="p-2">${formatCurrency(s.total, s.currency)}</td>
                            <td class="p-2">${formatCurrency(s.amount_paid, s.currency)}</td>
                            <td class="p-2">${formatCurrency(s.change_amount, s.currency)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
};

const ProductsView = async () => {
    const products = await api.products.list();
    const categories = await api.categories.list();
    return `
        <div class="view-header flex justify-between">
            <h1>${t('products')}</h1>
            <button class="btn btn-primary" onclick="window.showProductModal()">${t('add_product')}</button>
        </div>
        <div class="card overflow-x-auto">
            <table class="w-full text-left">
                <thead>
                    <tr class="border-b">
                        <th class="p-2">Image</th>
                        <th class="p-2">${t('name')}</th>
                        <th class="p-2">${t('barcode')}</th>
                        <th class="p-2">${t('category')}</th>
                        <th class="p-2">${t('price')}</th>
                        <th class="p-2">${t('quantity')}</th>
                        <th class="p-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(p => `
                        <tr class="border-b hover:bg-light">
                            <td class="p-2">
                                <div class="w-10 h-10 rounded bg-light flex items-center justify-center overflow-hidden">
                                    ${p.image ? `<img src="${p.image}" class="w-full h-full object-cover">` : '📦'}
                                </div>
                            </td>
                            <td class="p-2">${p.name}</td>
                            <td class="p-2">${p.barcode}</td>
                            <td class="p-2">${p.category_name}</td>
                            <td class="p-2">${formatCurrency(p.price)}</td>
                            <td class="p-2 ${p.quantity < 10 ? 'text-danger font-bold' : ''}">${p.quantity}</td>
                            <td class="p-2">
                                <button class="text-accent mr-2" onclick="window.editProduct(${JSON.stringify(p).replace(/"/g, '&quot;')})">Edit</button>
                                <button class="text-danger" onclick="window.deleteProduct(${p.id})">${t('delete')}</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
};

const CategoriesView = async () => {
    const categories = await api.categories.list();
    return `
        <div class="view-header flex justify-between">
            <h1>${t('categories')}</h1>
            <button class="btn btn-primary" onclick="window.showCategoryModal()">${t('categories')}</button>
        </div>
        <div class="grid grid-3">
            ${categories.map(c => `
                <div class="card flex justify-between items-center">
                    <span class="font-medium">${c.name}</span>
                    <div>
                        <button class="text-danger" onclick="window.deleteCategory(${c.id})">${t('delete')}</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
};

// --- MODAL HELPERS ---
const showModal = (title, content) => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal card">
            <div class="modal-header">
                <h2>${title}</h2>
                <button onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body">${content}</div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.showProductModal = (product = null) => {
    const categories = state.categories;
    const content = `
        <form onsubmit="window.handleProductSubmit(event, ${product?.id || 'null'})">
            <div class="grid grid-2">
                <div class="form-group"><label>${t('name')}</label><input type="text" name="name" value="${product?.name || ''}" required></div>
                <div class="form-group"><label>${t('barcode')}</label><input type="text" name="barcode" value="${product?.barcode || ''}" required></div>
                <div class="form-group"><label>${t('category')}</label>
                    <select name="category_id">
                        ${categories.map(c => `<option value="${c.id}" ${product?.category_id == c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>${t('price')} (USD)</label><input type="number" step="0.01" name="price" value="${product?.price || ''}" required></div>
                <div class="form-group"><label>${t('cost')} (USD)</label><input type="number" step="0.01" name="cost" value="${product?.cost || ''}" required></div>
                <div class="form-group"><label>${t('quantity')}</label><input type="number" name="quantity" value="${product?.quantity || 0}" required></div>
                <div class="form-group col-span-2"><label>Image URL</label><input type="text" name="image" value="${product?.image || ''}" placeholder="https://example.com/image.jpg"></div>
            </div>
            <button type="submit" class="btn btn-primary w-full mt-4">${t('save')}</button>
        </form>
    `;
    showModal(product ? t('edit_product') : t('add_product'), content);
};

window.handleProductSubmit = async (e, id) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
        if (id) await api.products.update(id, data);
        else await api.products.create(data);
        document.querySelector('.modal-overlay').remove();
        notify('Product saved');
        render();
    } catch (err) { alert(err.message); }
};

window.deleteProduct = async (id) => {
    if (confirm('Delete this product?')) {
        await api.products.delete(id);
        render();
    }
};

window.showCategoryModal = () => {
    showModal(t('categories'), `
        <form onsubmit="window.handleCategorySubmit(event)">
            <div class="form-group"><label>${t('name')}</label><input type="text" name="name" required></div>
            <button type="submit" class="btn btn-primary w-full">${t('save')}</button>
        </form>
    `);
};

window.handleCategorySubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    await api.categories.create(data);
    document.querySelector('.modal-overlay').remove();
    render();
};

window.deleteCategory = async (id) => {
    if (confirm('Delete this category?')) {
        try {
            await api.categories.delete(id);
            render();
        } catch (err) { alert(err.message); }
    }
};

window.editProduct = (p) => window.showProductModal(p);

// --- RENDER ENGINE ---
const render = async () => {
    try {
        const app = document.getElementById('app');
        if (state.loading) {
            app.innerHTML = '<div class="loading-overlay">Loading...</div>';
            return;
        }

        document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = state.lang;
        document.body.className = state.darkMode ? 'dark-mode' : '';
 
        if (!state.user) {
            app.innerHTML = LoginView();
            const form = document.getElementById('login-form');
            if (form) form.onsubmit = login;
            return;
        }

        let viewContent = '';
        try {
            switch (state.currentPage) {
                case 'dashboard': viewContent = await DashboardView(); break;
                case 'pos': viewContent = await POSView(); break;
                case 'products': viewContent = await ProductsView(); break;
                case 'categories': viewContent = await CategoriesView(); break;
                case 'sales': viewContent = await SalesView(); break;
                case 'settings': viewContent = await SettingsView(); break;
                default: 
                    state.currentPage = 'dashboard';
                    viewContent = await DashboardView();
            }
        } catch (err) {
            if (err.message === 'Unauthorized' || err.message === 'Not logged in') {
                state.user = null;
                state.currentPage = 'login';
                window.location.hash = 'login';
                render();
                return;
            }
            viewContent = `<div class="card text-danger">Error: ${err.message}</div>`;
        }

        app.innerHTML = `
            <div class="app-container">
                ${Sidebar()}
                <main class="main-content">
                    ${viewContent}
                </main>
            </div>
        `;

        if (state.currentPage === 'pos') {
            const searchInput = document.getElementById('pos-search');
            if (searchInput) searchInput.focus();
        }
    } catch (criticalErr) {
        console.error('Critical Render Error:', criticalErr);
        document.getElementById('app').innerHTML = `<div class="p-8 text-danger">Critical Error: ${criticalErr.message}</div>`;
    }
};

// --- INITIALIZATION ---
const init = async () => {
    state.loading = true;
    render();
    try {
        state.settings = await api.settings.get().catch(() => ({}));
        state.lang = state.settings.language || localStorage.getItem('lang') || 'en';
        state.currency = state.settings.currency || 'USD';
        state.exchangeRate = state.settings.exchange_rate || 89500;
        
        try {
            const authCheck = await api.auth.me();
            state.user = authCheck.user;
        } catch (e) {
            state.user = null;
        }

        // Global Keyboard Shortcuts
        window.addEventListener('keydown', (e) => {
            if (state.currentPage === 'pos') {
                if (e.key === 'F1') {
                    e.preventDefault();
                    document.getElementById('pos-search')?.focus();
                }
                if (e.key === 'F2') {
                    e.preventDefault();
                    const sub = state.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                    const total = sub * (1 + parseFloat(state.settings.tax_rate || 0)/100);
                    window.processSale(total);
                }
            }
        });

        const hashPage = window.location.hash.substring(1);
        state.currentPage = hashPage || (state.user ? 'dashboard' : 'login');
        
        state.loading = false;
        render();
        
        // Also fetch critical lookups in background
        api.categories.list().then(cats => state.categories = cats).catch(() => {});
    } catch (err) {
        console.error('Init Error:', err);
        state.loading = false;
        render();
    }
};

// --- GLOBAL ATTACHMENTS (for onclick handlers) ---
window.logout = logout;
window.addToCart = addToCart;
window.updateCartQty = updateCartQty;
window.setLang = (lang) => {
    state.lang = lang;
    localStorage.setItem('lang', lang);
    render();
};
window.toggleDarkMode = () => {
    state.darkMode = !state.darkMode;
    localStorage.setItem('darkMode', state.darkMode);
    render();
};
window.saveSettings = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    await api.settings.save(data);
    state.settings = await api.settings.get();
    notify('Settings saved');
    render();
};
window.processSale = async (total) => {
    const cash = parseFloat(document.getElementById('cash-received').value);
    if (isNaN(cash) || cash < total) {
        alert('Insufficient cash provided');
        return;
    }
    const sale = {
        customer_id: null,
        subtotal: total / (1 + parseFloat(state.settings.tax_rate || 0)/100),
        discount: 0,
        tax: total - (total / (1 + parseFloat(state.settings.tax_rate || 0)/100)),
        total: total,
        amount_paid: cash,
        change_amount: cash - total,
        items: [...state.cart], // Copy cart
        currency: state.currency,
        exchange_rate: state.exchangeRate
    };
    try {
        const res = await api.sales.create(sale);
        notify('Sale completed successfully');
        
        // Print receipt
        window.printReceipt({ ...sale, id: res.saleId, date: new Date() });
        
        state.cart = [];
        render();
    } catch (err) {
        alert(err.message);
    }
};

window.printReceipt = (sale) => {
    const itemsHtml = sale.items.map(i => `
        <tr>
            <td>${i.name}</td>
            <td>${i.quantity}</td>
            <td>${formatCurrency(i.price, sale.currency)}</td>
            <td>${formatCurrency(i.price * i.quantity, sale.currency)}</td>
        </tr>
    `).join('');

    const originalContent = document.body.innerHTML;
    const content = `
        <html>
        <head>
            <style>
                body { font-family: sans-serif; padding: 20px; max-width: 300px; margin: 0 auto; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                th { text-align: left; border-bottom: 1px solid #000; }
                .text-right { text-align: right; }
                .center { text-align: center; }
                hr { border: 0; border-top: 1px dashed #000; }
            </style>
        </head>
        <body>
            <h2 class="center">${state.settings.store_name}</h2>
            <p class="center">${state.settings.store_address}</p>
            <p>Receipt #${sale.id}<br>${sale.date.toLocaleString()}</p>
            <hr>
            <table>
                <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Sum</th></tr></thead>
                <tbody>${itemsHtml}</tbody>
            </table>
            <hr>
            <p class="text-right">Subtotal: ${formatCurrency(sale.subtotal, sale.currency)}</p>
            <p class="text-right">Tax: ${formatCurrency(sale.tax, sale.currency)}</p>
            <h3 class="text-right">Total: ${formatCurrency(sale.total, sale.currency)}</h3>
            <p class="text-right">Paid: ${formatCurrency(sale.amount_paid, sale.currency)}</p>
            <p class="text-right">Change: ${formatCurrency(sale.change_amount, sale.currency)}</p>
            <hr>
            <p class="center">Thank you for shopping!</p>
            <br><br>
            <p class="center" style="font-size: 12px;">CUSTOMER COPY</p>
            <hr>
            <p class="center" style="font-size: 12px;">STORE COPY</p>
        </body>
        </html>
    `;
    
    document.body.innerHTML = content;
    window.print();
    
    // After printing, restore original content and reload
    setTimeout(() => {
        document.body.innerHTML = originalContent;
        window.location.reload();
    }, 1000);
};
window.filterPOS = (q) => {
    // Basic frontend filtering for speed
    const items = document.querySelectorAll('.product-item');
    items.forEach(item => {
        const text = item.innerText.toLowerCase();
        item.style.display = text.includes(q.toLowerCase()) ? 'block' : 'none';
    });
};

init();
