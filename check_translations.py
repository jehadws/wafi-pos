#!/usr/bin/env python3
"""
Translation Checker Script
Scans components for hardcoded text and checks if translations exist in ar.json
"""

import json
import re
import os
from pathlib import Path
from typing import Dict, List, Set, Tuple

# Load ar.json
LANG_FILE = Path(__file__).parent / "lang" / "ar.json"
SRC_DIR = Path(__file__).parent / "resources" / "js"

def load_translations() -> Dict[str, str]:
    """Load translations from ar.json"""
    with open(LANG_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def extract_text_from_file(file_path: Path) -> List[Tuple[str, int]]:
    """
    Extract hardcoded text from a file
    Returns list of (text, line_number) tuples
    """
    content = file_path.read_text(encoding='utf-8')
    lines = content.split('\n')
    text_strings = []
    
    # Regex patterns to find text strings
    # Match strings in JSX/TSX that look like user-facing text
    # Exclude: import statements, type definitions, comments
    patterns = [
        r'["\']([A-Z][^"\'<>]{3,}[^\\]*(?:\\n|\\t)?[^"\'\\]*)["\']',  # Strings starting with capital letter (likely UI text)
    ]
    
    for line_num, line in enumerate(lines, 1):
        # Skip certain lines
        if any(skip in line for skip in ['import', 'export', 'interface', 'type', 'const', 'let', 'var', '//']):
            continue
            
        for pattern in patterns:
            matches = re.finditer(pattern, line)
            for match in matches:
                text = match.group(1)
                # Filter out technical strings
                if (len(text) > 3 and 
                    not text.startswith('http') and 
                    not text.startswith('/') and
                    not re.match(r'^[A-Z_]+$', text) and
                    not re.match(r'^\{', text) and
                    ':' not in text[:3] and
                    not text.isdigit()):
                    text_strings.append((text, line_num))
    
    return text_strings

def check_translations(translations: Dict[str, str], component_path: Path) -> List[Tuple[str, int, bool]]:
    """
    Check if text strings have translations
    Returns list of (text, line_number, exists) tuples
    """
    text_strings = extract_text_from_file(component_path)
    results = []
    
    for text, line_num in text_strings:
        exists = text in translations
        results.append((text, line_num, exists))
    
    return results

def scan_component(file_path: Path) -> None:
    """Scan a single component file"""
    translations = load_translations()
    results = check_translations(translations, file_path)
    
    missing = [r for r in results if not r[2]]
    existing = [r for r in results if r[2]]
    
    if missing:
        print(f"\n{'='*60}")
        print(f"FILE: {file_path.relative_to(Path.cwd())}")
        print(f"{'='*60}")
        print(f"\n❌ MISSING TRANSLATIONS ({len(missing)}):")
        for text, line_num, _ in missing:
            print(f"  Line {line_num}: \"{text}\"")
    
    if existing:
        print(f"\n✅ FOUND TRANSLATIONS ({len(existing)}):")
        for text, line_num, _ in existing[:10]:  # Show first 10
            print(f"  Line {line_num}: \"{text}\"")
        if len(existing) > 10:
            print(f"  ... and {len(existing) - 10} more")

def main():
    import sys
    
    if len(sys.argv) > 1:
        # Check specific file
        file_path = Path(sys.argv[1])
        if file_path.exists():
            scan_component(file_path)
        else:
            print(f"File not found: {file_path}")
    else:
        # Check all tsx files in resources/js
        print("Scanning all TSX files in resources/js...")
        print("This may take a moment...\n")
        
        tsx_files = list(SRC_DIR.rglob("*.tsx"))
        
        for file_path in tsx_files:
            scan_component(file_path)
        
        print(f"\n{'='*60}")
        print(f"Scanned {len(tsx_files)} files")
        print(f"{'='*60}")

if __name__ == "__main__":
    main()