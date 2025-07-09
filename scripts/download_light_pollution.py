#!/usr/bin/env python3
"""
Light Pollution Data Downloader
Downloads light pollution data from various public sources
"""

import os
import sys
import requests
import re
from urllib.parse import urljoin, urlparse
from pathlib import Path

class LightPollutionDownloader:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        self.download_dir = Path("light_pollution_data")
        self.download_dir.mkdir(exist_ok=True)
        
    def try_lightpollutionmap_info(self):
        """
        Try to download from lightpollutionmap.info
        """
        print("Trying lightpollutionmap.info...")
        
        # Check their help page for download links
        help_url = "https://www.lightpollutionmap.info/help.html"
        
        try:
            response = self.session.get(help_url)
            if response.status_code == 200:
                content = response.text
                
                # Look for download links in the help content
                patterns = [
                    r'href="([^"]*\.tif)"',
                    r'href="([^"]*\.geotiff)"',
                    r'href="([^"]*download[^"]*)"'
                ]
                
                links = []
                for pattern in patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    links.extend(matches)
                
                # Convert relative URLs to absolute
                absolute_links = []
                for link in links:
                    if link.startswith('http'):
                        absolute_links.append(link)
                    else:
                        absolute_links.append(urljoin(help_url, link))
                
                return absolute_links
                
        except Exception as e:
            print(f"Error accessing lightpollutionmap.info: {e}")
            
        return []
    
    def try_dj_lorenz_atlas(self):
        """
        Try to download from DJ Lorenz's Light Pollution Atlas 2016
        """
        print("Trying DJ Lorenz's Light Pollution Atlas 2016...")
        
        base_urls = [
            "https://djlorenz.github.io/astronomy/lp2016/",
            "https://djlorenz.github.io/astronomy/lp/"
        ]
        
        all_links = []
        
        for base_url in base_urls:
            try:
                response = self.session.get(base_url)
                if response.status_code == 200:
                    content = response.text
                    
                    # Look for download links
                    patterns = [
                        r'href="([^"]*\.tif)"',
                        r'href="([^"]*\.zip)"',
                        r'href="([^"]*world[^"]*)"',
                        r'href="([^"]*atlas[^"]*)"'
                    ]
                    
                    for pattern in patterns:
                        matches = re.findall(pattern, content, re.IGNORECASE)
                        for match in matches:
                            if match.startswith('http'):
                                all_links.append(match)
                            else:
                                all_links.append(urljoin(base_url, match))
                                
            except Exception as e:
                print(f"Error accessing {base_url}: {e}")
                continue
                
        return all_links
    
    def try_simple_viirs_sources(self):
        """
        Try some simple direct VIIRS data sources
        """
        print("Trying simple VIIRS data sources...")
        
        # Some potential direct access URLs based on common patterns
        test_urls = [
            "https://eogdata.mines.edu/nighttime_light/monthly/v10/2023/",
            "https://eogdata.mines.edu/nighttime_light/annual/v20/",
            "https://ngdc.noaa.gov/eog/data/web_data/v4composites/",
            "https://www.ngdc.noaa.gov/eog/dmsp/downloadV4composites.html"
        ]
        
        found_links = []
        
        for url in test_urls:
            try:
                response = self.session.get(url)
                if response.status_code == 200:
                    content = response.text
                    
                    # Look for .tif files
                    tif_pattern = r'href="([^"]*\.tif(?:\.gz)?)"'
                    matches = re.findall(tif_pattern, content, re.IGNORECASE)
                    
                    for match in matches:
                        if match.startswith('http'):
                            found_links.append(match)
                        else:
                            found_links.append(urljoin(url, match))
                            
            except Exception as e:
                print(f"Could not access {url}: {e}")
                continue
        
        return found_links
    
    def try_nasa_sample_data(self):
        """
        Try to find NASA sample or demo data
        """
        print("Looking for NASA sample data...")
        
        # NASA Earth Observatory and other potential sources
        sample_urls = [
            "https://earthobservatory.nasa.gov/",
            "https://lance.modaps.eosdis.nasa.gov/",
            "https://worldview.earthdata.nasa.gov/"
        ]
        
        # This is more for exploration - typically NASA requires registration
        # but might have some sample files
        
        return []
    
    def download_file(self, url, filename=None):
        """
        Download a single file from URL
        """
        if not filename:
            filename = Path(urlparse(url).path).name
            if not filename or filename == '/':
                filename = "light_pollution_data.tif"
            
        filepath = self.download_dir / filename
        
        if filepath.exists():
            print(f"File already exists: {filepath}")
            return filepath
            
        print(f"Downloading: {url}")
        print(f"To: {filepath}")
        
        try:
            response = self.session.get(url, stream=True, timeout=30)
            
            # Check if we're being redirected to a login page
            if 'login' in response.url.lower() or 'auth' in response.url.lower():
                print("Redirected to login page - registration required")
                return None
                
            response.raise_for_status()
            
            # Check content type
            content_type = response.headers.get('content-type', '').lower()
            if 'text/html' in content_type and filepath.suffix in ['.tif', '.tiff']:
                print("Got HTML instead of GeoTIFF - likely need authentication")
                return None
            
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
    
    def create_sample_texture(self):
        """
        Create a sample light pollution texture for testing
        """
        print("Creating sample light pollution texture...")
        
        try:
            # Try to create a simple sample using matplotlib
            import numpy as np
            from PIL import Image
            
            # Create a 2000x1000 image (2:1 aspect ratio for world map)
            width, height = 2000, 1000
            
            # Create a simple pattern that mimics light pollution
            # Higher intensity around populated areas
            data = np.zeros((height, width), dtype=np.uint8)
            
            # Add some "cities" with light pollution
            cities = [
                (int(width * 0.2), int(height * 0.4)),   # North America East Coast
                (int(width * 0.25), int(height * 0.6)),  # South America
                (int(width * 0.5), int(height * 0.3)),   # Europe
                (int(width * 0.55), int(height * 0.6)),  # Africa
                (int(width * 0.7), int(height * 0.3)),   # Asia
                (int(width * 0.85), int(height * 0.7)),  # Australia
            ]
            
            # Create circular light pollution areas
            y, x = np.ogrid[:height, :width]
            for cx, cy in cities:
                # Main city area
                mask = (x - cx)**2 + (y - cy)**2 < 50**2
                data[mask] = 255
                
                # Surrounding area with falloff
                mask2 = (x - cx)**2 + (y - cy)**2 < 100**2
                distance = np.sqrt((x - cx)**2 + (y - cy)**2)
                falloff = np.clip(255 * (1 - distance / 100), 0, 255)
                data = np.maximum(data, falloff.astype(np.uint8))
            
            # Convert to PIL Image and save
            img = Image.fromarray(data, mode='L')
            sample_path = self.download_dir / "sample_light_pollution.png"
            img.save(sample_path)
            
            print(f"Sample texture created: {sample_path}")
            return sample_path
            
        except ImportError:
            print("NumPy/PIL not available for creating sample texture")
            return None
        except Exception as e:
            print(f"Error creating sample texture: {e}")
            return None

