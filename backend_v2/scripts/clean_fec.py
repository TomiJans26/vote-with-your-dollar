import json

with open("data/fec-pac-names.json", encoding="utf-8") as f:
    data = json.load(f)

remove_pairs = {
    "chevron": "ARKHAN",
    "fox-corp": "CAPE FOX",
    "stellantis": "MINORITY DEALERS",
    "progressive": "SAN ANTONIO",
    "shell": "PEANUT",
}

cleaned = []
for p in data["pacs"]:
    cid = p["companyId"]
    names = p.get("pacNames", [])
    pac_name = names[0].upper() if names else ""
    if cid in remove_pairs and remove_pairs[cid] in pac_name:
        print(f"Removed: {cid} -> {p['pacNames'][0]}")
        continue
    cleaned.append(p)

data["pacs"] = cleaned
with open("data/fec-pac-names.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print(f"Final total: {len(cleaned)} PAC entries")
