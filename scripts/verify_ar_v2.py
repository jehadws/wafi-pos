import json
import re

with open('lang/ar_v2.json', 'r', encoding='utf-8') as f:
    ar2 = json.load(f)

check_words = ['معاق', 'تزوج', 'جلس', 'الشمس', 'اللجان', 'ينعش', 'مدش', '٪', '{إدخالات}', '{الرصيد}', 'الذمم المدينة', 'الذمم الدائنة', 'المرشحات']
for w in check_words:
    matches = [(k, v) for k, v in ar2.items() if w in v]
    if matches:
        print(f'Remaining with "{w}": {len(matches)}')
        for k, v in matches[:3]:
            print(f'   [{k}] -> [{v}]')
    else:
        print(f'Clean: No "{w}" found.')

# Check placeholders
mismatches = 0
for k, v in ar2.items():
    k_phs = re.findall(r'\{[^{}]+\}|%s', k)
    v_phs = re.findall(r'\{[^{}]+\}|%s', v)
    if set(k_phs) != set(v_phs):
        print(f"Placeholder mismatch: [{k}] => [{v}] | {k_phs} vs {v_phs}")
        mismatches += 1

print(f"Total placeholder mismatches in ar_v2: {mismatches}")
