# 🔐 Admin Dashboard Guide

## ✅ What's Included

Your website now has a **complete admin dashboard** for managing your entire catalog!

## 🚀 Quick Start

### 1. Start the Server
```bash
cd /Users/satnams/Desktop/satnam/GES
npm start
```

The server will start on **http://localhost:3000**

### 2. Access Admin Dashboard
Open your browser and go to:
```
http://localhost:3000/admin.html
```

### 3. Login Credentials
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change these in `server.js` before going to production!

## 📊 Dashboard Features

### 🏠 Main Dashboard
- **Real-time Statistics**
  - Total categories
  - Total products
  - Total images
  - System status

### 📁 Categories Management
- **View** all categories
- **Click** on any category to see products
- **Add** new categories
- **Edit** category settings
- See product count for each category

### 📦 Products Management
- **View** all products in a category
- **Add** new products
- **Delete** products
- **Click** on product to manage images
- See image count for each product

### 🖼️ Images Management
- **View** all images in a product
- **Upload** multiple images at once
- **Delete** individual images
- Drag & drop image upload
- Image preview before upload

### 🔄 Auto-Regeneration
- **One-click regeneration** of website
- Automatically updates `script.js`
- Scans all folders for changes
- Updates product data in real-time

## 🎯 How to Use

### Adding a New Product

1. **Go to Categories** view
2. **Click** on a category (e.g., "12_stage_monitor")
3. **Click** "+ Add Product" button
4. **Enter** product name (e.g., "srx_712")
5. **Click** "Create Product"
6. **Click** on the new product to add images

### Uploading Images

1. **Navigate** to the product
2. **Click** "+ Upload Images"
3. **Drag & drop** images or click to browse
4. **Select** multiple images (up to 10 at once)
5. **Click** "Upload Images"
6. Images are automatically added to the catalog

### Deleting Content

**Delete an Image**:
- Click the 🗑️ icon on the image
- Confirm deletion

**Delete a Product**:
- Click the 🗑️ icon on the product card
- Confirm deletion (⚠️ This deletes all images!)

### Regenerating the Website

After making changes:
1. **Click** "🔄 Regenerate Website" button (top right)
2. **Confirm** regeneration
3. **Wait** for processing (usually 5-10 seconds)
4. **Done!** Your website is updated

The regeneration process:
- Scans all product folders
- Generates new product data
- Updates `script.js` automatically
- Counts all products and images
- Updates the live website

## 🔒 API Endpoints

All endpoints require authentication (session-based).

### Authentication
- `POST /api/admin/login` - Login with credentials
- `POST /api/admin/logout` - Logout
- `GET /api/admin/check-auth` - Check if authenticated

### Categories
- `GET /api/admin/categories` - Get all categories
- `POST /api/admin/categories` - Create new category
  ```json
  { "categoryName": "new_category" }
  ```

### Products
- `GET /api/admin/categories/:category/products` - Get products in category
- `POST /api/admin/products` - Create new product
  ```json
  { "category": "12_stage_monitor", "productName": "new_product" }
  ```
- `DELETE /api/admin/products` - Delete product
  ```json
  { "category": "12_stage_monitor", "productName": "product_name" }
  ```

### Images
- `POST /api/admin/upload` - Upload images (multipart/form-data)
- `DELETE /api/admin/images` - Delete image
  ```json
  { "imagePath": "catalouge/products/..." }
  ```

### System
- `POST /api/admin/regenerate` - Regenerate website data

## 📝 File Structure

```
GES/
├── server.js              # Admin server
├── admin.html             # Admin dashboard UI
├── admin-styles.css       # Admin dashboard styles
├── admin-script.js        # Admin dashboard functionality
├── generate_products.py   # Product data generator
├── script_template.js     # Website JS template
├── package.json           # Node.js dependencies
└── catalouge/
    └── products/
        ├── 12_stage_monitor/
        │   ├── martin_12/
        │   │   └── [images]
        │   └── nexo_12/
        │       └── [images]
        └── [other categories...]
```

