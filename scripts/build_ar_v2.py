import json
import re

with open('lang/ar.json', 'r', encoding='utf-8') as f:
    ar_orig = json.load(f)

print(f"Total keys to process: {len(ar_orig)}")
