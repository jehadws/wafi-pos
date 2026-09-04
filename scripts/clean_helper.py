import json
import re

def clean_html_and_placeholders(key, text):
    # Fix broken HTML entities from machine translation
    text = text.replace("&mdash;", "—")
    text = text.replace("و [مدش] ؛", "—")
    text = text.replace("و [مدش]؛", "—")
    text = text.replace("[مدش]", "—")
    text = text.replace("&nbsp;", " ")
    text = text.replace("&quot;", '"')
    text = text.replace("&amp;", "&")
    
    # Fix broken %s in arabic
    text = text.replace("٪س", "%s")
    text = text.replace("٪ س", "%s")
    text = text.replace("٪s", "%s")
    text = text.replace("٪ s ", " %s ")
    
    # Fix translated placeholders
    ph_map = {
        "{إدخالات}": "{entries}",
        "{الرصيد}": "{balance}",
        "{يوم}": "{day}",
        "{التاريخ}": "{date}",
        "{الأيام}": "{days}",
        "{الوقت}": "{time}",
        "{الاسم}": "{name}",
        "{المبلغ}": "{amount}",
        "{الرمز}": "{code}",
        "{المعرف}": "{id}",
        "{العدد}": "{count}"
    }
    for ar_ph, en_ph in ph_map.items():
        text = text.replace(ar_ph, en_ph)
        
    # Ensure all placeholders from key exist in text
    key_phs = re.findall(r'\{[^{}]+\}|%s', key)
    for ph in key_phs:
        if ph not in text:
            # If a placeholder was missing or altered, we will handle it
            pass

    return text

# Let's test on ar.json
if __name__ == '__main__':
    with open('lang/ar.json', 'r', encoding='utf-8') as f:
        ar = json.load(f)
    print("Testing clean helper...")
