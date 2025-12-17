#!/usr/bin/env python3
"""
SAFE Image Optimization Script for GES Website
Compresses large images while maintaining quality
"""

import os
from pathlib import Path
from PIL import Image
import sys
import shutil
from datetime import datetime

# Configuration
MAX_WIDTH = 1200  # Max width in pixels
MAX_HEIGHT = 1200  # Max height in pixels
QUALITY = 85  # JPEG quality (1-100, 85 is good balance)
TARGET_SIZE_KB = 300  # Target max file size in KB
MIN_SIZE_KB = 200  # Only optimize if larger than this

def get_image_size_kb(filepath):
    """Get file size in KB"""
    return os.path.getsize(filepath) / 1024

def get_image_size_mb(filepath):
    """Get file size in MB"""
    return os.path.getsize(filepath) / (1024 * 1024)

def create_backup():
    """Create backup of catalogue"""
    print("🔒 Creating backup...")
    backup_name = f"catalouge_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    backup_path = Path(backup_name)
    
    try:
        if Path("catalouge").exists():
            shutil.copytree("catalouge", backup_path)
            print(f"✅ Backup created: {backup_name}/")
            return True
    except Exception as e:
        print(f"❌ Backup failed: {e}")
        return False
    
    return True

def optimize_image(image_path):
    """Optimize a single image"""
    try:
        # Get original size
        original_size_kb = get_image_size_kb(image_path)
        original_size_mb = get_image_size_mb(image_path)
        
        # Skip if already small enough
        if original_size_kb < MIN_SIZE_KB:
            return False, original_size_kb, original_size_kb, "Already optimized"
        
        # Open image
        img = Image.open(image_path)
        original_dimensions = f"{img.width}x{img.height}"
        
        # Convert RGBA to RGB if needed
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        
        # Resize if too large
        was_resized = False
        if img.width > MAX_WIDTH or img.height > MAX_HEIGHT:
            img.thumbnail((MAX_WIDTH, MAX_HEIGHT), Image.Resampling.LANCZOS)
            was_resized = True
        
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
        new_size_kb = get_image_size_kb(image_path)
        new_dimensions = f"{img.width}x{img.height}"
        
        info = f"Resized {original_dimensions}→{new_dimensions}" if was_resized else "Compressed"
        
        return True, original_size_kb, new_size_kb, info
        
    except Exception as e:
        return False, 0, 0, f"Error: {e}"

def find_large_images(base_path):
    """Find all images larger than MIN_SIZE_KB"""
    large_images = []
    
    for ext in ['*.jpg', '*.jpeg', '*.JPG', '*.JPEG', '*.png', '*.PNG']:
        for image_path in base_path.glob(f'**/{ext}'):
            size_kb = get_image_size_kb(str(image_path))
            size_mb = get_image_size_mb(str(image_path))
            if size_kb > MIN_SIZE_KB:
                large_images.append((image_path, size_kb, size_mb))
    
    # Sort by size (largest first)
    large_images.sort(key=lambda x: x[1], reverse=True)
    return large_images

def optimize_all_images():
    """Optimize all product images"""
    base_path = Path("catalouge/products")
    
    if not base_path.exists():
        print("❌ catalouge/products directory not found!")
        return
    
    print("\n" + "="*80)
    print("🎨 GES SAFE IMAGE OPTIMIZATION TOOL")
    print("="*80)
    print(f"📐 Max dimensions: {MAX_WIDTH}x{MAX_HEIGHT}px")
    print(f"🎯 JPEG quality: {QUALITY}%")
    print(f"📦 Target size: <{TARGET_SIZE_KB}KB")
    print(f"🔍 Only optimizing images >{MIN_SIZE_KB}KB")
    print("="*80)
    print()
    
    # Find large images
    print("🔍 Scanning for large images...")
    large_images = find_large_images(base_path)
    
    if not large_images:
        print("✅ No images need optimization!")
        return
    
    total_size_mb = sum(img[2] for img in large_images)
    
    print(f"\n📊 Found {len(large_images)} images that need optimization")
    print(f"💾 Total size: {total_size_mb:.1f} MB")
    print()
    
    # Show top 10 largest
    print("🔝 Top 10 largest images:")
    for i, (path, size_kb, size_mb) in enumerate(large_images[:10], 1):
        print(f"   {i:2d}. {size_mb:5.1f} MB - {path.name}")
    
    if len(large_images) > 10:
        print(f"   ... and {len(large_images) - 10} more")
    
    print("\n" + "="*80)
    print("⚠️  This will optimize the images in place")
    print("✅ A backup will be created first")
    print("="*80)
    print()
    
    response = input("Continue with optimization? (yes/no): ")
    
    if response.lower() not in ['yes', 'y']:
        print("❌ Optimization cancelled")
        return
    
    # Create backup
    if not create_backup():
        print("❌ Cannot proceed without backup")
        return
    
    print("\n🚀 Starting optimization...\n")
    
    optimized_count = 0
    skipped_count = 0
    total_saved_mb = 0
    
    for idx, (image_path, _, _) in enumerate(large_images, 1):
        # Progress indicator
        progress = (idx / len(large_images)) * 100
        
        was_optimized, original_size, new_size, info = optimize_image(str(image_path))
        
        if was_optimized:
            optimized_count += 1
            saved_kb = original_size - new_size
            saved_mb = saved_kb / 1024
            total_saved_mb += saved_mb
            
            # Show progress
            reduction = ((original_size - new_size) / original_size * 100) if original_size > 0 else 0
            
            print(f"[{progress:5.1f}%] ✅ {image_path.name[:50]:<50}")
            print(f"         {original_size:6.0f}KB → {new_size:5.0f}KB ({reduction:4.1f}% smaller) - {info}")
        else:
            skipped_count += 1
            print(f"[{progress:5.1f}%] ⏭️  {image_path.name[:50]:<50} - {info}")
    
    print("\n" + "="*80)
    print("✅ OPTIMIZATION COMPLETE!")
    print("="*80)
    print(f"📊 Total images processed: {len(large_images)}")
    print(f"✅ Optimized: {optimized_count}")
    print(f"⏭️  Skipped: {skipped_count}")
    print(f"💾 Total space saved: {total_saved_mb:.1f} MB")
    
    if total_saved_mb > 0:
        print(f"📉 Reduction: {(total_saved_mb/total_size_mb*100):.1f}%")
    
    print()
    print("🎉 Your images are now optimized for web!")
    print("💡 Next step: Test your website to ensure images look good")
    print()

if __name__ == "__main__":
    try:
        import PIL
        print("✅ PIL/Pillow is installed (version {})".format(PIL.__version__))
    except ImportError:
        print("❌ PIL/Pillow is not installed!")
        print("Install it with: pip3 install Pillow")
        sys.exit(1)
    
    optimize_all_images()


