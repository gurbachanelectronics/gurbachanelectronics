const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const sharp = require('sharp');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (important for Render/Heroku behind load balancer)
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'ges-admin-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Auto-enable in production (HTTPS)
        httpOnly: true, // Prevent XSS attacks
        sameSite: 'lax', // CSRF protection, works with Render
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    name: 'ges-admin-session' // Custom session name
}));

// Admin credentials from environment variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);

// Multer configuration for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Use temp directory first
        const uploadPath = path.join(__dirname, 'temp_uploads');
        
        // Create directory if it doesn't exist
        if (!fsSync.existsSync(uploadPath)) {
            fsSync.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        const ext = path.extname(file.originalname);
        cb(null, `IMG-${timestamp}-${random}${ext}`);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Images only!');
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Authentication middleware
function isAuthenticated(req, res, next) {
    if (req.session.isAuthenticated) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
}

// ===== ROUTES =====

// Admin dashboard route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Root route - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ===== API ENDPOINTS =====

// Login endpoint
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
        req.session.isAuthenticated = true;
        req.session.username = username;
        
        // Save session explicitly to ensure cookie is set (important for Render)
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ error: 'Failed to create session' });
            }
            res.json({ 
                success: true, 
                message: 'Login successful',
                authenticated: true
            });
        });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Logout endpoint
app.post('/api/admin/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logged out' });
});

// Check auth status
app.get('/api/admin/check-auth', (req, res) => {
    res.json({ authenticated: !!req.session.isAuthenticated });
});

