import json
d = json.load(open("data/parent-companies.json", encoding="utf-8"))
for c in d["companies"]:
    name = c["name"].lower()
    if "philip" in name or "altria" in name or "tobacco" in name or "bat" in name:
        print(f"{c['name']} ({c['id']}): {c['brands']}")
