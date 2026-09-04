import json
import re

with open('lang/ar.json', 'r', encoding='utf-8') as f:
    ar = json.load(f)

print(f"Total keys in ar.json: {len(ar)}")

# Let's inspect groups of keys
keys = list(ar.keys())
print("First 20 items:")
for k in keys[:20]:
    print(f"  {k} => {ar[k]}")