// Get all categories
app.get('/api/admin/categories', isAuthenticated, async (req, res) => {
    try {
        const productsPath = path.join(__dirname, 'catalouge', 'products');
        const categories = await fs.readdir(productsPath);
        
        const categoryData = await Promise.all(
            categories.filter(cat => !cat.startsWith('.')).map(async (category) => {
                const categoryPath = path.join(productsPath, category);
                const stats = await fs.stat(categoryPath);
                
                if (stats.isDirectory()) {
                    const products = await fs.readdir(categoryPath);
                    const productCount = products.filter(p => !p.startsWith('.')).length;
                    
                    return {
                        name: category,
                        displayName: category.replace(/_/g, ' ').toUpperCase(),
                        productCount,
                        visible: true // Can be stored in a config file
                    };
                }
            })
        );
        
        res.json(categoryData.filter(Boolean));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get products in a category
app.get('/api/admin/categories/:category/products', isAuthenticated, async (req, res) => {
    try {
        const { category } = req.params;
        const categoryPath = path.join(__dirname, 'catalouge', 'products', category);
        const products = await fs.readdir(categoryPath);
        
        const productData = await Promise.all(
            products.filter(p => !p.startsWith('.')).map(async (product) => {
                const productPath = path.join(categoryPath, product);
                const stats = await fs.stat(productPath);
                
                if (stats.isDirectory()) {
                    const images = await fs.readdir(productPath);
                    const imageFiles = images.filter(img => /\.(jpg|jpeg|png|gif)$/i.test(img));
                    
                    return {
                        name: product,
                        displayName: product.replace(/_/g, ' '),
                        imageCount: imageFiles.length,
                        images: imageFiles.map(img => ({
                            name: img,
                            path: `catalouge/products/${category}/${product}/${img}`
                        }))
                    };
                }
            })
        );
        
        res.json(productData.filter(Boolean));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload images with automatic optimization
app.post('/api/admin/upload', isAuthenticated, upload.array('images', 10), async (req, res) => {
    try {
        const { category, productName } = req.body;
        
        if (!category || !productName) {
            return res.status(400).json({ error: 'Category and product name required' });
        }
        
        // Destination directory
        const destPath = path.join(__dirname, 'catalouge', 'products', category, productName);
        
        // Create destination directory if it doesn't exist
        if (!fsSync.existsSync(destPath)) {
            fsSync.mkdirSync(destPath, { recursive: true });
        }
        
        // Process and optimize images
        const uploadedFiles = [];
        const optimizationStats = [];
        
        for (const file of req.files) {
            const destFile = path.join(destPath, file.filename);
            const originalSize = fsSync.statSync(file.path).size;
            
            try {
                // Optimize image with sharp
                await sharp(file.path)
                    .resize(1200, 1200, {
                        fit: 'inside',
                        withoutEnlargement: true // Don't enlarge small images
                    })
                    .jpeg({
                        quality: 85,
                        mozjpeg: true // Better compression
                    })
                    .toFile(destFile);
                
                // Delete temp file
                await fs.unlink(file.path);
                
                const optimizedSize = fsSync.statSync(destFile).size;
                const savedBytes = originalSize - optimizedSize;
                const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1);
                
                uploadedFiles.push({
                    filename: file.filename,
                    path: `catalouge/products/${category}/${productName}/${file.filename}`
                });
                
                optimizationStats.push({
                    filename: file.filename,
                    originalSize: (originalSize / 1024).toFixed(0) + ' KB',
                    optimizedSize: (optimizedSize / 1024).toFixed(0) + ' KB',
                    saved: savedPercent + '%'
                });
                
            } catch (error) {
                console.error(`Error optimizing ${file.filename}:`, error);
                // Fallback: just move the file without optimization
                await fs.rename(file.path, destFile);
                
                uploadedFiles.push({
                    filename: file.filename,
                    path: `catalouge/products/${category}/${productName}/${file.filename}`
                });
            }
        }
        
        res.json({ 
            success: true, 
            message: `${uploadedFiles.length} images uploaded and optimized successfully`,
            files: uploadedFiles,
            optimization: optimizationStats
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete image
app.delete('/api/admin/images', isAuthenticated, async (req, res) => {
    try {
        const { imagePath } = req.body;
        const fullPath = path.join(__dirname, imagePath);
        
        await fs.unlink(fullPath);
        res.json({ success: true, message: 'Image deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new category
app.post('/api/admin/categories', isAuthenticated, async (req, res) => {
    try {
        const { categoryName } = req.body;
        const categoryPath = path.join(__dirname, 'catalouge', 'products', categoryName);
        
        await fs.mkdir(categoryPath, { recursive: true });
        res.json({ success: true, message: 'Category created' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete category
app.delete('/api/admin/categories', isAuthenticated, async (req, res) => {
    try {
        const { categoryName } = req.body;
        const categoryPath = path.join(__dirname, 'catalouge', 'products', categoryName);
        
        if (!fsSync.existsSync(categoryPath)) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        // Recursively delete the entire category folder
        await fs.rm(categoryPath, { recursive: true, force: true });
        
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create new product
app.post('/api/admin/products', isAuthenticated, async (req, res) => {
    try {
        const { category, productName } = req.body;
        const productPath = path.join(__dirname, 'catalouge', 'products', category, productName);
        
        await fs.mkdir(productPath, { recursive: true });
        res.json({ success: true, message: 'Product created' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete product
app.delete('/api/admin/products', isAuthenticated, async (req, res) => {
    try {
        const { category, productName } = req.body;
        const productPath = path.join(__dirname, 'catalouge', 'products', category, productName);
        
        await fs.rm(productPath, { recursive: true, force: true });
        res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Regenerate website data
app.post('/api/admin/regenerate', isAuthenticated, async (req, res) => {
    try {
        const { exec } = require('child_process');
        const util = require('util');
        const execPromise = util.promisify(exec);
        
        // Try Python3 first, fallback to python
        let pythonCommand = 'python3';
        try {
            await execPromise('python3 --version', { cwd: __dirname });
        } catch (e) {
            try {
                await execPromise('python --version', { cwd: __dirname });
                pythonCommand = 'python';
            } catch (e2) {
                throw new Error('Python not found. Please ensure Python 3 is installed.');
            }
        }
        
        // Run the Python script to regenerate products
        console.log(`Running ${pythonCommand} generate_products.py...`);
        const { stdout, stderr } = await execPromise(`${pythonCommand} generate_products.py`, { 
            cwd: __dirname,
            maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large outputs
        });
        
        if (stderr && !stderr.includes('DeprecationWarning')) {
            console.warn('Python script warnings:', stderr);
        }
        
        // Read the generated products data
        const productsDataPath = path.join(__dirname, 'products_data.json');
        const productsData = await fs.readFile(productsDataPath, 'utf8');
        const products = JSON.parse(productsData);
        
        // Update script.js with new products
        const scriptTemplatePath = path.join(__dirname, 'script_template.js');
        const scriptTemplate = await fs.readFile(scriptTemplatePath, 'utf8');
        const newScript = `// ===== Complete Product Data - ${products.length} Products =====\nconst products = ${JSON.stringify(products, null, 4)};\n\n` + scriptTemplate;
        
        const scriptPath = path.join(__dirname, 'script.js');
        await fs.writeFile(scriptPath, newScript);
        
        // On Render, files are ephemeral - warn user if needed
        const isRender = process.env.RENDER || process.env.RENDER_SERVICE_ID;
        
        // Auto-commit and push to GitHub if enabled
        let gitPushed = false;
        let gitError = null;
        
        if (process.env.GIT_AUTO_PUSH === 'true') {
            try {
                // Configure Git if needed
                const gitUser = process.env.GIT_USER_NAME || 'GES Bot';
                const gitEmail = process.env.GIT_USER_EMAIL || 'ges-bot@noreply.com';
                
                // Set Git config (non-blocking if already set)
                try {
                    await execPromise(`git config user.name "${gitUser}"`, { cwd: __dirname });
                    await execPromise(`git config user.email "${gitEmail}"`, { cwd: __dirname });
                } catch (e) {
                    // Config might already be set, that's okay
                }
                
                // Check if there are changes
                const { stdout: gitStatus } = await execPromise('git status --porcelain', { cwd: __dirname });
                
                if (gitStatus.includes('script.js') || gitStatus.includes('products_data.json')) {
                    // Add only the specific files
                    await execPromise('git add script.js products_data.json', { cwd: __dirname });
                    
                    // Commit
                    const commitMessage = `Regenerated: ${products.length} products, ${products.reduce((sum, p) => sum + p.images.length, 0)} images`;
                    await execPromise(`git commit -m "${commitMessage}"`, { cwd: __dirname });
                    
                    // Push to GitHub
                    // Use HTTPS with token if GIT_TOKEN is set, otherwise use SSH
                    if (process.env.GIT_TOKEN) {
                        // Use token for authentication
                        const repoUrl = process.env.GIT_REPO_URL || 'https://github.com/gurbachanelectronics/gurbachanelectronics.git';
                        const repoUrlWithToken = repoUrl.replace('https://', `https://${process.env.GIT_TOKEN}@`);
                        await execPromise(`git push ${repoUrlWithToken} main`, { cwd: __dirname });
                    } else {
                        // Try SSH or default push
                        await execPromise('git push origin main', { cwd: __dirname });
                    }
                    
                    gitPushed = true;
                    console.log('✅ Changes committed and pushed to GitHub');
                } else {
                    console.log('ℹ️ No changes to commit');
                }
            } catch (gitError) {
                console.error('Git push error:', gitError.message);
                gitError = gitError.message;
                // Don't fail the request, just log the error
            }
        }
        
        const warning = isRender && !gitPushed
            ? ' ⚠️ On Render, file changes are temporary and will be lost on restart. Enable GIT_AUTO_PUSH to make permanent.' 
            : '';
        
        const successMessage = gitPushed 
            ? 'Website regenerated and pushed to GitHub!'
            : `Website regenerated successfully!${warning}`;
        
        res.json({ 
            success: true, 
            message: successMessage,
            productCount: products.length,
            imageCount: products.reduce((sum, p) => sum + p.images.length, 0),
            isEphemeral: !!isRender && !gitPushed,
            gitPushed: gitPushed,
            gitError: gitError || null,
            note: gitPushed 
                ? 'Changes have been committed and pushed to GitHub. Render will auto-deploy.'
                : (isRender 
                    ? 'To enable auto-push, set GIT_AUTO_PUSH=true and GIT_TOKEN in Render environment variables.'
                    : 'To enable auto-push, set GIT_AUTO_PUSH=true in environment variables.')
        });
    } catch (error) {
        console.error('Regenerate error:', error);
        res.status(500).json({ 
            error: error.message,
            details: 'Make sure Python 3 is installed and generate_products.py exists'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 GES Admin Server running on http://localhost:${PORT}`);
    console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin`);
    console.log(`🌐 Website: http://localhost:${PORT}/index.html`);
});

