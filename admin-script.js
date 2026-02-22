// Admin Dashboard JavaScript
let currentCategory = null;
let currentProduct = null;
let selectedFiles = [];
let isAuthenticated = false;
let authCheckInterval = null;

// Authentication state management
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/admin/check-auth', {
            credentials: 'include' // Important for cookies
        });
        
        if (!response.ok) {
            throw new Error('Auth check failed');
        }
        
        const data = await response.json();
        return data.authenticated === true;
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}

// Global fetch wrapper to handle 401 errors
async function authenticatedFetch(url, options = {}) {
    if (!isAuthenticated) {
        throw new Error('Not authenticated');
    }
    
    const response = await fetch(url, {
        ...options,
        credentials: 'include' // Important for session cookies
    });
    
    // Handle 401 Unauthorized globally
    if (response.status === 401) {
        console.warn('Session expired, logging out...');
        isAuthenticated = false;
        showLogin();
        showNotification('Session expired. Please login again.', 'error');
        throw new Error('Unauthorized');
    }
    
    return response;
}

// Check authentication on page load
window.addEventListener('DOMContentLoaded', async () => {
    // Setup modal handlers first
    setupModalHandlers();
    
    // Check authentication status
    isAuthenticated = await checkAuthStatus();
    
    if (isAuthenticated) {
        showDashboard();
        loadCategories();
        // Start periodic auth checks (every 2 minutes)
        startAuthCheckInterval();
    } else {
        showLogin();
    }
});

// Periodic authentication check
function startAuthCheckInterval() {
    if (authCheckInterval) {
        clearInterval(authCheckInterval);
    }
    
    authCheckInterval = setInterval(async () => {
        const stillAuthenticated = await checkAuthStatus();
        if (!stillAuthenticated && isAuthenticated) {
            // Session expired
            isAuthenticated = false;
            showLogin();
            showNotification('Session expired. Please login again.', 'error');
        } else {
            isAuthenticated = stillAuthenticated;
        }
    }, 120000); // Check every 2 minutes
}

function stopAuthCheckInterval() {
    if (authCheckInterval) {
        clearInterval(authCheckInterval);
        authCheckInterval = null;
    }
}

// Show/Hide screens
function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'flex';
}

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Clear previous error
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            credentials: 'include' // Important for session cookies
        });
        
        if (response.ok) {
            errorDiv.style.display = 'none';
            
            // Verify session is actually set before proceeding
            // Small delay to ensure cookie is set
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Double-check authentication status
            const authCheck = await checkAuthStatus();
            if (authCheck) {
                isAuthenticated = true;
                showDashboard();
                loadCategories();
                startAuthCheckInterval();
            } else {
                // Session not set properly, show error
                errorDiv.style.display = 'block';
                errorDiv.textContent = '⚠️ Login successful but session not set. Please try again.';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Login';
            }
        } else {
            const data = await response.json();
            errorDiv.style.display = 'block';
            errorDiv.textContent = '❌ Invalid username or password. Please try again.';
            
            // Shake animation
            errorDiv.style.animation = 'shake 0.5s';
            setTimeout(() => {
                errorDiv.style.animation = '';
            }, 500);
        }
    } catch (error) {
        errorDiv.style.display = 'block';
        errorDiv.textContent = '❌ Connection failed. Please check your internet connection.';
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await fetch('/api/admin/logout', { 
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        isAuthenticated = false;
        stopAuthCheckInterval();
        showLogin();
    }
});

