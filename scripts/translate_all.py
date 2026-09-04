import json
import re

# Load original
with open('lang/ar.json', 'r', encoding='utf-8') as f:
    ar_orig = json.load(f)

print("Writing translation builder...")
