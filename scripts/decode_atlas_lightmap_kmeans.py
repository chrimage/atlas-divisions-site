#!/usr/bin/env python3
"""
Decode Cinzano Light Pollution Atlas using K-means color mapping
Based on the expanded 16-color Cinzano scale
"""

import os
import sys
from pathlib import Path
import numpy as np
import pickle

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

try:
    from sklearn.cluster import KMeans
    print("scikit-learn available")
except ImportError:
    print("Installing scikit-learn...")
    import subprocess
    result = subprocess.run([sys.executable, '-m', 'pip', 'install', 'scikit-learn'], 
                          capture_output=True, text=True)
    if result.returncode == 0:
        from sklearn.cluster import KMeans
        print("scikit-learn successfully installed")
    else:
        print("Failed to install scikit-learn")
        sys.exit(1)

def load_kmeans_mapping():
    """Load the K-means color mapping from pickle file"""
    mapping_file = Path("kmeans_color_mapping.pkl")
    
    if not mapping_file.exists():
        print("K-means mapping not found. Run kmeans_atlas_analysis.py first.")
        return None
    
    try:
        with open(mapping_file, 'rb') as f:
            mapping, kmeans_model = pickle.load(f)
        print("Loaded K-means color mapping")
        return mapping, kmeans_model
    except Exception as e:
        print(f"Error loading K-means mapping: {e}")
        return None

def find_closest_cluster(pixel_rgb, kmeans_model):
    """Find the closest cluster for a given pixel using the trained K-means model"""
    pixel_array = np.array([pixel_rgb]).reshape(1, -1)
    cluster_id = kmeans_model.predict(pixel_array)[0]
    return cluster_id

def decode_atlas_to_lightmap_kmeans():
    """Convert Cinzano atlas to proper lightmap using K-means mapping"""
    
    input_file = Path("heatmap_data/world2024_low3.png")
    output_dir = Path("../public/js/")
    output_dir.mkdir(exist_ok=True)
    
    if not input_file.exists():
        print(f"Input file not found: {input_file}")
        return None
    
    # Load K-means mapping
    mapping_data = load_kmeans_mapping()
    if not mapping_data:
        return None
    
    color_mapping, kmeans_model = mapping_data
    
    print(f"Decoding Cinzano atlas with K-means: {input_file}")
    
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
        
        print("Converting atlas colors to lightmap intensities using K-means...")
        
        # Process each pixel using K-means clustering
        for y in range(height):
            if y % 100 == 0:
                progress = (y / height) * 100
                print(f"\rProgress: {progress:.1f}%", end='', flush=True)
            
            for x in range(width):
                pixel_rgb = tuple(img_array[y, x])
                
                # Find closest cluster
                cluster_id = find_closest_cluster(pixel_rgb, kmeans_model)
                
                # Get corresponding lightmap intensity
                if cluster_id in color_mapping:
                    intensity = color_mapping[cluster_id]['intensity']
                    
                    # Filter out borders (White 2/Border category)
                    if color_mapping[cluster_id]['category'] == 'White 2/Border':
                        intensity = 0  # Make borders black
                else:
                    intensity = 0  # Default to black for unmapped clusters
                
                lightmap_array[y, x] = intensity
        
        print(f"\nAtlas decoding complete")
        
        # Convert back to PIL Image
        lightmap_img = Image.fromarray(lightmap_array, mode='L')
        
        # Enhance contrast to make lights pop
        enhancer = ImageEnhance.Contrast(lightmap_img)
        enhanced = enhancer.enhance(1.3)
        
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
        
        # Print cluster usage statistics
        print(f"\nCluster usage statistics:")
        cluster_counts = {}
        for y in range(height):
            for x in range(width):
                pixel_rgb = tuple(img_array[y, x])
                cluster_id = find_closest_cluster(pixel_rgb, kmeans_model)
                cluster_counts[cluster_id] = cluster_counts.get(cluster_id, 0) + 1
        
        total_pixels = height * width
        for cluster_id in sorted(cluster_counts.keys()):
            if cluster_id in color_mapping:
                count = cluster_counts[cluster_id]
                percentage = (count / total_pixels) * 100
                category = color_mapping[cluster_id]['category']
                intensity = color_mapping[cluster_id]['intensity']
                print(f"Cluster {cluster_id:2d} ({category:12s}): {count:8d} pixels ({percentage:5.2f}%) -> Intensity {intensity:3d}")
        
        return output_file
        
    except Exception as e:
        print(f"Error decoding atlas: {e}")
        return None

def main():
    print("Cinzano Light Pollution Atlas Decoder (K-means)")
    print("=" * 50)
    print("Converting atlas using K-means color clustering...")
    print("Using expanded 16-color Cinzano scale...")
    
    result = decode_atlas_to_lightmap_kmeans()
    
    if result:
        print(f"\n✅ Successfully decoded Cinzano atlas with K-means!")
        print(f"Lightmap ready: {result}")
        print("This lightmap uses proper intensity values based on the expanded Cinzano scale!")
    else:
        print("\n❌ Failed to decode atlas")
    
    return result

if __name__ == "__main__":
    main()