#!/usr/bin/env python3
"""
Analyze the actual colors present in the Cinzano atlas
to create a better color-to-intensity mapping
"""

import os
import sys
from pathlib import Path
import numpy as np
from collections import Counter

try:
    from PIL import Image
    Image.MAX_IMAGE_PIXELS = None
    print("PIL/Pillow available")
except ImportError:
    print("Installing Pillow...")
    import subprocess
    result = subprocess.run([sys.executable, '-m', 'pip', 'install', 'Pillow'], 
                          capture_output=True, text=True)
    if result.returncode == 0:
        from PIL import Image
        Image.MAX_IMAGE_PIXELS = None
        print("PIL/Pillow successfully installed")
    else:
        print("Failed to install Pillow")
        sys.exit(1)

def analyze_atlas_colors():
    """Analyze actual colors present in the atlas file"""
    
    input_file = Path("heatmap_data/world2024_low3.png")
    
    if not input_file.exists():
        print(f"Input file not found: {input_file}")
        return None
    
    print(f"Analyzing colors in: {input_file}")
    
    try:
        # Load the atlas image
        img = Image.open(input_file)
        print(f"Original size: {img.size}")
        print(f"Original mode: {img.mode}")
        
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Sample the image (use smaller sample for analysis speed)
        sample_size = (2000, 800)  # Sample for analysis
        sampled_img = img.resize(sample_size, Image.LANCZOS)
        
        # Convert to numpy array
        img_array = np.array(sampled_img)
        
        # Reshape to get all pixels as RGB tuples
        pixels = img_array.reshape(-1, 3)
        
        # Count unique colors
        unique_colors = {}
        for pixel in pixels:
            color_tuple = tuple(pixel)
            if color_tuple in unique_colors:
                unique_colors[color_tuple] += 1
            else:
                unique_colors[color_tuple] = 1
        
        # Sort by frequency
        sorted_colors = sorted(unique_colors.items(), key=lambda x: x[1], reverse=True)
        
        print(f"\nFound {len(unique_colors)} unique colors")
        print(f"Analyzing top {min(20, len(sorted_colors))} most frequent colors:")
        print("=" * 60)
        
        for i, (color, count) in enumerate(sorted_colors[:20]):
            percentage = (count / len(pixels)) * 100
            r, g, b = color
            
            # Classify color type
            color_type = classify_color(color)
            
            print(f"{i+1:2d}. RGB({r:3d},{g:3d},{b:3d}) - {count:8d} pixels ({percentage:5.2f}%) - {color_type}")
        
        # Analyze color distribution patterns
        print(f"\n" + "=" * 60)
        print("COLOR PATTERN ANALYSIS:")
        
        # Find potential background/ocean color (should be most frequent dark color)
        background_candidates = [(color, count) for color, count in sorted_colors 
                               if is_dark_color(color) and count > len(pixels) * 0.01]
        
        if background_candidates:
            bg_color, bg_count = background_candidates[0]
            bg_percentage = (bg_count / len(pixels)) * 100
            print(f"Likely background/ocean: RGB{bg_color} ({bg_percentage:.1f}%)")
        
        # Find light pollution colors (non-background colors)
        light_colors = [(color, count) for color, count in sorted_colors 
                       if not is_dark_color(color) and count > len(pixels) * 0.001]
        
        print(f"Light pollution colors found: {len(light_colors)}")
        
        # Group colors by intensity/brightness
        brightness_groups = {}
        for color, count in sorted_colors:
            brightness = sum(color) / 3  # Simple brightness metric
            brightness_tier = int(brightness / 32)  # Group into 8 tiers
            
            if brightness_tier not in brightness_groups:
                brightness_groups[brightness_tier] = []
            brightness_groups[brightness_tier].append((color, count))
        
        print(f"\nBrightness distribution:")
        for tier in sorted(brightness_groups.keys()):
            total_pixels = sum(count for _, count in brightness_groups[tier])
            percentage = (total_pixels / len(pixels)) * 100
            avg_brightness = tier * 32 + 16
            print(f"Tier {tier} (brightness ~{avg_brightness:3d}): {len(brightness_groups[tier]):3d} colors, {total_pixels:8d} pixels ({percentage:5.2f}%)")
        
        return sorted_colors, brightness_groups
        
    except Exception as e:
        print(f"Error analyzing atlas: {e}")
        return None

def classify_color(rgb):
    """Classify color based on RGB values"""
    r, g, b = rgb
    
    # Check for grayscale
    if abs(r - g) < 10 and abs(g - b) < 10 and abs(r - b) < 10:
        if r < 30:
            return "Black/Dark"
        elif r > 200:
            return "White/Light Gray"
        else:
            return "Gray"
    
    # Check for primary colors
    if r > g + 50 and r > b + 50:
        return "Red-ish"
    elif g > r + 50 and g > b + 50:
        return "Green-ish"
    elif b > r + 50 and b > g + 50:
        return "Blue-ish"
    elif r > 150 and g > 150 and b < 100:
        return "Yellow-ish"
    elif r > 150 and g > 100 and b < 100:
        return "Orange-ish"
    else:
        return "Mixed/Other"

def is_dark_color(rgb):
    """Check if color is dark (likely background)"""
    return sum(rgb) < 150  # Sum of RGB < 150 is considered dark

def main():
    print("Cinzano Atlas Color Analysis")
    print("=" * 40)
    
    result = analyze_atlas_colors()
    
    if result:
        print(f"\n✅ Color analysis complete!")
        print("Use this data to create better color-to-intensity mapping.")
    else:
        print("\n❌ Failed to analyze colors")
    
    return result

if __name__ == "__main__":
    main()
