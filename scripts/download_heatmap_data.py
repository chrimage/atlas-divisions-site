#!/usr/bin/env python3
"""
Download light pollution heatmap data (pure artificial light sources)
"""

import os
import sys
import requests
from urllib.parse import urljoin
from pathlib import Path

class HeatmapDownloader:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        self.download_dir = Path("heatmap_data")
        self.download_dir.mkdir(exist_ok=True)
        
    def download_file(self, url, filename=None):
        """Download a single file from URL"""
        if not filename:
            filename = Path(url).name
            
        filepath = self.download_dir / filename
        
        if filepath.exists():
            print(f"File already exists: {filepath}")
            return filepath
            
        print(f"Downloading: {url}")
        print(f"To: {filepath}")
        
        try:
            response = self.session.get(url, stream=True, timeout=60)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            
            with open(filepath, 'wb') as f:
                downloaded = 0
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        
                        if total_size > 0:
                            percent = (downloaded / total_size) * 100
                            print(f"\rProgress: {percent:.1f}%", end='', flush=True)
            
            print(f"\nDownload complete: {filepath}")
            print(f"File size: {filepath.stat().st_size / 1024 / 1024:.1f} MB")
            return filepath
            
        except Exception as e:
            print(f"Download failed: {e}")
            if filepath.exists():
                filepath.unlink()
            return None
    
    def download_lorenz_heatmaps(self):
        """Download David Lorenz's pure light pollution heatmaps"""
        print("Downloading David Lorenz light pollution heatmaps...")
        
        base_url = "https://djlorenz.github.io/astronomy/"
        
        # Try different years and versions
        map_urls = [
            # 2024 maps (newest)
            "lp2024/world2024B.png",        # World map without borders - pure heatmap
            "lp2024/world2024B_low3.png",   # Lower resolution version
            
            # 2020 maps (backup)
            "lp2020/world2020B.png",
            "lp2020/world2020B_low3.png",
            
            # 2016 maps (backup)
            "lp2016/world2016B.png",
            "lp2016/world2016B_low3.png"
        ]
        
        downloaded_files = []
        
        for map_path in map_urls:
            url = base_url + map_path
            print(f"\nTrying: {url}")
            result = self.download_file(url)
            if result:
                downloaded_files.append(result)
                # Stop after first successful download for now
                break
        
        return downloaded_files

def main():
    print("Light Pollution Heatmap Data Downloader")
    print("=" * 50)
    
    downloader = HeatmapDownloader()
    
    # Download pure light pollution heatmaps
    results = downloader.download_lorenz_heatmaps()
    
    if results:
        print(f"\n✅ Successfully downloaded {len(results)} heatmap files:")
        for result in results:
            print(f"  - {result}")
        
        print(f"\nThese are pure light pollution heatmaps showing only artificial light sources!")
        print("Perfect for creating emissive textures with black backgrounds.")
        return results[0]  # Return the first downloaded file
    else:
        print("\n❌ Could not download heatmap data")
        return None

if __name__ == "__main__":
    main()