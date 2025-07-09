#!/usr/bin/env python3
"""
NASA Black Marble Nightlights Downloader
Downloads nighttime lights data from NASA SVS (Scientific Visualization Studio)
"""

import os
import sys
import requests
from urllib.parse import urljoin
from pathlib import Path

class NASANightlightsDownloader:
    def __init__(self):
        self.base_url = "https://svs.gsfc.nasa.gov"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        self.download_dir = Path("nasa_nightlights")
        self.download_dir.mkdir(exist_ok=True)
        
    def download_file(self, url, filename=None):
        """
        Download a single file from URL
        """
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
    
    def download_sample_frames(self):
        """
        Download a few sample frames from the 2048x1024 frame set
        """
        print("Downloading sample frames from NASA Black Marble dataset...")
        
        # Base URL for 2048x1024 frames (perfect 2:1 aspect ratio)
        frame_base = "/vis/a000000/a005400/a005477/frames/2048x1024_2x1_30p/nightlights_day-night_ksc_sos_01/"
        
        # Try to download a few different frames to see the night lights
        sample_frames = [
            "nightlights_day-night_ksc_sos_01.00001.png",  # First frame
            "nightlights_day-night_ksc_sos_01.00900.png",  # Middle frame
            "nightlights_day-night_ksc_sos_01.01800.png",  # Last frame
            "nightlights_day-night_ksc_sos_01.00450.png",  # Quarter frame
            "nightlights_day-night_ksc_sos_01.01350.png",  # Three-quarter frame
        ]
        
        downloaded_files = []
        
        for frame in sample_frames:
            frame_url = self.base_url + frame_base + frame
            result = self.download_file(frame_url, frame)
            if result:
                downloaded_files.append(result)
                # For our purposes, we might only need one good frame
                # Let's stop after the first successful download
                print(f"Successfully downloaded frame: {result}")
                break
        
        return downloaded_files
    
    def download_high_res_frames(self):
        """
        Download sample frames from the 4096x2048 frame set (higher resolution)
        """
        print("Downloading high-resolution sample frames...")
        
        # Base URL for 4096x2048 frames 
        frame_base = "/vis/a000000/a005400/a005477/frames/4096x2048_2x1_30p/nightlights_day-night_ksc_sos_01_exr/"
        
        # Note: These are EXR format files, which might need special handling
        sample_frames = [
            "nightlights_day-night_ksc_sos_01_exr.00001.exr",
            "nightlights_day-night_ksc_sos_01_exr.00900.exr",
        ]
        
        downloaded_files = []
        
        for frame in sample_frames:
            frame_url = self.base_url + frame_base + frame
            result = self.download_file(frame_url, frame)
            if result:
                downloaded_files.append(result)
                break  # One successful download is enough for testing
        
        return downloaded_files
    
    def download_still_images(self):
        """
        Download the static still images
        """
        print("Downloading static still images...")
        
        still_images = [
            "/vis/a000000/a005400/a005477/day-night_KSC_SOS_stills.00297.png",
            "/vis/a000000/a005400/a005477/day-night_KSC_SOS_stills.00718.png"
        ]
        
        downloaded_files = []
        
        for image_path in still_images:
            image_url = self.base_url + image_path
            filename = Path(image_path).name
            result = self.download_file(image_url, filename)
            if result:
                downloaded_files.append(result)
        
        return downloaded_files

def main():
    print("NASA Black Marble Nightlights Downloader")
    print("=" * 50)
    
    downloader = NASANightlightsDownloader()
    
    # Try to download sample frames first (2048x1024 is perfect for our needs)
    print("\n1. Trying 2048x1024 frames (perfect for globe texture)...")
    frames_2k = downloader.download_sample_frames()
    
    if not frames_2k:
        print("\n2. Trying static still images...")
        stills = downloader.download_still_images()
        
        if not stills:
            print("\n3. Trying high-resolution EXR frames...")
            frames_4k = downloader.download_high_res_frames()
            
            if not frames_4k:
                print("\nNo files could be downloaded from NASA source.")
                return None
            else:
                print(f"\nDownloaded {len(frames_4k)} high-resolution files")
                return frames_4k[0]
        else:
            print(f"\nDownloaded {len(stills)} still images")
            return stills[0]
    else:
        print(f"\nDownloaded {len(frames_2k)} frame files")
        return frames_2k[0]

if __name__ == "__main__":
    result = main()
    if result:
        print(f"\nSuccess! Downloaded NASA nightlights data to: {result}")
        print("This file can be used as a light pollution texture for the globe.")
    else:
        print("\nFailed to download NASA nightlights data.")