## 🔧 Configuration

### Change Admin Password

Edit `server.js` line 23:
```javascript
const ADMIN_PASSWORD_HASH = bcrypt.hashSync('YOUR_NEW_PASSWORD', 10);
```

### Change Port

Edit `server.js` line 10:
```javascript
const PORT = 3000; // Change to your preferred port
```

### Session Secret

Edit `server.js` line 18:
```javascript
secret: 'your-secret-key-here'
```

## 🌐 URLs

When server is running:
- **Main Website**: http://localhost:3000/index.html
- **Admin Dashboard**: http://localhost:3000/admin.html
- **API Base**: http://localhost:3000/api/admin/

## 💡 Tips

1. **Regular Backups**: Always backup your `catalouge` folder
2. **Test First**: Test changes in a development environment
3. **Regenerate After Changes**: Always regenerate after adding/removing products
4. **Image Naming**: Use descriptive filenames for images
5. **Folder Naming**: Use lowercase with underscores (no spaces)

## 🚨 Important Notes

### Security
- ⚠️ Change default password before production
- ⚠️ Use HTTPS in production
- ⚠️ Don't expose admin dashboard publicly without proper authentication
- ⚠️ Consider using environment variables for secrets

### File Management
- Images are stored in `catalouge/products/[category]/[product]/`
- Deleting a product deletes all its images
- Maximum upload size: 10MB per image
- Supported formats: JPG, PNG, GIF

### Performance
- Regeneration takes 5-10 seconds depending on catalog size
- Large image uploads may take time
- Server uses 24-hour session timeout

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port is already in use
lsof -i :3000

# Try a different port in server.js
```

### Can't login
- Check credentials in `server.js`
- Clear browser cookies
- Restart the server

### Images not uploading
- Check file size (<10MB)
- Check file format (JPG, PNG, GIF only)
- Check folder permissions

### Regeneration fails
- Make sure Python 3 is installed
- Check `generate_products.py` exists
- Check folder permissions

## 🎓 Advanced Usage

### Using with Production

1. **Set Environment Variables**
```bash
export NODE_ENV=production
export SESSION_SECRET=your-secret-key
export ADMIN_PASSWORD=your-password
```

2. **Use PM2 for Process Management**
```bash
npm install -g pm2
pm2 start server.js --name ges-admin
pm2 save
```

3. **Setup NGINX Reverse Proxy**
```nginx
location /admin {
    proxy_pass http://localhost:3000;
}
```

## 📞 Support

For issues or questions:
- Check server logs in terminal
- Review `server.js` comments
- Check browser console for errors

---

**🎉 Your admin dashboard is ready to use!**

Start the server with `npm start` and visit:
**http://localhost:3000/admin.html**


## 🗑️ Deleting Categories (NEW!)

### How to Delete a Category

1. **Go to Categories** view
2. **Click the 🗑️ button** on the category card
3. **Read the warning** carefully
4. **Type "DELETE"** (all caps) in the confirmation box
5. **Click "Delete Category"** button

### ⚠️ Important Warnings

**Deleting a category will:**
- ❌ Delete ALL products in that category
- ❌ Delete ALL images in all products
- ❌ Remove the entire category folder
- ❌ **THIS ACTION CANNOT BE UNDONE!**

### Safety Features

✅ **Confirmation Modal** - Shows exactly what will be deleted
✅ **Type to Confirm** - Must type "DELETE" to enable the button
✅ **Visual Warnings** - Red colors and warning icons
✅ **Product Count** - Shows how many products will be deleted

### Best Practices

1. **Backup First** - Always backup your catalog before deleting
2. **Double Check** - Make sure you're deleting the right category
3. **Regenerate After** - Click "Regenerate Website" after deletion
4. **Test Category** - Use a test category to try the feature first

---

**Updated**: December 12, 2025


