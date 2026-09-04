import json
import re

def main():
    with open('lang/ar.json', 'r', encoding='utf-8') as f:
        ar_orig = json.load(f)

    # Let's inspect all keys and build a clean dictionary and transformation engine
    print(f"Loaded {len(ar_orig)} keys from ar.json")

if __name__ == '__main__':
    main()
