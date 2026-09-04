import json
import os

with open('lang/ar.json', 'r', encoding='utf-8') as f:
    ar = json.load(f)

os.makedirs('scripts/dict_parts', exist_ok=True)
keys = list(ar.keys())

splits = [0, 600, 1200, 1800, 2400, len(keys)]
for i in range(len(splits) - 1):
    start = splits[i]
    end = splits[i+1]
    part_keys = keys[start:end]
    part_dict = {k: ar[k] for k in part_keys}
    with open(f'scripts/dict_parts/raw_part{i+1}.json', 'w', encoding='utf-8') as f:
        json.dump(part_dict, f, ensure_ascii=False, indent=2)
    print(f"Part {i+1}: {len(part_keys)} keys ({start} to {end})")
