import json
import re
import os

def load_data():
    with open('lang/ar.json', 'r', encoding='utf-8') as f:
        ar = json.load(f)
    with open('lang/en.json', 'r', encoding='utf-8') as f:
        en = json.load(f)
    return ar, en

if __name__ == '__main__':
    ar, en = load_data()
    print(f"Loaded {len(ar)} keys from ar.json and {len(en)} keys from en.json")