// Load Categories
async function loadCategories() {
    if (!isAuthenticated) {
        showLogin();
        return;
    }
    
    showLoading();
    try {
        const response = await authenticatedFetch('/api/admin/categories');
        const categories = await response.json();
        
        const grid = document.getElementById('categoriesGrid');
        grid.innerHTML = '';
        
        let totalProducts = 0;
        let totalImages = 0;
        
        // Get detailed product info for each category to count images
        for (const category of categories) {
            totalProducts += category.productCount;
            
            // Fetch products to count images
            try {
                const productsRes = await authenticatedFetch(`/api/admin/categories/${category.name}/products`);
                const products = await productsRes.json();
                products.forEach(product => {
                    totalImages += product.imageCount;
                });
            } catch (err) {
                console.error('Error counting images for', category.name);
            }
            
            const card = document.createElement('div');
            card.className = 'category-card';
            card.innerHTML = `
                <div class="category-header">
                    <div class="category-icon"></div>
                    <div class="category-actions">
                        <button class="icon-btn delete-btn" onclick="deleteCategory('${category.name}', '${category.displayName}', ${category.productCount})">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="category-name">${category.displayName}</div>
                <div class="category-meta">${category.productCount} products</div>
            `;
            
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.icon-btn')) {
                    loadProducts(category.name);
                }
            });
            
            grid.appendChild(card);
        }
        
        document.getElementById('totalCategories').textContent = categories.length;
        document.getElementById('totalProducts').textContent = totalProducts;
        document.getElementById('totalImages').textContent = totalImages;
        
    } catch (error) {
        showNotification('Error loading categories', 'error');
    } finally {
        hideLoading();
    }
}

