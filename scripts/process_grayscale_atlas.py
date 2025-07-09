#!/usr/bin/env python3
"""
Process Cinzano Atlas as grayscale intensity data
The atlas actually uses grayscale values (0-37) representing light pollution levels
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

def process_grayscale_atlas():
    """Process the atlas as grayscale intensity data"""
    
    input_file = Path("heatmap_data/world2024B.png")
    output_dir = Path("../public/js/")
    output_dir.mkdir(exist_ok=True)
    
    if not input_file.exists():
        print(f"Input file not found: {input_file}")
        return None
    
    print(f"Processing grayscale atlas: {input_file}")
    
    try:
        # Load the atlas image
        img = Image.open(input_file)
        print(f"Original size: {img.size}")
        print(f"Original mode: {img.mode}")
        
        # Convert to RGB if needed (to access all data)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize to proper globe texture size (2000x1000)
        target_size = (2000, 1000)
        resized_img = img.resize(target_size, Image.LANCZOS)
        print(f"Resized to: {resized_img.size}")
        
        # Convert to numpy array
        img_array = np.array(resized_img)
        
        # Extract grayscale values (R=G=B in this atlas)
        # Take red channel as it contains the intensity data
        grayscale_array = img_array[:, :, 0].astype(np.float32)
        
        print(f"Intensity range in atlas: {np.min(grayscale_array)} - {np.max(grayscale_array)}")
        
        # Atlas uses values 0-37 roughly, where 0 = no light pollution
        # Scale this to a better range for lightmap (0-255)
        
        # First, normalize to 0-1 range
        max_atlas_value = 37.0  # Based on analysis
        normalized = np.clip(grayscale_array / max_atlas_value, 0, 1)
        
        # Apply a curve to enhance the lights without making everything bright
        # Use power curve to emphasize higher values
        enhanced = np.power(normalized, 0.7)  # Makes mid-values brighter
        
        # Scale to 0-255 range for lightmap
        lightmap_array = (enhanced * 255).astype(np.uint8)
        
        print(f"Lightmap intensity range: {np.min(lightmap_array)} - {np.max(lightmap_array)}")
        
        # Convert to PIL Image
        lightmap_img = Image.fromarray(lightmap_array, mode='L')
        
        # Optional: Enhance contrast slightly
        enhancer = ImageEnhance.Contrast(lightmap_img)
        contrasted = enhancer.enhance(1.2)
        
        # Convert to RGB for Three.js compatibility
        final_img = contrasted.convert('RGB')
        
        # Save lightmap
        output_file = output_dir / "atlas_lightmap.png"
        final_img.save(output_file, "PNG", optimize=True)
        
        print(f"Saved processed lightmap: {output_file}")
        print(f"File size: {output_file.stat().st_size / 1024 / 1024:.1f} MB")
        
        # Print statistics
        unique_values = np.unique(lightmap_array)
        print(f"Unique intensity levels: {len(unique_values)}")
        
        # Count non-zero pixels (areas with light pollution)
        light_pixels = np.count_nonzero(lightmap_array)
        total_pixels = lightmap_array.size
        light_percentage = (light_pixels / total_pixels) * 100
        print(f"Light pollution coverage: {light_percentage:.2f}% of surface")
        
        return output_file
        
    except Exception as e:
        print(f"Error processing atlas: {e}")
        return None

def main():
    print("Grayscale Atlas Processor")
    print("=" * 35)
    print("Processing atlas as continuous grayscale intensity data...")
    
    result = process_grayscale_atlas()
    
    if result:
        print(f"\n✅ Successfully processed grayscale atlas!")
        print(f"Lightmap ready: {result}")
        print("This lightmap preserves the continuous intensity gradations!")
    else:
        print("\n❌ Failed to process atlas")
    
    return result

if __name__ == "__main__":
    main()