import json
import re

def process_file():
    with open('lang/ar.json', 'r', encoding='utf-8') as f:
        original = json.load(f)

    # Let's inspect keys and build comprehensive mapping
    print(f"Total keys in ar.json: {len(original)}")

if __name__ == '__main__':
    process_file()
