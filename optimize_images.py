#!/usr/bin/env python3
"""
Image Optimization Script for GES Website
Compresses all product images while maintaining quality
"""

import os
from pathlib import Path
from PIL import Image
import sys

# Configuration
MAX_WIDTH = 1200  # Max width in pixels
MAX_HEIGHT = 1200  # Max height in pixels
QUALITY = 85  # JPEG quality (1-100, 85 is good balance)
TARGET_SIZE_KB = 300  # Target max file size in KB

def get_image_size_kb(filepath):
    """Get file size in KB"""
    return os.path.getsize(filepath) / 1024

def optimize_image(image_path):
    """Optimize a single image"""
    try:
        # Open image
        img = Image.open(image_path)
        
        # Get original size
        original_size = get_image_size_kb(image_path)
        
        # Skip if already small enough
        if original_size < TARGET_SIZE_KB:
            return False, original_size, original_size
        
        # Convert RGBA to RGB if needed
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        
        # Resize if too large
        if img.width > MAX_WIDTH or img.height > MAX_HEIGHT:
            img.thumbnail((MAX_WIDTH, MAX_HEIGHT), Image.Resampling.LANCZOS)
        
        # Save with optimization
        if image_path.lower().endswith('.png'):
            # Convert PNG to JPG for better compression
            new_path = image_path.rsplit('.', 1)[0] + '.jpg'
            img.save(new_path, 'JPEG', quality=QUALITY, optimize=True)
            os.remove(image_path)
            image_path = new_path
        else:
            # Optimize existing JPG
            img.save(image_path, 'JPEG', quality=QUALITY, optimize=True)
        
        # Get new size
        new_size = get_image_size_kb(image_path)
        
        return True, original_size, new_size
        
    except Exception as e:
        print(f"❌ Error processing {image_path}: {e}")
        return False, 0, 0

def optimize_all_images():
    """Optimize all product images"""
    base_path = Path("catalouge/products")
    
    if not base_path.exists():
        print("❌ catalouge/products directory not found!")
        return
    
    print("🎨 GES Image Optimization Tool")
    print("=" * 60)
    print(f"Max dimensions: {MAX_WIDTH}x{MAX_HEIGHT}px")
    print(f"JPEG quality: {QUALITY}%")
    print(f"Target size: <{TARGET_SIZE_KB}KB")
    print("=" * 60)
    print()
    
    # Find all images
    image_files = []
    for ext in ['*.jpg', '*.jpeg', '*.JPG', '*.JPEG', '*.png', '*.PNG']:
        image_files.extend(base_path.glob(f'**/{ext}'))
    
    total_images = len(image_files)
    print(f"📸 Found {total_images} images to process")
    print()
    
    optimized_count = 0
    skipped_count = 0
    total_saved_mb = 0
    
    for idx, image_path in enumerate(image_files, 1):
        # Progress indicator
        progress = (idx / total_images) * 100
        print(f"[{progress:5.1f}%] Processing {idx}/{total_images}: {image_path.name[:40]:<40}", end='\r')
        
        was_optimized, original_size, new_size = optimize_image(str(image_path))
        
        if was_optimized:
            optimized_count += 1
            saved_kb = original_size - new_size
            total_saved_mb += saved_kb / 1024
            
            if saved_kb > 1000:  # Show only significant savings
                print(f"\n  ✅ {image_path.name}: {original_size:.0f}KB → {new_size:.0f}KB (saved {saved_kb:.0f}KB)")
        else:
            skipped_count += 1
    
    print("\n")
    print("=" * 60)
    print("✅ Optimization Complete!")
    print("=" * 60)
    print(f"Total images processed: {total_images}")
    print(f"Optimized: {optimized_count}")
    print(f"Skipped (already small): {skipped_count}")
    print(f"Total space saved: {total_saved_mb:.1f} MB")
    print()
    print("🎉 Your images are now optimized for web!")
    print("💡 Tip: Run 'python3 generate_products.py' to update the website")

if __name__ == "__main__":
    try:
        # Check if PIL is installed
        import PIL
        print("✅ PIL/Pillow is installed\n")
    except ImportError:
        print("❌ PIL/Pillow is not installed!")
        print("Install it with: pip3 install Pillow")
        print()
        sys.exit(1)
    
    # Confirm before proceeding
    print("⚠️  WARNING: This will modify your original images!")
    print("⚠️  Make sure you have a backup before proceeding.")
    print()
    response = input("Continue? (yes/no): ")
    
    if response.lower() in ['yes', 'y']:
        print("\n🚀 Starting optimization...\n")
        optimize_all_images()
    else:
        print("❌ Optimization cancelled")



