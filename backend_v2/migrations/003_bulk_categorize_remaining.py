# Migration 003: Bulk categorize remaining brands by keyword matching and company context
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sqlalchemy import text
from database import SessionLocal

# Keyword-based rules: if brand name contains keyword, assign category
KEYWORD_RULES = [
    # Beverages
    ("beer", "beer"), ("ale", "beer"), ("lager", "beer"), ("brewing", "beer"),
    ("wine", "wine"), ("spirits", "spirits"), ("vodka", "spirits"), ("whiskey", "spirits"),
    ("bourbon", "spirits"), ("gin", "spirits"), ("rum", "spirits"), ("tequila", "spirits"),
    ("seltzer", "beer"), ("hard", "beer"),
    ("coffee", "coffee"), ("tea", "tea"), ("juice", "juice"), ("water", "water"),
    ("soda", "soda"), ("energy", "energy-drinks"),
    # Food
    ("yogurt", "yogurt"), ("cheese", "cheese"), ("milk", "dairy-milk"),
    ("cereal", "cereal"), ("oat", "oatmeal"), ("granola", "granola"),
    ("chip", "chips"), ("pretzel", "pretzels"), ("popcorn", "popcorn"),
    ("cookie", "cookies"), ("cracker", "crackers"), ("biscuit", "crackers"),
    ("chocolate", "chocolate"), ("candy", "candy"), ("gum", "candy"),
    ("soup", "canned-soup"), ("sauce", "condiments-sauces"), ("salsa", "salsa"),
    ("bread", "bread"), ("bagel", "bagels"), ("tortilla", "tortillas"),
    ("frozen", "frozen-meals"), ("pizza", "frozen-pizza"),
    ("ice cream", "ice-cream"),
    ("dog food", "dog-food"), ("cat food", "cat-food"), ("pet", "pet-care"),
    ("baby", "baby-care"), ("diaper", "diapers"), ("formula", "baby-formula"),
    ("vitamin", "vitamins"), ("supplement", "supplements"),
    ("shampoo", "shampoo"), ("soap", "soap"), ("lotion", "lotion"),
    ("makeup", "makeup"), ("mascara", "mascara"),
    ("detergent", "laundry-detergent"), ("cleaner", "all-purpose-cleaner"),
    ("paper towel", "paper-towels"), ("toilet paper", "toilet-paper"),
    ("tissue", "tissues"), ("battery", "batteries"),
]

