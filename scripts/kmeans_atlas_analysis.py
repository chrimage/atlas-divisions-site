#!/usr/bin/env python3
"""
Use K-means clustering to identify the 8 main colors in the atlas
and map them to proper Cinzano light pollution categories
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

def analyze_atlas_with_kmeans():
    """Use K-means to find the 8 main colors in the atlas"""
    
    input_file = Path("heatmap_data/world2024_low3.png")
    
    if not input_file.exists():
        print(f"Input file not found: {input_file}")
        return None
    
    print(f"Analyzing atlas with K-means clustering: {input_file}")
    
    try:
        # Load the atlas image
        img = Image.open(input_file)
        print(f"Original size: {img.size}")
        print(f"Original mode: {img.mode}")
        
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Sample the image for analysis (use smaller sample for speed)
        sample_size = (1000, 400)  # Smaller sample for K-means
        sampled_img = img.resize(sample_size)
        
        # Convert to numpy array and reshape for K-means
        img_array = np.array(sampled_img)
        pixels = img_array.reshape(-1, 3)
        
        print(f"Analyzing {len(pixels)} pixels...")
        
        # Apply K-means clustering to find 16 main colors (expanded scale)
        print("Running K-means clustering (k=16)...")
        kmeans = KMeans(n_clusters=16, random_state=42, n_init=10)
        cluster_labels = kmeans.fit_predict(pixels)
        cluster_centers = kmeans.cluster_centers_
        
        # Count pixels in each cluster
        cluster_counts = Counter(cluster_labels)
        
        # Sort clusters by frequency (most common first)
        sorted_clusters = sorted(cluster_counts.items(), key=lambda x: x[1], reverse=True)
        
        print(f"\nFound 16 color clusters:")
        print("=" * 70)
        
        color_mapping = {}
        
        for i, (cluster_id, count) in enumerate(sorted_clusters):
            center = cluster_centers[cluster_id]
            r, g, b = [int(c) for c in center]
            percentage = (count / len(pixels)) * 100
            
            # Calculate brightness for sorting
            brightness = sum(center) / 3
            
            # Classify this color cluster
            color_type = classify_cluster_color((r, g, b), brightness)
            
            print(f"{i+1}. Cluster {cluster_id}: RGB({r:3d},{g:3d},{b:3d}) - {count:8d} pixels ({percentage:5.2f}%) - {color_type}")
            
            color_mapping[cluster_id] = {
                'rgb': (r, g, b),
                'count': count,
                'percentage': percentage,
                'brightness': brightness,
                'type': color_type
            }
        
        # Sort by brightness to map to Cinzano scale
        brightness_sorted = sorted(color_mapping.items(), key=lambda x: x[1]['brightness'])
        
        print(f"\n" + "=" * 70)
        print("MAPPING TO CINZANO SCALE (sorted by brightness):")
        
        # Define expanded Cinzano categories (16 colors)
        # Based on the provided scale with ratios and lightmap intensities
        cinzano_categories = [
            ('Black 1', '<0.01', 0),                    # Darkest
            ('Black 2', '0.01-0.06', 8),
            ('Dark Gray 1', '0.06-0.11', 16),
            ('Dark Gray 2', '0.11-0.19', 24),
            ('Blue 1', '0.19-0.33', 32),
            ('Blue 2', '0.33-0.58', 48),
            ('Green 1', '0.58-1.00', 64),
            ('Green 2', '1.00-1.73', 80),
            ('Yellow 1', '1.73-3.00', 96),
            ('Yellow 2', '3.00-5.20', 128),
            ('Orange 1', '5.20-9.00', 160),
            ('Orange 2', '9.00-15.59', 192),
            ('Red 1', '15.59-27.00', 224),
            ('Red 2', '27.00-46.77', 240),
            ('White 1', '>46.77', 255),
            ('White 2/Border', 'Border', 0)             # Filtered out
        ]
        
        final_mapping = {}
        
        for i, (cluster_id, cluster_data) in enumerate(brightness_sorted):
            if i < len(cinzano_categories):
                category_name, ratio_range, intensity = cinzano_categories[i]
                r, g, b = cluster_data['rgb']
                
                print(f"{category_name:12s} | RGB({r:3d},{g:3d},{b:3d}) | Ratio: {ratio_range:8s} | Intensity: {intensity:3d} | {cluster_data['percentage']:5.2f}%")
                
                final_mapping[cluster_id] = {
                    'rgb': (r, g, b),
                    'category': category_name,
                    'intensity': intensity,
                    'ratio_range': ratio_range
                }
        
        return final_mapping, kmeans
        
    except Exception as e:
        print(f"Error analyzing atlas: {e}")
        return None

def classify_cluster_color(rgb, brightness):
    """Classify a cluster color based on RGB and brightness"""
    r, g, b = rgb
    
    if brightness < 10:
        return "Very Dark"
    elif brightness < 30:
        return "Dark"
    elif brightness < 60:
        return "Medium Dark"
    elif brightness < 100:
        return "Medium"
    elif brightness < 150:
        return "Medium Light"
    elif brightness < 200:
        return "Light"
    else:
        return "Very Light"

def main():
    print("K-means Atlas Color Analysis")
    print("=" * 40)
    
    result = analyze_atlas_with_kmeans()
    
    if result:
        mapping, kmeans = result
        print(f"\n✅ K-means analysis complete!")
        print("Use this mapping to create proper color-to-intensity conversion.")
        
        # Save the mapping for use in decode script
        import pickle
        with open('kmeans_color_mapping.pkl', 'wb') as f:
            pickle.dump((mapping, kmeans), f)
        print("Saved mapping to kmeans_color_mapping.pkl")
        
        return mapping, kmeans
    else:
        print("\n❌ Failed to analyze colors")
        return None

if __name__ == "__main__":
    main()