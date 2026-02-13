import json

with open('C:/Users/Tomi/.openclaw/workspace/vote-with-your-dollar/data/parent-companies.json', encoding='utf-8') as f:
    companies = json.load(f)["companies"]

# Check what "frito lay" matches
target = 'fritolay'
for c in companies:
    for b in c.get('brands', []):
        bclean = b.lower().replace('-','').replace(' ','').replace("'",'')
        if target in bclean or bclean in target:
            print(f"MATCH: '{b}' -> {c['name']} (cleaned: '{bclean}')")

print()
# Check what "sun chips" matches  
target2 = 'sunchips'
for c in companies:
    for b in c.get('brands', []):
        bclean = b.lower().replace('-','').replace(' ','').replace("'",'')
        if target2 in bclean or bclean in target2:
            print(f"MATCH: '{b}' -> {c['name']} (cleaned: '{bclean}')")

print()
# Check what "lay" or "lays" matches
target3 = 'lays'
for c in companies:
    for b in c.get('brands', []):
        bclean = b.lower().replace('-','').replace(' ','').replace("'",'')
        if target3 in bclean or bclean in target3:
            print(f"MATCH: '{b}' -> {c['name']} (cleaned: '{bclean}')")
