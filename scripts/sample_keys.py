import json

with open('lang/ar.json', 'r', encoding='utf-8') as f:
    ar = json.load(f)

print(f"Total keys: {len(ar)}")

# Print out some slices to understand the range of strings
all_keys = list(ar.keys())
for i in range(0, len(all_keys), 200):
    chunk = all_keys[i:i+5]
    print(f"\n--- Index {i} ---")
    for k in chunk:
        print(f"  [{k}] => [{ar[k]}]")
