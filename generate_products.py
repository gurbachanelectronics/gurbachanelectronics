#!/usr/bin/env python3
import os
import json
from pathlib import Path

# Base path
base_path = Path("catalouge/products")

# Product categories mapping (auto-detect with fallback)
def get_category_type(folder_name):
    """Automatically determine category type based on folder name"""
    folder_lower = folder_name.lower()
    
    if "monitor" in folder_lower or "stage" in folder_lower:
        return "monitors"
    elif "line_array" in folder_lower or "array" in folder_lower:
        return "line-arrays"
    elif "base" in folder_lower or "sub" in folder_lower or "bass" in folder_lower:
        return "subwoofers"
    elif "top" in folder_lower or "trs" in folder_lower or "mid" in folder_lower:
        return "tops"
    else:
        return "monitors"  # default fallback

# Product name mapping
product_names = {
    "martin_12": "Martin 12\" Stage Monitor",
    "nexo_12": "Nexo 12\" Stage Monitor",
    "srx_712": "SRX 712 Monitor",
    "stx_812": "STX 812 Stage Monitor",
    "la_monitor": "LA 15\" Stage Monitor",
    "m4_coaxial": "M4 Coaxial Monitor",
    "ohm_15": "OHM 15\" Monitor",
    "pevey_15": "Pevey 15\" Stage Monitor",
    "srx_715": "SRX 715 Single Top",
    "stx_815": "STX 815 Stage Monitor",
    "v35_monitor": "V35 Stage Monitor",
    "vrx_915": "VRX 915 Stage Monitor",
    "v8_line_array": "V8 Line Array",
    "hdl_20": "HDL 20 Line Array",
    "kara_k10": "KARA K10 Line Array",
    "vt_4888": "VT 4888 Line Array",
    "db_j8": "D&B J8 Line Array",
    "vrx_932_line_array": "VRX 932 Line Array",
    "vmax_218": "VMAX 218 Subwoofer",
    "stx_828": "STX 828 Bass",
    "srx_728": "SRX 728 Bass",
    "db_b22": "D&B B22 Bass",
    "pope_dual_18": "POPE Dual 18\" Bass",
    "8006_dual_18": "8006 Dual 18\" Bass",
    "ohm_dual_18": "OHM Dual 18\" Bass",
    "vt_4880": "VT 4880 Dual 18\" Bass",
    "8004_single_18": "8004 Single 18\" Bass",
    "martin_single_18": "Martin Single 18\" Bass",
    "pope_ld18": "POPE LD18 Single 18\"",
    "sub_8018": "8018 Single 18\" Sub",
    "srx_718": "SRX 718 Single Bass",
    "stx_818": "STX 818 Single 18\" Bass",
    "stx_825": "STX 825 Top",
    "srx_725": "SRX 725 Top",
    "ohm_dual_15": "OHM Dual 15\" Top",
    "v45_top": "V45 Top",
    "ohm_trs_212": "OHM TRS 212",
    "ohm_trs_112h": "OHM TRS 112H",
    "t24_mid_high": "T24 Mid High",
    "nexo_10_stage_monitor": "Nexo 10\" Stage Monitor"
}

# Specs mapping
specs_mapping = {
    "12": ["12 Inch", "Professional"],
    "15": ["15 Inch", "High Power"],
    "10": ["10 Inch", "Compact"],
    "dual_10": ["Dual 10\"", "Line Array"],
    "dual_12": ["Dual 12\"", "Line Array"],
    "dual_8": ["Dual 8\"", "Line Array"],
    "dual_15": ["Dual 15\"", "1800W"],
    "dual_18": ["Dual 18\"", "3000W"],
    "single_18": ["Single 18\"", "Powerful"],
    "line_array": ["Line Array", "Premium"],
    "coaxial": ["Coaxial", "Superior Sound"],
    "mid_high": ["Mid-High", "T24 Series"]
}

def get_category(folder_path):
    """Determine category based on folder path"""
    folder_name = folder_path.name
    return get_category_type(folder_name)

