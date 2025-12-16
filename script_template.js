// ===== Product Rendering =====
function renderProducts(productsToRender = products) {
    const productGrid = document.getElementById('productGrid');
    productGrid.innerHTML = '';

    productsToRender.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.setAttribute('data-category', product.category);
        card.style.animation = 'fadeInUp 0.5s ease-out backwards';

        const specsHTML = product.specs.map(spec => 
            `<span class="spec-badge">${spec}</span>`
        ).join('');

        card.innerHTML = `
            <div class="product-image" data-product-id="${product.id}">
                <img src="${product.images[0]}" alt="${product.name}" loading="lazy">
                ${product.images.length > 1 ? `<div class="product-badge">${product.images.length} Images</div>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-desc">${product.description}</p>
                <div class="product-specs">${specsHTML}</div>
                <div class="product-actions">
                    <button class="btn btn-small btn-primary view-gallery-btn" data-product-id="${product.id}">
                        <span>View Gallery</span>
                    </button>
                    <button class="btn btn-small btn-outline contact-btn">
                        <span>Contact Now</span>
                    </button>
                </div>
            </div>
        `;

        productGrid.appendChild(card);
    });

    // Add event listeners
    document.querySelectorAll('.view-gallery-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = parseInt(btn.getAttribute('data-product-id'));
            openCarousel(productId);
        });
    });

    document.querySelectorAll('.product-image').forEach(img => {
        img.addEventListener('click', (e) => {
            if (!e.target.classList.contains('product-badge')) {
                const productId = parseInt(img.getAttribute('data-product-id'));
                openCarousel(productId);
            }
        });
    });

    document.querySelectorAll('.contact-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const productName = btn.closest('.product-card').querySelector('.product-name').textContent;
            openContactForm(productName);
        });
    });
}

// ===== Carousel Modal =====
let currentProductId = null;
let currentImageIndex = 0;

function openCarousel(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    currentProductId = productId;
    currentImageIndex = 0;

    const modal = document.getElementById('imageModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    updateCarousel();
}

function updateCarousel() {
    const product = products.find(p => p.id === currentProductId);
    if (!product) return;

    const carouselImage = document.getElementById('carouselImage');
    const carouselTitle = document.getElementById('carouselTitle');
    const currentImage = document.getElementById('currentImage');
    const totalImages = document.getElementById('totalImages');
    const thumbnailsContainer = document.getElementById('carouselThumbnails');

    carouselImage.src = product.images[currentImageIndex];
    carouselTitle.textContent = product.name;
    currentImage.textContent = currentImageIndex + 1;
    totalImages.textContent = product.images.length;

    // Render thumbnails
    thumbnailsContainer.innerHTML = '';
    product.images.forEach((img, index) => {
        const thumb = document.createElement('div');
        thumb.className = `thumbnail ${index === currentImageIndex ? 'active' : ''}`;
        thumb.innerHTML = `<img src="${img}" alt="Thumbnail ${index + 1}">`;
        thumb.addEventListener('click', () => {
            currentImageIndex = index;
            updateCarousel();
        });
        thumbnailsContainer.appendChild(thumb);
    });
}

function closeCarousel() {
    const modal = document.getElementById('imageModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    currentProductId = null;
    currentImageIndex = 0;
}

function nextImage() {
    const product = products.find(p => p.id === currentProductId);
    if (!product) return;
    currentImageIndex = (currentImageIndex + 1) % product.images.length;
    updateCarousel();
}

function prevImage() {
    const product = products.find(p => p.id === currentProductId);
    if (!product) return;
    currentImageIndex = currentImageIndex === 0 ? product.images.length - 1 : currentImageIndex - 1;
    updateCarousel();
}

// Modal event listeners
document.getElementById('modalClose').addEventListener('click', closeCarousel);
document.getElementById('modalOverlay').addEventListener('click', closeCarousel);
document.getElementById('nextBtn').addEventListener('click', nextImage);
document.getElementById('prevBtn').addEventListener('click', prevImage);

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (!document.getElementById('imageModal').classList.contains('active')) return;
    
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'Escape') closeCarousel();
});

// ===== Contact Form Helper =====
function openContactForm(productName) {
    const contactSection = document.getElementById('contact');
    const messageBox = contactSection.querySelector('textarea');
    
    // Scroll to contact section
    contactSection.scrollIntoView({ behavior: 'smooth' });
    
    // Pre-fill message
    setTimeout(() => {
        messageBox.value = `Hi, I'm interested in getting a quote for ${productName}. Please contact me with pricing and availability details.\n\nThank you!`;
        messageBox.focus();
    }, 500);
}