// Load Products
async function loadProducts(categoryName) {
    if (!isAuthenticated) {
        showLogin();
        return;
    }
    
    currentCategory = categoryName;
    showLoading();
    
    try {
        const response = await authenticatedFetch(`/api/admin/categories/${categoryName}/products`);
        const products = await response.json();
        
        document.getElementById('categoriesView').style.display = 'none';
        document.getElementById('productsView').style.display = 'block';
        const displayName = categoryName.replace(/_/g, ' ').toUpperCase();
        document.getElementById('selectedCategoryName').textContent = displayName;
        document.getElementById('categoryBreadcrumb').textContent = displayName;
        
        const grid = document.getElementById('productsGrid');
        grid.innerHTML = '';
        
        let totalImages = 0;
        
        products.forEach(product => {
            totalImages += product.imageCount;
            
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-image-preview" onclick="loadImages('${categoryName}', '${product.name}')">
                    ${product.images.length > 0 ? 
                        `<img src="${product.images[0].path}" alt="${product.displayName}">` : 
                        '🖼️'}
                </div>
                <div class="product-body">
                    <div class="product-header">
                        <div class="product-name">${product.displayName}</div>
                        <button class="icon-btn" onclick="deleteProduct('${categoryName}', '${product.name}')">🗑️</button>
                    </div>
                    <div class="product-meta">${product.imageCount} images</div>
                </div>
            `;
            
            grid.appendChild(card);
        });
        
        document.getElementById('totalImages').textContent = totalImages;
        
    } catch (error) {
        showNotification('Error loading products', 'error');
    } finally {
        hideLoading();
    }
}

// Load Images
async function loadImages(categoryName, productName) {
    if (!isAuthenticated) {
        showLogin();
        return;
    }
    
    currentCategory = categoryName;
    currentProduct = productName;
    showLoading();
    
    try {
        const response = await authenticatedFetch(`/api/admin/categories/${categoryName}/products`);
        const products = await response.json();
        const product = products.find(p => p.name === productName);
        
        document.getElementById('productsView').style.display = 'none';
        document.getElementById('imagesView').style.display = 'block';
        document.getElementById('selectedProductName').textContent = product.displayName;
        document.getElementById('categoryBreadcrumb2').textContent = categoryName.replace(/_/g, ' ').toUpperCase();
        document.getElementById('productBreadcrumb').textContent = product.displayName;
        
        const grid = document.getElementById('imagesGrid');
        grid.innerHTML = '';
        
        product.images.forEach(image => {
            const card = document.createElement('div');
            card.className = 'image-card';
            card.innerHTML = `
                <img src="${image.path}" alt="${image.name}" class="image-preview">
                <div class="image-actions">
                    <button class="icon-btn btn-danger" onclick="deleteImage('${image.path}')">🗑️</button>
                </div>
                <div class="image-name">${image.name}</div>
            `;
            
            grid.appendChild(card);
        });
        
    } catch (error) {
        showNotification('Error loading images', 'error');
    } finally {
        hideLoading();
    }
}

// Back buttons
document.getElementById('backToCategoriesBtn').addEventListener('click', () => {
    document.getElementById('productsView').style.display = 'none';
    document.getElementById('categoriesView').style.display = 'block';
    currentCategory = null;
    loadCategories();
});

document.getElementById('backToProductsBtn').addEventListener('click', () => {
    document.getElementById('imagesView').style.display = 'none';
    document.getElementById('productsView').style.display = 'block';
    currentProduct = null;
    loadProducts(currentCategory);
});

// Add Category
document.getElementById('addCategoryBtn').addEventListener('click', () => {
    openModal('addCategoryModal');
});

document.getElementById('saveCategoryBtn').addEventListener('click', async () => {
    const categoryName = document.getElementById('newCategoryName').value.trim();
    
    if (!categoryName) {
        showNotification('Please enter a category name', 'error');
        return;
    }
    
    showLoading();
    try {
        const response = await authenticatedFetch('/api/admin/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categoryName })
        });
        
        if (response.ok) {
            closeModal('addCategoryModal');
            showNotification('Category created successfully', 'success');
            loadCategories();
        }
    } catch (error) {
        showNotification('Error creating category', 'error');
    } finally {
        hideLoading();
    }
});

// Add Product
document.getElementById('addProductBtn').addEventListener('click', () => {
    openModal('addProductModal');
});

document.getElementById('saveProductBtn').addEventListener('click', async () => {
    const productName = document.getElementById('newProductName').value.trim();
    
    if (!productName) {
        showNotification('Please enter a product name', 'error');
        return;
    }
    
    showLoading();
    try {
        const response = await authenticatedFetch('/api/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: currentCategory, productName })
        });
        
        if (response.ok) {
            closeModal('addProductModal');
            showNotification('Product created successfully', 'success');
            loadProducts(currentCategory);
        }
    } catch (error) {
        showNotification('Error creating product', 'error');
    } finally {
        hideLoading();
    }
});

// Upload Images
document.getElementById('uploadImagesBtn').addEventListener('click', () => {
    openModal('uploadImagesModal');
    selectedFiles = [];
    document.getElementById('uploadPreview').innerHTML = '';
    document.getElementById('uploadBtn').disabled = true;
});

document.getElementById('uploadArea').addEventListener('click', () => {
    document.getElementById('imageInput').click();
});

document.getElementById('imageInput').addEventListener('change', (e) => {
    selectedFiles = Array.from(e.target.files);
    displayPreview();
});

function displayPreview() {
    const preview = document.getElementById('uploadPreview');
    preview.innerHTML = '';
    
    selectedFiles.forEach(file => {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.className = 'preview-image';
        preview.appendChild(img);
    });
    
    document.getElementById('uploadBtn').disabled = selectedFiles.length === 0;
}

document.getElementById('uploadBtn').addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;
    
    const formData = new FormData();
    selectedFiles.forEach(file => {
        formData.append('images', file);
    });
    formData.append('category', currentCategory);
    formData.append('productName', currentProduct);
    
    showLoading();
    try {
        const response = await authenticatedFetch('/api/admin/upload', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            closeModal('uploadImagesModal');
            
            // Show optimization stats
            if (data.optimization && data.optimization.length > 0) {
                const totalSaved = data.optimization.reduce((sum, opt) => {
                    return sum + parseFloat(opt.saved);
                }, 0) / data.optimization.length;
                
                showNotification(
                    `✅ ${data.files.length} images uploaded & optimized! (Avg ${totalSaved.toFixed(0)}% size reduction)`,
                    'success'
                );
                
                // Log details to console
                console.log('📊 Optimization Stats:', data.optimization);
            } else {
                showNotification('Images uploaded successfully', 'success');
            }
            
            loadImages(currentCategory, currentProduct);
            selectedFiles = [];
            document.getElementById('uploadPreview').innerHTML = '';
        }
    } catch (error) {
        showNotification('Error uploading images', 'error');
    } finally {
        hideLoading();
    }
});

// Delete Category
let categoryToDelete = null;

function deleteCategory(categoryName, displayName, productCount) {
    categoryToDelete = categoryName;
    document.querySelector('.category-to-delete').textContent = displayName;
    document.getElementById('deleteConfirmInput').value = '';
    document.getElementById('confirmDeleteCategoryBtn').disabled = true;
    openModal('deleteCategoryModal');
}

// Enable delete button when "DELETE" is typed
document.getElementById('deleteConfirmInput').addEventListener('input', (e) => {
    const value = e.target.value;
    const btn = document.getElementById('confirmDeleteCategoryBtn');
    btn.disabled = value !== 'DELETE';
});

// Confirm delete category
document.getElementById('confirmDeleteCategoryBtn').addEventListener('click', async () => {
    if (!categoryToDelete) return;
    
    showLoading();
    try {
        const response = await authenticatedFetch('/api/admin/categories', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categoryName: categoryToDelete })
        });
        
        if (response.ok) {
            closeModal('deleteCategoryModal');
            showNotification('Category deleted successfully', 'success');
            loadCategories();
            categoryToDelete = null;
        } else {
            const error = await response.json();
            showNotification(error.error || 'Error deleting category', 'error');
        }
    } catch (error) {
        showNotification('Error deleting category', 'error');
    } finally {
        hideLoading();
    }
});

// Delete functions
async function deleteProduct(category, productName) {
    if (!confirm(`Delete product "${productName}"? This will delete all images.`)) return;
    
    showLoading();
    try {
        const response = await authenticatedFetch('/api/admin/products', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, productName })
        });
        
        if (response.ok) {
            showNotification('Product deleted', 'success');
            loadProducts(category);
        }
    } catch (error) {
        showNotification('Error deleting product', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteImage(imagePath) {
    if (!confirm('Delete this image?')) return;
    
    showLoading();
    try {
        const response = await authenticatedFetch('/api/admin/images', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imagePath })
        });
        
        if (response.ok) {
            showNotification('Image deleted', 'success');
            loadImages(currentCategory, currentProduct);
        }
    } catch (error) {
        showNotification('Error deleting image', 'error');
    } finally {
        hideLoading();
    }
}

// Regenerate website
document.getElementById('regenerateBtn').addEventListener('click', regenerateWebsite);
document.getElementById('settingsRegenerateBtn').addEventListener('click', regenerateWebsite);

async function regenerateWebsite() {
    if (!confirm('Regenerate website? This will update script.js with latest catalog data.')) return;
    
    showLoading();
    try {
        const response = await authenticatedFetch('/api/admin/regenerate', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification(`Website regenerated! ${data.productCount} products, ${data.imageCount} images`, 'success');
            loadCategories();
        }
    } catch (error) {
        showNotification('Error regenerating website', 'error');
    } finally {
        hideLoading();
    }
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.getElementById('modalOverlay').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.getElementById('modalOverlay').classList.remove('active');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('active'));
    document.getElementById('modalOverlay').classList.remove('active');
}

// Initialize modal close handlers
function setupModalHandlers() {
    console.log('Setting up modal handlers...');
    
    // Use event delegation on document for better reliability
    document.body.addEventListener('click', (e) => {
        // Check if clicked element is a close button
        if (e.target.closest('.modal-close')) {
            console.log('Close button clicked');
            e.preventDefault();
            e.stopPropagation();
            closeAllModals();
            return;
        }
        
        // Check if clicked element is a cancel button
        if (e.target.closest('.modal-cancel')) {
            console.log('Cancel button clicked');
            e.preventDefault();
            e.stopPropagation();
            closeAllModals();
            return;
        }
        
        // Check if clicked on overlay
        if (e.target.id === 'modalOverlay') {
            console.log('Overlay clicked');
            closeAllModals();
            return;
        }
    });
    
    console.log('Modal handlers set up complete');
}

// Setup function is called from the main DOMContentLoaded handler

// Loading
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

// Notifications
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        padding: 16px 24px;
        background: ${type === 'success' ? 'var(--success)' : 'var(--danger)'};
        color: white;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 3000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

console.log('🎨 Admin Dashboard Loaded');