def get_specs(product_name, folder_name):
    """Generate specs based on product name and folder"""
    specs = []
    folder_lower = folder_name.lower()
    
    if "12" in folder_lower and "inch" not in folder_lower:
        specs.extend(["12 Inch", "Professional"])
    elif "15" in folder_lower:
        specs.extend(["15 Inch", "High Power"])
    elif "10" in folder_lower:
        specs.extend(["10 Inch", "Compact"])
    elif "18" in folder_lower and "dual" in folder_lower:
        specs.extend(["Dual 18\"", "3000W"])
    elif "18" in folder_lower and "single" in folder_lower:
        specs.extend(["Single 18\"", "Powerful"])
    
    if "line_array" in folder_lower or "array" in folder_lower.replace("_", " "):
        specs.append("Line Array")
    if "martin" in folder_lower or "nexo" in folder_lower or "db_" in folder_lower or "d&b" in folder_lower:
        specs.append("Premium")
    if "srx" in folder_lower or "stx" in folder_lower or "vrx" in folder_lower:
        specs.append("Professional Series")
    if "coaxial" in folder_lower:
        specs.append("Coaxial")
        
    return specs if specs else ["Professional", "High Quality"]

def scan_products():
    """Scan all product directories and generate product data"""
    products = []
    product_id = 1
    
    for category_dir in sorted(base_path.iterdir()):
        if not category_dir.is_dir():
            continue
            
        category = get_category(category_dir)
        
        # Check if this is a direct product folder or has subfolders
        image_files = list(category_dir.glob("*.jpg")) + list(category_dir.glob("*.jpeg")) + list(category_dir.glob("*.png"))
        
        if image_files:
            # Direct product folder
            folder_name = category_dir.name
            product_name = product_names.get(folder_name, folder_name.replace("_", " ").title())
            images = [str(img.relative_to(Path("."))) for img in sorted(image_files)]
            
            if images:
                product = {
                    "id": product_id,
                    "name": product_name,
                    "category": category,
                    "description": f"Professional {product_name} - High quality audio equipment",
                    "specs": get_specs(product_name, folder_name),
                    "images": images
                }
                products.append(product)
                product_id += 1
        else:
            # Has subfolders
            for product_dir in sorted(category_dir.iterdir()):
                if not product_dir.is_dir():
                    continue
                
                # Get all images in this product folder
                images = []
                for ext in ['*.jpg', '*.jpeg', '*.JPG', '*.JPEG', '*.png', '*.PNG']:
                    images.extend(product_dir.glob(ext))
                
                # Also check subfolders (like VMAX original handle)
                for subfolder in product_dir.iterdir():
                    if subfolder.is_dir():
                        for ext in ['*.jpg', '*.jpeg', '*.JPG', '*.JPEG', '*.png', '*.PNG']:
                            images.extend(subfolder.glob(ext))
                
                if images:
                    folder_name = product_dir.name
                    product_name = product_names.get(folder_name, folder_name.replace("_", " ").title())
                    image_paths = [str(img.relative_to(Path("."))) for img in sorted(images)]
                    
                    product = {
                        "id": product_id,
                        "name": product_name,
                        "category": category,
                        "description": f"Professional {product_name} - High quality audio equipment",
                        "specs": get_specs(product_name, folder_name),
                        "images": image_paths
                    }
                    products.append(product)
                    product_id += 1
    
    return products

def main():
    print("Scanning product directories...")
    products = scan_products()
    
    print(f"\nFound {len(products)} products")
    print(f"Total images: {sum(len(p['images']) for p in products)}")
    
    # Save to JSON
    with open('products_data.json', 'w') as f:
        json.dump(products, f, indent=2)
    
    print("\nProduct data saved to products_data.json")
    print("\nSample products:")
    for p in products[:3]:
        print(f"  - {p['name']}: {len(p['images'])} images")

if __name__ == "__main__":
    main()

