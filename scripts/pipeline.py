import json
import re

# Load original ar.json
with open('lang/ar.json', 'r', encoding='utf-8') as f:
    ar_orig = json.load(f)

print(f"Total keys in ar.json: {len(ar_orig)}")
