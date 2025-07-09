#!/usr/bin/env python3
"""
Download proper equirectangular night lights texture
"""

import os
import sys
import requests
from urllib.parse import urljoin
from pathlib import Path

class EquirectangularTextureDownloader:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        self.download_dir = Path("equirectangular_textures")
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
    
    def download_solar_system_scope_texture(self):
        """Download from Solar System Scope"""
        print("Downloading from Solar System Scope...")
        
        # Try both resolutions
        urls = [
            "https://www.solarsystemscope.com/textures/download/8k_earth_nightmap.jpg",
            "https://www.solarsystemscope.com/textures/download/2k_earth_nightmap.jpg"
        ]
        
        for url in urls:
            print(f"Attempting: {url}")
            result = self.download_file(url)
            if result:
                return result
        
        return None
    
    def download_planet_pixel_emporium_texture(self):
        """Download from Planet Pixel Emporium (if accessible)"""
        print("Checking Planet Pixel Emporium...")
        
        # These are potential URLs based on typical patterns
        base_url = "https://planetpixelemporium.com/"
        possible_paths = [
            "textures/earthlights2k.jpg",
            "textures/earthlights1k.jpg", 
            "earth/earthlights2k.jpg",
            "earth/earthlights1k.jpg"
        ]
        
        for path in possible_paths:
            url = base_url + path
            print(f"Trying: {url}")
            result = self.download_file(url)
            if result:
                return result
        
        return None

def main():
    print("Equirectangular Night Lights Texture Downloader")
    print("=" * 60)
    
    downloader = EquirectangularTextureDownloader()
    
    # Try Solar System Scope first (most likely to work)
    result = downloader.download_solar_system_scope_texture()
    
    if not result:
        print("\nTrying Planet Pixel Emporium...")
        result = downloader.download_planet_pixel_emporium_texture()
    
    if result:
        print(f"\n✅ Successfully downloaded equirectangular night lights texture!")
        print(f"File: {result}")
        print(f"This is a proper flat equirectangular projection for globe texturing.")
        return result
    else:
        print("\n❌ Could not download equirectangular texture from available sources.")
        print("You may need to visit the websites manually and download:")
        print("- https://www.solarsystemscope.com/textures/ (Earth night map)")
        print("- https://planetpixelemporium.com/earth8081.html (City lights map)")
        return None

if __name__ == "__main__":
    main()