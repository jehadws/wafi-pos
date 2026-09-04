import json
import re

# Load original ar.json
with open('lang/ar.json', 'r', encoding='utf-8') as f:
    ar_orig = json.load(f)

# Placeholder extraction helper
ph_regex = re.compile(r'\{[^{}]+\}|%[0-9]*\.?[0-9]*[sdbf]')

def get_placeholders(s):
    return ph_regex.findall(s)

print(f"Loaded {len(ar_orig)} keys from ar.json")