// ===== Navigation =====
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

// ===== Product Filter =====
const categoryButtons = document.querySelectorAll('.category-btn');

categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const category = button.getAttribute('data-category');
        
        if (category === 'all') {
            renderProducts(products);
        } else {
            const filtered = products.filter(p => p.category === category);
            renderProducts(filtered);
        }
    });
});

// ===== Search Functionality =====
const searchInput = document.getElementById('searchInput');

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    if (searchTerm === '') {
        renderProducts(products);
    } else {
        const filtered = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.specs.some(spec => spec.toLowerCase().includes(searchTerm))
        );
        renderProducts(filtered);
    }
});

// ===== Gallery Population =====
const galleryGrid = document.getElementById('galleryGrid');

function populateGallery() {
    const galleryImages = [];
    products.forEach(product => {
        if (product.images.length > 0) {
            galleryImages.push({
                src: product.images[0],
                name: product.name
            });
        }
    });

    galleryImages.slice(0, 12).forEach((img, index) => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.innerHTML = `<img src="${img.src}" alt="${img.name}" loading="lazy">`;
        galleryItem.style.animation = `fadeInUp 0.5s ease-out ${index * 0.05}s backwards`;
        galleryGrid.appendChild(galleryItem);
    });
}

// ===== Contact Form =====
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Show success message
    alert('Thank you for your inquiry! We will get back to you soon.\n\nFor immediate assistance, please call:\n+91-9891039802 or +91 97163 39533');
    contactForm.reset();
});

// ===== Navigation Modal =====
const navigationModal = document.getElementById('navigationModal');
const navModalOverlay = document.getElementById('navModalOverlay');
const navModalClose = document.getElementById('navModalClose');
const locationCard = document.getElementById('locationCard');
const travelButtons = document.querySelectorAll('.travel-btn');
const justOpenMapsBtn = document.getElementById('justOpenMaps');

// Use place_id for accurate location
const mapsUrl = 'https://www.google.com/maps/place/Gurbachan+Electronics+%26+Sons+AMPLIFIER+SUPPLIERS+,+DJ+SYSTEM+SUPPLIERS,DJ+LIGHT+CASE+MANUFACTURERS/@28.6717406,77.0843854,17z/data=!3m1!4b1!4m6!3m5!1s0x390d04fbc8bbb08b:0x26e3e796d30c91ea!8m2!3d28.6717406!4d77.0869603!16s%2Fg%2F11cn0gm66g';

// Using place name for more accurate navigation
const destinationQuery = 'Gurbachan+Electronics+Sons+G+52+Uday+Vihar+Phase+2+Nangloi+Delhi';

function openNavigationModal() {
    navigationModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeNavigationModal() {
    navigationModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Open modal when clicking location card or button
locationCard.addEventListener('click', openNavigationModal);
document.querySelector('.navigate-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    openNavigationModal();
});

// Close modal
navModalClose.addEventListener('click', closeNavigationModal);
navModalOverlay.addEventListener('click', closeNavigationModal);

// Handle travel mode selection
travelButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        let travelMode = 'driving'; // default
        
        if (mode === 'car') {
            travelMode = 'driving';
        } else if (mode === 'bike') {
            travelMode = 'two-wheeler'; // Use two-wheeler for bikes
        } else if (mode === 'walk') {
            travelMode = 'walking';
        }
        
        // Use destination query for better accuracy
        const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${destinationQuery}&travelmode=${travelMode}`;
        window.open(navUrl, '_blank');
        closeNavigationModal();
    });
});

// Just open maps without navigation
justOpenMapsBtn.addEventListener('click', () => {
    window.open(mapsUrl, '_blank');
    closeNavigationModal();
});

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    populateGallery();
    console.log(`🎵 GES Professional Audio - ${products.length} Products, ${products.reduce((sum, p) => sum + p.images.length, 0)} Images Loaded!`);
});