def main():
    print("Light Pollution Data Downloader")
    print("=" * 50)
    
    downloader = LightPollutionDownloader()
    
    # Try different sources in order of preference
    all_sources = [
        downloader.try_dj_lorenz_atlas,
        downloader.try_lightpollutionmap_info,
        downloader.try_simple_viirs_sources,
    ]
    
    downloaded_file = None
    
    for source_func in all_sources:
        print(f"\nTrying {source_func.__name__}...")
        try:
            links = source_func()
            
            if links:
                print(f"Found {len(links)} potential links:")
                for i, link in enumerate(links[:5]):  # Show first 5
                    print(f"  {i+1}. {link}")
                
                # Try to download the first promising link
                for link in links:
                    if any(keyword in link.lower() for keyword in ['world', 'global', 'atlas', 'composite']):
                        print(f"\nTrying to download: {link}")
                        downloaded_file = downloader.download_file(link)
                        if downloaded_file:
                            break
                
                if downloaded_file:
                    break
                    
        except Exception as e:
            print(f"Error with {source_func.__name__}: {e}")
            continue
    
    if not downloaded_file:
        print("\nNo light pollution data could be downloaded.")
        print("This likely means the data requires registration or is not publicly accessible.")
        print("\nCreating a sample texture for testing...")
        downloaded_file = downloader.create_sample_texture()
    
    if downloaded_file:
        print(f"\nSuccess! Light pollution data available at: {downloaded_file}")
        return downloaded_file
    else:
        print("\nFailed to obtain any light pollution data.")
        return None

if __name__ == "__main__":
    main()