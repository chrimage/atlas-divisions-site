#!/usr/bin/env python3
"""
Process light pollution heatmap for globe texture use
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image, ImageEnhance, ImageOps
    # Allow large images
    Image.MAX_IMAGE_PIXELS = None
    print("PIL/Pillow available")
except ImportError:
    print("Installing Pillow...")
    import subprocess
    result = subprocess.run([sys.executable, '-m', 'pip', 'install', 'Pillow'], 
                          capture_output=True, text=True)
    if result.returncode == 0:
        from PIL import Image, ImageEnhance, ImageOps
        print("PIL/Pillow successfully installed and imported")
    else:
        print("Failed to install Pillow")
        sys.exit(1)

def process_heatmap():
    """Process the light pollution heatmap for globe use"""
    
    input_file = Path("heatmap_data/world2024B.png")
    output_dir = Path("../public/js/")
    output_dir.mkdir(exist_ok=True)
    
    if not input_file.exists():
        print(f"Input file not found: {input_file}")
        return None
    
    print(f"Processing heatmap: {input_file}")
    
    try:
        # Open the image
        img = Image.open(input_file)
        print(f"Original size: {img.size}")
        print(f"Original mode: {img.mode}")
        
        # Convert palette to RGB first to access full color data
        if img.mode == 'P':
            img = img.convert('RGB')
            print("Converted palette mode to RGB")
        
        # Resize to 2000x1000 (proper 2:1 aspect ratio for equirectangular)
        target_size = (2000, 1000)
        resized_img = img.resize(target_size, Image.LANCZOS)
        print(f"Resized to: {resized_img.size}")
        
        # Extract intensity from RGB heatmap properly
        # Don't just average RGB - extract the maximum intensity value
        import numpy as np
        img_array = np.array(resized_img)
        
        # Take the maximum value across RGB channels for each pixel
        # This preserves the peak intensity rather than averaging
        intensity_array = np.max(img_array, axis=2)
        
        # Convert back to PIL Image
        grayscale_img = Image.fromarray(intensity_array, mode='L')
        print("Extracted maximum intensity from RGB heatmap (preserving data)")
        
        # Enhance contrast to make lights pop more
        enhancer = ImageEnhance.Contrast(grayscale_img)
        contrasted = enhancer.enhance(2.5)  # High contrast
        
        # Increase brightness of the lights
        enhancer = ImageEnhance.Brightness(contrasted)
        brightened = enhancer.enhance(1.8)  # Make lights brighter
        
        # Convert back to RGB for Three.js compatibility
        final_img = brightened.convert('RGB')
        
        # Save as PNG 
        output_file = output_dir / "light_pollution_heatmap.png"
        final_img.save(output_file, "PNG", optimize=True)
        
        print(f"Saved processed heatmap: {output_file}")
        print(f"Output file size: {output_file.stat().st_size / 1024 / 1024:.1f} MB")
        
        return output_file
        
    except Exception as e:
        print(f"Error processing heatmap: {e}")
        return None

def main():
    print("Light Pollution Heatmap Processor")
    print("=" * 40)
    
    result = process_heatmap()
    
    if result:
        print(f"\n✅ Successfully processed light pollution heatmap!")
        print(f"Ready to use: {result}")
        print("This is pure artificial light data - perfect for emissive mapping!")
    else:
        print("\n❌ Failed to process heatmap")
    
    return result

if __name__ == "__main__":
    main()