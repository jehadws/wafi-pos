import json

with open('scripts/all_changes.json', 'r', encoding='utf-8') as f:
    changes = json.load(f)

print(f"Total changes recorded: {len(changes)}")
# Generate markdown table
md_rows = ["| Key | Old Translation | New Translation | Reason for Change |", "| :--- | :--- | :--- | :--- |"]
for c in changes:
    k = c['key'].replace('|', '\\|')
    old = c['old'].replace('|', '\\|').replace('\n', ' ')
    new = c['new'].replace('|', '\\|').replace('\n', ' ')
    reason = c['reason'].replace('|', '\\|')
    md_rows.append(f"| `{k}` | {old} | {new} | {reason} |")

with open('scripts/changes_table.md', 'w', encoding='utf-8') as f:
    f.write('\n'.join(md_rows))

print("Saved table to scripts/changes_table.md")
