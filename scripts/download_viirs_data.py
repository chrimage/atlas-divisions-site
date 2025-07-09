#!/usr/bin/env python3
"""
VIIRS Nighttime Lights Data Downloader
Downloads NASA VIIRS annual composite nighttime lights data from Earth Observation Group
"""

import os
import sys
import requests
import re
from urllib.parse import urljoin, urlparse
from pathlib import Path

class VIIRSDownloader:
    def __init__(self):
        self.base_url = "https://eogdata.mines.edu"
        self.session = requests.Session()
        self.download_dir = Path("viirs_data")
        self.download_dir.mkdir(exist_ok=True)
        
    def find_download_links(self, year=None):
        """
        Find available VIIRS annual composite download links
        """
        print("Searching for VIIRS annual composite data...")
        
        # Try the main VIIRS nighttime lights page
        response = self.session.get(f"{self.base_url}/products/vnl/")
        if response.status_code != 200:
            print(f"Failed to access main page: {response.status_code}")
            return []
            
        # Look for annual composite links in the page
        content = response.text
        
        # Common patterns for VIIRS annual data links
        patterns = [
            r'href="([^"]*annual[^"]*\.tif)"',
            r'href="([^"]*VNL[^"]*annual[^"]*\.tif)"',
            r'href="([^"]*vnl[^"]*annual[^"]*\.tif)"',
            r'href="([^"]*SVDNB[^"]*annual[^"]*\.tif)"'
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
                absolute_links.append(urljoin(response.url, link))
        
        # Filter by year if specified
        if year:
            filtered_links = [link for link in absolute_links if str(year) in link]
            if filtered_links:
                return filtered_links
                
        return absolute_links
    
    def search_download_pages(self):
        """
        Search for download pages and annual data
        """
        print("Searching for download pages...")
        
        # Common download page paths
        download_paths = [
            "/products/vnl/",
            "/download_ut_mos.html",
            "/download_viirs_fire.html"
        ]
        
        all_links = []
        
        for path in download_paths:
            try:
                url = f"{self.base_url}{path}"
                print(f"Checking: {url}")
                response = self.session.get(url)
                
                if response.status_code == 200:
                    content = response.text
                    
                    # Look for any .tif files
                    tif_pattern = r'href="([^"]*\.tif)"'
                    matches = re.findall(tif_pattern, content, re.IGNORECASE)
                    
                    for match in matches:
                        if match.startswith('http'):
                            all_links.append(match)
                        else:
                            all_links.append(urljoin(url, match))
                            
            except Exception as e:
                print(f"Error checking {path}: {e}")
                continue
        
        return all_links
    
    def download_file(self, url, filename=None):
        """
        Download a single file from URL
        """
        if not filename:
            filename = Path(urlparse(url).path).name
            
        filepath = self.download_dir / filename
        
        if filepath.exists():
            print(f"File already exists: {filepath}")
            return filepath
            
        print(f"Downloading: {url}")
        print(f"To: {filepath}")
        
        try:
            response = self.session.get(url, stream=True)
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
            return filepath
            
        except Exception as e:
            print(f"Download failed: {e}")
            if filepath.exists():
                filepath.unlink()
            return None
    
    def find_sample_data(self):
        """
        Try to find any available VIIRS sample or demo data
        """
        print("\nLooking for sample/demo VIIRS data...")
        
        # Check for any publicly available VIIRS data
        sample_urls = [
            "https://eogdata.mines.edu/products/vnl/",
            "https://payneinstitute.mines.edu/eog/nighttime-lights/"
        ]
        
        for url in sample_urls:
            try:
                response = self.session.get(url)
                if response.status_code == 200:
                    # Look for any direct download links
                    content = response.text
                    
                    # Search for sample data patterns
                    patterns = [
                        r'href="([^"]*sample[^"]*\.tif)"',
                        r'href="([^"]*demo[^"]*\.tif)"',
                        r'href="([^"]*example[^"]*\.tif)"'
                    ]
                    
                    for pattern in patterns:
                        matches = re.findall(pattern, content, re.IGNORECASE)
                        if matches:
                            return [urljoin(url, match) for match in matches]
                            
            except Exception as e:
                print(f"Error checking {url}: {e}")
                continue
        
        return []

def main():
    print("VIIRS Nighttime Lights Data Downloader")
    print("=" * 50)
    
    downloader = VIIRSDownloader()
    
    # First, try to find any available data
    print("Searching for available VIIRS data...")
    
    # Try to find download links
    links = downloader.find_download_links()
    
    if not links:
        print("No direct links found, searching download pages...")
        links = downloader.search_download_pages()
    
    if not links:
        print("No download links found, looking for sample data...")
        links = downloader.find_sample_data()
    
    if links:
        print(f"\nFound {len(links)} potential download links:")
        for i, link in enumerate(links[:10]):  # Show first 10
            print(f"{i+1}. {link}")
        
        if len(links) > 10:
            print(f"... and {len(links) - 10} more")
        
        # Try to download the first available file
        print(f"\nAttempting to download first file...")
        result = downloader.download_file(links[0])
        
        if result:
            print(f"\nSuccess! Downloaded to: {result}")
            print(f"File size: {result.stat().st_size / 1024 / 1024:.1f} MB")
            return result
        else:
            print("Download failed. You may need to register at eogdata.mines.edu")
    else:
        print("\nNo VIIRS data links found.")
        print("This likely means you need to register at https://eogdata.mines.edu")
        print("and access the data through their authenticated portal.")
        
    return None

if __name__ == "__main__":
    main()