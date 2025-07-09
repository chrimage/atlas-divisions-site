#!/usr/bin/env python3
"""
Decode Cinzano Light Pollution Atlas into proper lightmap
Based on: The first World Atlas of the artificial night sky brightness
P. Cinzano, F. Falchi and C. D. Elvidge

Color scheme represents ratios between artificial and natural sky brightness:
- Black: <0.01
- Dark Gray: 0.01-0.11  
- Blue: 0.11-0.33
- Green: 0.33-1
- Yellow: 1-3
- Orange: 3-9
- Red: 9-27
- White: >27 (also used for borders - filter out)
"""

import os
import sys
from pathlib import Path
import numpy as np

try:
    from PIL import Image, ImageEnhance
    Image.MAX_IMAGE_PIXELS = None
    print("PIL/Pillow available")
except ImportError:
    print("Installing Pillow...")
    import subprocess
    result = subprocess.run([sys.executable, '-m', 'pip', 'install', 'Pillow'], 
                          capture_output=True, text=True)
    if result.returncode == 0:
        from PIL import Image, ImageEnhance
        Image.MAX_IMAGE_PIXELS = None
        print("PIL/Pillow successfully installed")
    else:
        print("Failed to install Pillow")
        sys.exit(1)

def color_distance(color1, color2):
    """Calculate Euclidean distance between two RGB colors"""
    return np.sqrt(sum((a - b) ** 2 for a, b in zip(color1, color2)))

def brightness_to_intensity(brightness):
    """Convert grayscale brightness (0-255) to lightmap intensity (0-255)"""
    # Normalize to 0-1
    normalized = brightness / 255.0
    
    # Apply power curve to enhance contrast (gamma correction)
    # Higher gamma makes darker areas stay dark, brighter areas pop more
    gamma = 2.2
    enhanced = normalized ** (1.0 / gamma)
    
    # Scale to lightmap intensity (0-255)
    intensity = int(enhanced * 255)
    
    return min(255, max(0, intensity))

def process_grayscale_pixel(pixel_rgb):
    """Process a single pixel from grayscale atlas"""
    # Calculate brightness (average of RGB since it's grayscale)
    brightness = sum(pixel_rgb) / 3
    
    # Convert to lightmap intensity
    intensity = brightness_to_intensity(brightness)
    
    return intensity

def decode_atlas_to_lightmap():
    """Convert Cinzano atlas to proper lightmap"""
    
    input_file = Path("heatmap_data/world2024_low3.png")
    output_dir = Path("../public/js/")
    output_dir.mkdir(exist_ok=True)
    
    if not input_file.exists():
        print(f"Input file not found: {input_file}")
        return None
    
    print(f"Decoding Cinzano atlas: {input_file}")
    
    try:
        # Load the atlas image
        img = Image.open(input_file)
        print(f"Atlas size: {img.size}")
        print(f"Atlas mode: {img.mode}")
        
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize to proper globe texture size (2000x1000)
        target_size = (2000, 1000)
        resized_img = img.resize(target_size)
        print(f"Resized to: {resized_img.size}")
        
        # Convert to numpy array for processing
        img_array = np.array(resized_img)
        height, width, channels = img_array.shape
        
        # Create lightmap array
        lightmap_array = np.zeros((height, width), dtype=np.uint8)
        
        print("Converting grayscale atlas to lightmap intensities...")
        
        # Process each pixel using grayscale approach
        for y in range(height):
            if y % 100 == 0:
                progress = (y / height) * 100
                print(f"\rProgress: {progress:.1f}%", end='', flush=True)
            
            for x in range(width):
                pixel_rgb = tuple(img_array[y, x])
                
                # Process grayscale pixel directly
                intensity = process_grayscale_pixel(pixel_rgb)
                
                lightmap_array[y, x] = intensity
        
        print(f"\nAtlas decoding complete")
        
        # Convert back to PIL Image
        lightmap_img = Image.fromarray(lightmap_array, mode='L')
        
        # Enhance contrast to make lights pop
        enhancer = ImageEnhance.Contrast(lightmap_img)
        enhanced = enhancer.enhance(1.5)
        
        # Convert to RGB for Three.js
        final_img = enhanced.convert('RGB')
        
        # Save lightmap
        output_file = output_dir / "cinzano_lightmap.png"
        final_img.save(output_file, "PNG", optimize=True)
        
        print(f"Saved decoded lightmap: {output_file}")
        print(f"File size: {output_file.stat().st_size / 1024 / 1024:.1f} MB")
        
        # Print statistics
        unique_intensities = np.unique(lightmap_array)
        print(f"Unique intensity levels: {len(unique_intensities)}")
        print(f"Intensity range: {np.min(lightmap_array)} - {np.max(lightmap_array)}")
        
        return output_file
        
    except Exception as e:
        print(f"Error decoding atlas: {e}")
        return None

def main():
    print("Cinzano Light Pollution Atlas Decoder")
    print("=" * 45)
    print("Converting atlas colors to proper lightmap intensities...")
    print("Filtering out white borders...")
    
    result = decode_atlas_to_lightmap()
    
    if result:
        print(f"\n✅ Successfully decoded Cinzano atlas!")
        print(f"Lightmap ready: {result}")
        print("This lightmap uses proper intensity values based on light pollution ratios!")
    else:
        print("\n❌ Failed to decode atlas")
    
    return result

if __name__ == "__main__":
    main()