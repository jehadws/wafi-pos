import json
import re
import os

def build_translations():
    with open('lang/ar.json', 'r', encoding='utf-8') as f:
        ar_orig = json.load(f)
    
    # We will build a comprehensive translation engine
    # Let's inspect all keys and craft precise translations
    
    # Base dictionary for exact and common phrases
    return ar_orig

if __name__ == '__main__':
    ar = build_translations()
    print(f"Total keys: {len(ar)}")