# Explicit mapping for remaining brands
EXPLICIT = {
    # AB InBev - all beer
    "10 Barrel": "beer", "Babe Wine": "wine", "Beck's": "beer", "Busch": "beer",
    "Cutwater Spirits": "spirits", "Devils Backbone": "beer", "Elysian": "beer",
    "Goose Island": "beer", "Hoegaarden": "beer", "Landshark": "beer",
    "Leffe": "beer", "Natural Light": "beer", "Negra Modelo": "beer",
    "Nutrl": "beer", "Rolling Rock": "beer", "Shock Top": "beer", "Wicked Weed": "beer",
    # B&G Foods
    "B&M Baked Beans": "canned-beans", "Bear Creek": "canned-soup",
    "Dash (seasoning)": "spices", "Le Sueur": "canned-vegetables",
    "Molly McButter": "condiments-sauces", "Spring Tree": "syrup",
    "Victoria (pasta sauce)": "pasta-sauce", "Wright's": "bbq-sauce",
    # Bayer
    "Bepanthen": "lotion", "Berocca": "vitamins", "Canesten": "otc-medicine",
    "Dr. Scholl's (some markets)": "personal-care", "Elevit": "vitamins",
    "Flintstones Vitamins": "vitamins", "Roundup (Monsanto)": "pest-control",
    # Berkshire
    "Coca-Cola (major stake)": "soda", "Dairy Queen": "ice-cream",
    "Duracell Optimum": "batteries", "Duracell Rechargeable": "batteries",
    "Fruit of the Loom": "clothing-apparel", "Kraft Heinz (major stake)": "cheese",
    "Russell Athletic": "clothing-apparel", "See's Candies": "chocolate",
    # Bob Evans
    "Bob Evans Grocery (refrigerated sides, sausage, mac & cheese)": "sausage",
    # Campbell's
    "Rao's Homemade": "pasta-sauce", "Snack Factory Pretzel Crisps": "pretzels",
    "V8 Splash": "juice",
    # Church & Dwight
    "Hero Cosmetics": "face-wash", "OraJel": "otc-medicine",
    "Waterpik": "toothpaste", "Xtra (laundry)": "laundry-detergent", "Zicam": "otc-medicine",
    # Colgate
    "Fabuloso": "all-purpose-cleaner", "Fleecy": "fabric-softener",
    "Hill's Prescription Diet": "dog-food", "Hill's Science Diet": "dog-food",
    "Murphy Oil Soap": "all-purpose-cleaner", "Soupline": "fabric-softener",
    "Suavitel": "fabric-softener",
    # Abbott
    "EAS": "supplements", "EleCare": "baby-formula",
    "FreeStyle (glucose monitors)": "otc-medicine", "Similac 360 Total Care": "baby-formula",
    # Conagra
    "P.F. Chang's (frozen)": "frozen-meals", "Gardein (plant-based)": "plant-based-meat",
    # Dean Foods
    "DairyPure": "dairy-milk", "TruMoo": "dairy-milk",
    "Friendly's (ice cream)": "ice-cream", "Land O'Lakes (fluid milk)": "dairy-milk",
    "Meadow Gold": "dairy-milk", "Oak Farms": "dairy-milk",
    "Garelick Farms": "dairy-milk", "Tuscan": "dairy-milk",
    # Energizer additional
    "Wet Ones (antibacterial)": "personal-care",
    "Jack Black (grooming)": "moisturizer",
    # Estee Lauder additional
    "Aerin": "perfume", "Kilian": "perfume",
    "Editions de Parfums Frederic Malle": "perfume",
    # Ferrero
    "Ferrero Rocher": "chocolate", "Nutella": "condiments-sauces",
    "Tic Tac": "candy", "Kinder": "chocolate", "Butterfinger (acquired)": "chocolate",
    "Crunch (acquired)": "chocolate", "Baby Ruth": "chocolate",
    "100 Grand": "chocolate",
    # Haleon
    "Advil (some markets)": "pain-relief", "Voltaren": "pain-relief",
    "Otrivin": "otc-medicine",
    # Henkel
    "Persil (Henkel)": "laundry-detergent", "Purex": "laundry-detergent",
    "all (laundry)": "laundry-detergent", "Snuggle": "fabric-softener",
    "Sun (laundry)": "laundry-detergent", "Dial": "soap",
    "Right Guard": "deodorant", "Dry Idea": "deodorant",
    "got2b": "hair-styling", "Schwarzkopf": "shampoo",
    "Loctite": "household-cleaning", "Pritt": "household-cleaning",
    # JBS/Pilgrim's
    "Pilgrim's Pride": "chicken", "Swift": "beef",
    "Primo": "deli-meat", "Seara": "chicken",
    "Just Bare": "chicken", "Gold'n Plump": "chicken",
    # Kellanova
    "RXBAR": "granola-bars", "Pringles (Kellanova)": "chips",
    "Carr's": "crackers",
    # Keurig Dr Pepper
    "Peñafiel": "water", "Cott": "soda",
    "Vita Coco": "water",
    # L'Oreal
    "Valentino Beauty": "makeup", "Shu Uemura": "makeup",
    "Kerastase": "shampoo", "Biolage": "shampoo",
    # Mars additional
    "Cocoavia": "supplements", "KIND Snacks": "granola-bars",
    # McCormick
    "Grill Mates": "spices", "Kitchen Basics": "canned-soup",
    "Club House": "spices",
    # Mondelez
    "Barni": "cookies", "LU": "cookies", "Prince": "cookies",
    "Tiger": "cookies", "Tate's": "cookies",
    "Nilla": "cookies", "Teddy Grahams": "cookies",
    "Good Thins": "crackers",
    # Nestle (more)
    "Nido": "dairy-milk", "Milo": "dairy-milk", "Nestlé Pure Life": "water",
    "Vittel": "water", "Contrex": "water",
    "Aero": "chocolate", "Smarties": "chocolate", "Quality Street": "chocolate",
    "After Eight": "chocolate", "Cailler": "chocolate",
    "Garden Gourmet": "plant-based-meat", "Sweet Earth (plant-based)": "plant-based-meat",
    # PepsiCo
    "Sabritas": "chips", "Gamesa": "cookies", "Matutano": "chips",
    "Walkers": "chips", "Kurkure": "chips",
    # Post Holdings
    "Mom's Best": "cereal", "Barbara's": "cereal",
    "Weetabix (partial)": "cereal",
    # Prestige Consumer
    "Fleet": "otc-medicine", "Nix": "otc-medicine",
    "Boudreaux's Butt Paste": "baby-care",
    # Procter & Gamble (more)
    "Luvs (budget)": "diapers", "Microban": "disinfectant",
    # Reckitt (more)
    "Woolite (fabric)": "laundry-detergent", "Resolve": "laundry-detergent",
    "Spray 'n Wash": "laundry-detergent",
    # Smucker (more)
    "Sahale Snacks": "trail-mix", "Jif Power Ups": "granola-bars",
    # Spectrum Brands
    "GloFish": "pet-care", "Tetra": "pet-care",
    "Marineland": "pet-care", "Nature's Miracle": "pet-care",
    "Dingo": "pet-treats", "DreamBone": "pet-treats",
    "SmartBones": "pet-treats",
    "Black Flag": "pest-control", "Cutter": "pest-control",
    "Spectracide": "pest-control", "Hot Shot": "pest-control",
    "Rejuvenate": "all-purpose-cleaner",
    "George Foreman": "batteries-household", "PowerXL": "batteries-household",
    "Farberware": "batteries-household", "Black & Decker (small appliances)": "batteries-household",
    "Remington (Spectrum)": "razor",
    # TreeHouse Foods
    "Private label products": "condiments-sauces",
    # Tyson (more)
    "Wright Brand": "bacon", "Original Philly": "beef",
}


