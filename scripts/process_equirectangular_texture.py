#!/usr/bin/env python3
"""
Process equirectangular night lights texture to proper format for globe
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image, ImageEnhance
    print("PIL/Pillow available")
except ImportError:
    print("Installing Pillow...")
    import subprocess
    result = subprocess.run([sys.executable, '-m', 'pip', 'install', 'Pillow'], 
                          capture_output=True, text=True)
    if result.returncode == 0:
        from PIL import Image, ImageEnhance
        print("PIL/Pillow successfully installed and imported")
    else:
        print("Failed to install Pillow")
        sys.exit(1)

def process_equirectangular_texture():
    """Process the downloaded equirectangular texture"""
    
    input_file = Path("equirectangular_textures/8k_earth_nightmap.jpg")
    output_dir = Path("../public/js/")
    output_dir.mkdir(exist_ok=True)
    
    if not input_file.exists():
        print(f"Input file not found: {input_file}")
        return None
    
    print(f"Processing: {input_file}")
    
    try:
        # Open the image
        img = Image.open(input_file)
        print(f"Original size: {img.size}")
        print(f"Original mode: {img.mode}")
        
        # Resize to 2000x1000 (proper 2:1 aspect ratio for equirectangular)
        target_size = (2000, 1000)
        resized_img = img.resize(target_size, Image.LANCZOS)
        print(f"Resized to: {resized_img.size}")
        
        # Enhance the image for better emissive effect
        # Convert to RGB if needed
        if resized_img.mode != 'RGB':
            resized_img = resized_img.convert('RGB')
        
        # Enhance contrast to make lights more prominent
        enhancer = ImageEnhance.Contrast(resized_img)
        contrasted = enhancer.enhance(1.8)
        
        # Increase brightness
        enhancer = ImageEnhance.Brightness(contrasted)
        brightened = enhancer.enhance(1.3)
        
        # Save as PNG for better quality and transparency support
        output_file = output_dir / "light_pollution_texture.png"
        brightened.save(output_file, "PNG", optimize=True)
        
        print(f"Saved processed texture: {output_file}")
        print(f"Output file size: {output_file.stat().st_size / 1024 / 1024:.1f} MB")
        
        return output_file
        
    except Exception as e:
        print(f"Error processing texture: {e}")
        return None

def main():
    print("Equirectangular Night Lights Texture Processor")
    print("=" * 55)
    
    result = process_equirectangular_texture()
    
    if result:
        print(f"\n✅ Successfully processed equirectangular night lights texture!")
        print(f"Ready to use: {result}")
        print("This is a proper flat equirectangular projection (2000x1000) for Three.js globe texturing.")
    else:
        print("\n❌ Failed to process texture")
    
    return result

if __name__ == "__main__":
    main()