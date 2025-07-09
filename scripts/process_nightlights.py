#!/usr/bin/env python3
"""
Process NASA nighttime lights images for globe texture use
Converts NASA Black Marble images to proper format for Three.js globe
"""

import os
import sys
from pathlib import Path

def install_pillow():
    """Install Pillow if not available"""
    try:
        import subprocess
        result = subprocess.run([sys.executable, '-m', 'pip', 'install', 'Pillow'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("Successfully installed Pillow")
            return True
        else:
            print(f"Failed to install Pillow: {result.stderr}")
            return False
    except Exception as e:
        print(f"Error installing Pillow: {e}")
        return False

# Try to import PIL, install if not available
try:
    from PIL import Image, ImageEnhance, ImageOps
    print("PIL/Pillow available")
except ImportError:
    print("PIL/Pillow not found, attempting to install...")
    if install_pillow():
        try:
            from PIL import Image, ImageEnhance, ImageOps
            print("PIL/Pillow successfully imported after installation")
        except ImportError:
            print("Failed to import PIL/Pillow even after installation")
            sys.exit(1)
    else:
        print("Could not install PIL/Pillow. Please install manually: pip install Pillow")
        sys.exit(1)

class NightlightsProcessor:
    def __init__(self):
        self.input_dir = Path("nasa_nightlights")
        self.output_dir = Path("processed_textures")
        self.output_dir.mkdir(exist_ok=True)
        
    def process_image(self, input_path, target_width=2000, target_height=1000):
        """
        Process a single nighttime lights image for globe use
        """
        print(f"Processing: {input_path}")
        
        try:
            # Open the image
            img = Image.open(input_path)
            print(f"Original size: {img.size}")
            print(f"Original mode: {img.mode}")
            
            # Convert to RGB if needed (remove alpha channel)
            if img.mode == 'RGBA':
                # Create a black background
                rgb_img = Image.new('RGB', img.size, (0, 0, 0))
                rgb_img.paste(img, mask=img.split()[-1])  # Use alpha as mask
                img = rgb_img
                print("Converted RGBA to RGB with black background")
            
            # Resize to target dimensions (this will crop/stretch to 2:1 aspect ratio)
            resized_img = img.resize((target_width, target_height), Image.LANCZOS)
            print(f"Resized to: {resized_img.size}")
            
            # Enhance the image for better emissive effect
            enhanced_img = self.enhance_for_emissive(resized_img)
            
            # Save the processed image
            output_filename = f"light_pollution_texture_{target_width}x{target_height}.png"
            output_path = self.output_dir / output_filename
            
            enhanced_img.save(output_path, "PNG", optimize=True)
            print(f"Saved processed texture: {output_path}")
            print(f"Output file size: {output_path.stat().st_size / 1024 / 1024:.1f} MB")
            
            return output_path
            
        except Exception as e:
            print(f"Error processing {input_path}: {e}")
            return None
    
    def enhance_for_emissive(self, img):
        """
        Enhance the image to work better as an emissive texture
        """
        print("Enhancing image for emissive use...")
        
        # Convert to grayscale first to extract brightness information
        grayscale = img.convert('L')
        
        # Enhance contrast to make lights more prominent
        enhancer = ImageEnhance.Contrast(grayscale)
        contrasted = enhancer.enhance(2.0)  # Increase contrast
        
        # Increase brightness of the lights
        enhancer = ImageEnhance.Brightness(contrasted)
        brightened = enhancer.enhance(1.5)  # Increase brightness
        
        # Apply gamma correction to make lights pop more
        # This makes bright areas brighter and dark areas darker
        gamma = 0.8
        gamma_table = [int(((i / 255.0) ** gamma) * 255) for i in range(256)]
        gamma_corrected = brightened.point(gamma_table)
        
        # Convert back to RGB (keeping it monochrome but in RGB format)
        rgb_enhanced = Image.merge('RGB', (gamma_corrected, gamma_corrected, gamma_corrected))
        
        print("Applied contrast, brightness, and gamma enhancement")
        
        return rgb_enhanced
    
    def create_multiple_sizes(self, input_path):
        """
        Create multiple texture sizes for different use cases
        """
        sizes = [
            (2000, 1000),  # High quality
            (1024, 512),   # Medium quality  
            (512, 256),    # Low quality for mobile
        ]
        
        results = []
        for width, height in sizes:
            result = self.process_image(input_path, width, height)
            if result:
                results.append(result)
        
        return results
    
    def process_all_images(self):
        """
        Process all images in the input directory
        """
        input_files = list(self.input_dir.glob("*.png"))
        
        if not input_files:
            print(f"No PNG files found in {self.input_dir}")
            return []
        
        print(f"Found {len(input_files)} images to process")
        
        all_results = []
        
        for input_file in input_files:
            print(f"\n--- Processing {input_file.name} ---")
            
            # Process the main 2000x1000 texture
            result = self.process_image(input_file)
            if result:
                all_results.append(result)
                
                # Also create smaller sizes
                smaller_results = self.create_multiple_sizes(input_file)
                all_results.extend(smaller_results)
        
        return all_results

def main():
    print("NASA Nighttime Lights Texture Processor")
    print("=" * 50)
    
    processor = NightlightsProcessor()
    
    # Check if we have input files
    input_dir = Path("nasa_nightlights")
    if not input_dir.exists():
        print(f"Input directory {input_dir} not found!")
        print("Please run the NASA downloader script first.")
        return False
    
    # Process all images
    results = processor.process_all_images()
    
    if results:
        print(f"\n✅ Successfully processed {len(results)} texture files:")
        for result in results:
            print(f"  - {result}")
        
        print(f"\nTextures saved in: {processor.output_dir}")
        print("Ready to use with Three.js globe!")
        return True
    else:
        print("\n❌ No textures were processed successfully")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)