def run():
    db = SessionLocal()
    try:
        cat_map = {}
        for row in db.execute(text("SELECT id, slug FROM product_categories")).fetchall():
            cat_map[row[1]] = row[0]

        # First apply explicit mappings
        mapped = 0
        for bname, slug in EXPLICIT.items():
            if slug in cat_map:
                result = db.execute(
                    text("UPDATE brands SET category_id = :cid WHERE name = :bname AND category_id IS NULL"),
                    {"cid": cat_map[slug], "bname": bname}
                )
                mapped += result.rowcount
        db.commit()
        print(f"Explicit: mapped {mapped}")

        # Then keyword matching for remaining
        brands = db.execute(text(
            "SELECT b.id, b.name FROM brands b WHERE b.category_id IS NULL"
        )).fetchall()

        kw_mapped = 0
        for bid, bname in brands:
            bname_lower = bname.lower()
            for kw, slug in KEYWORD_RULES:
                if kw in bname_lower and slug in cat_map:
                    db.execute(text("UPDATE brands SET category_id = :cid WHERE id = :bid"),
                              {"cid": cat_map[slug], "bid": bid})
                    kw_mapped += 1
                    break
        db.commit()
        print(f"Keyword: mapped {kw_mapped}")

        # For truly remaining, assign based on company's primary product type
        # Food & Beverage companies -> "snacks" as default, Cleaning -> "cleaning", etc.
        INDUSTRY_DEFAULT_CAT = {
            "food-beverage": "snacks",
            "household-cleaning": "cleaning",
            "personal-care": "personal-care",
            "beauty-cosmetics": "skincare-beauty",
            "health-wellness": "health-wellness",
            "pet-care": "pet",
            "baby-kids": "baby",
            "consumer-conglomerate": "snacks",
        }

        remaining = db.execute(text("""
            SELECT b.id, b.name, i.slug as industry_slug
            FROM brands b
            JOIN companies c ON b.company_id = c.id
            LEFT JOIN industries i ON c.industry_id = i.id
            WHERE b.category_id IS NULL
        """)).fetchall()

        fallback_mapped = 0
        for bid, bname, ind_slug in remaining:
            default_cat = INDUSTRY_DEFAULT_CAT.get(ind_slug)
            if default_cat and default_cat in cat_map:
                db.execute(text("UPDATE brands SET category_id = :cid WHERE id = :bid"),
                          {"cid": cat_map[default_cat], "bid": bid})
                fallback_mapped += 1
        db.commit()
        print(f"Fallback by industry: mapped {fallback_mapped}")

        # Final count
        total = db.execute(text("SELECT COUNT(*) FROM brands")).scalar()
        mapped_total = db.execute(text("SELECT COUNT(*) FROM brands WHERE category_id IS NOT NULL")).scalar()
        unmapped = db.execute(text("SELECT COUNT(*) FROM brands WHERE category_id IS NULL")).scalar()
        print(f"\nFinal: {mapped_total}/{total} mapped, {unmapped} unmapped")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        import traceback; traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run()
