#!/usr/bin/env python3
"""
AUTO Image Optimization - No prompts, just optimizes!
Creates backup automatically
"""

import os
from pathlib import Path
from PIL import Image
import shutil
from datetime import datetime

# Configuration
MAX_WIDTH = 1200
MAX_HEIGHT = 1200
QUALITY = 85
MIN_SIZE_KB = 200

def get_image_size_kb(filepath):
    return os.path.getsize(filepath) / 1024

def get_image_size_mb(filepath):
    return os.path.getsize(filepath) / (1024 * 1024)

def create_backup():
    """Create backup of catalogue"""
    print("🔒 Creating backup...")
    backup_name = f"catalouge_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    backup_path = Path(backup_name)
    
    if Path("catalouge").exists() and not backup_path.exists():
        try:
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
        original_size_kb = get_image_size_kb(image_path)
        
        if original_size_kb < MIN_SIZE_KB:
            return False, original_size_kb, original_size_kb
        
        img = Image.open(image_path)
        
        # Convert to RGB if needed
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        
        # Resize if too large
        if img.width > MAX_WIDTH or img.height > MAX_HEIGHT:
            img.thumbnail((MAX_WIDTH, MAX_HEIGHT), Image.Resampling.LANCZOS)
        
        # Save optimized
        if image_path.lower().endswith('.png'):
            new_path = image_path.rsplit('.', 1)[0] + '.jpg'
            img.save(new_path, 'JPEG', quality=QUALITY, optimize=True)
            os.remove(image_path)
            image_path = new_path
        else:
            img.save(image_path, 'JPEG', quality=QUALITY, optimize=True)
        
        new_size_kb = get_image_size_kb(image_path)
        return True, original_size_kb, new_size_kb
        
    except Exception as e:
        print(f"❌ Error: {image_path.name}: {e}")
        return False, 0, 0

def main():
    base_path = Path("catalouge/products")
    
    if not base_path.exists():
        print("❌ catalouge/products directory not found!")
        return
    
    print("\n" + "="*80)
    print("🎨 AUTO IMAGE OPTIMIZATION")
    print("="*80)
    print(f"📐 Max: {MAX_WIDTH}x{MAX_HEIGHT}px | Quality: {QUALITY}% | Min: >{MIN_SIZE_KB}KB")
    print("="*80)
    print()
    
    # Find large images
    print("🔍 Scanning...")
    large_images = []
    
    for ext in ['*.jpg', '*.jpeg', '*.JPG', '*.JPEG', '*.png', '*.PNG']:
        for img in base_path.glob(f'**/{ext}'):
            size_kb = get_image_size_kb(str(img))
            if size_kb > MIN_SIZE_KB:
                large_images.append((img, size_kb))
    
    if not large_images:
        print("✅ No images need optimization!")
        return
    
    large_images.sort(key=lambda x: x[1], reverse=True)
    total_mb = sum(x[1] for x in large_images) / 1024
    
    print(f"📊 Found {len(large_images)} large images ({total_mb:.1f} MB)")
    print(f"🔝 Largest: {large_images[0][1]/1024:.1f} MB")
    print()
    
    # Create backup
    if not create_backup():
        print("⚠️  No backup created, but continuing...")
    
    print("\n🚀 Optimizing...\n")
    
    optimized = 0
    total_saved = 0
    
    for idx, (img_path, _) in enumerate(large_images, 1):
        progress = (idx / len(large_images)) * 100
        
        was_opt, old_kb, new_kb = optimize_image(str(img_path))
        
        if was_opt:
            optimized += 1
            saved_kb = old_kb - new_kb
            total_saved += saved_kb
            reduction = (saved_kb / old_kb * 100) if old_kb > 0 else 0
            
            if saved_kb > 1000:  # Show significant savings
                print(f"[{progress:5.1f}%] ✅ {img_path.name[:40]:<40} {old_kb:6.0f}→{new_kb:5.0f}KB ({reduction:4.1f}%)")
        
        # Progress update every 10 images
        if idx % 10 == 0:
            print(f"[{progress:5.1f}%] Processed {idx}/{len(large_images)}...")
    
    print("\n" + "="*80)
    print("✅ COMPLETE!")
    print("="*80)
    print(f"✅ Optimized: {optimized} images")
    print(f"💾 Saved: {total_saved/1024:.1f} MB")
    print(f"📉 Reduction: {(total_saved/1024/total_mb*100):.1f}%")
    print()
    print("🎉 Your website will now load much faster!")
    print()

if __name__ == "__main__":
    main()


