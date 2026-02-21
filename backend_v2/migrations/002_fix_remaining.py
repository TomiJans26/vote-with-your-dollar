# Migration 002: Map remaining companies and brands
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sqlalchemy import text
from database import SessionLocal

# Company name -> industry slug (fuzzy match by LIKE)
COMPANY_FIXES = {
    "Kellanova": "food-beverage",
    "Mondelez": "food-beverage",
    "Reckitt": "household-cleaning",
    "Smucker": "food-beverage",
    "Campbell": "food-beverage",
    "Clorox": "household-cleaning",
    "Lauder": "beauty-cosmetics",
    "Hershey": "food-beverage",
    "Energizer": "household-cleaning",
    "Berkshire": "consumer-conglomerate",
    "Haleon": "health-wellness",
    "Prestige": "health-wellness",
    "B&G Foods": "food-beverage",
    "Pinnacle": "food-beverage",
    "Bob Evans": "food-beverage",
    "Dean Foods": "food-beverage",
    "Keurig": "food-beverage",
    "Molson": "food-beverage",
}

# Additional brand mappings for unmapped brands
MORE_BRANDS = {
    # P&G
    "Pepto-Bismol": "digestive-health", "Vicks": "otc-medicine",
    "NyQuil": "otc-medicine", "DayQuil": "otc-medicine",
    "Metamucil": "digestive-health", "Align": "digestive-health",
    "Prilosec OTC": "digestive-health", "Always": "personal-care",
    "Tampax": "personal-care",
    # Unilever
    "Lynx": "deodorant", "Rexona": "deodorant",
    "Shea Moisture": "shampoo", "Love Beauty and Planet": "shampoo",
    "Simple": "face-wash", "Seventh Generation": "laundry-detergent",
    "Domestos": "bleach", "Cif": "all-purpose-cleaner",
    "Comfort": "fabric-softener", "Surf": "laundry-detergent",
    "Persil": "laundry-detergent",
    # More Unilever
    "Sunsilk": "shampoo", "Clear": "shampoo", "VO5": "shampoo",
    "Dermalogica": "moisturizer", "Murad": "moisturizer",
    "Hourglass": "makeup", "REN": "moisturizer",
    "The Laundress": "laundry-detergent",
    "Alberto Balsam": "shampoo",
    # Nestle additional
    "Maggi": "condiments-sauces", "Carnation": "dairy-milk",
    "La Laitiere": "yogurt", "Haagen-Dazs": "ice-cream",
    "Dreyer's": "ice-cream", "Edy's": "ice-cream",
    "Ralston": "dog-food", "Alpo": "dog-food",
    "Felix": "cat-food", "Gourmet": "cat-food",
    "ONE": "dog-food", "Beyond": "dog-food",
    "Starbucks (retail)": "coffee",
    # PepsiCo additional
    "Miss Vickie's": "chips", "PopCorners": "popcorn",
    "Off the Eaten Path": "chips", "Bare": "fruit-snacks",
    "Muscle Milk": "supplements", "LIFEWTR": "water",
    "Aquafina": "water", "Brisk": "tea",
    "Rockstar": "energy-drinks", "Bang": "energy-drinks",
    # Coca-Cola additional
    "Seagram's": "soda", "Schweppes (Coca-Cola)": "soda",
    "ZICO": "water", "Odwalla": "juice",
    # General Mills additional
    "Muir Glen": "pasta-sauce", "Wanchai Ferry": "frozen-meals",
    "Oui": "yogurt", "Ratio": "yogurt",
    "Mountain High": "yogurt", "Liberté": "yogurt",
    "Food Should Taste Good": "chips",
    "Epic": "jerky", "Good Measure": "granola-bars",
    # Mars additional
    "Twix (ice cream)": "ice-cream", "Ethel M": "chocolate",
    "CocoaVia": "chocolate", "Kind": "granola-bars",
    "Nature's Recipe": "dog-food", "Crave": "dog-food",
    "Perfect Fit": "cat-food", "Dreamies": "pet-treats",
    # Kraft Heinz additional
    "Cracker Barrel": "cheese", "Cheez Whiz": "cheese",
    "Miracle Whip": "mayonnaise", "A.1.": "condiments-sauces",
    "Lea & Perrins": "condiments-sauces", "HP Sauce": "condiments-sauces",
    "Philadelphia Cream Cheese": "cream-cheese",
    "Country Time": "juice", "MiO": "juice",
    "Tassimo": "coffee",
    "Weight Watchers Smart Ones": "frozen-meals",
    "TGI Friday's": "frozen-snacks",
    # Conagra additional  
    "Duncan Hines": "baked-goods", "Snack Pack": "snacks",
    "Hebrew National": "hot-dogs", "Udi's": "bread",
    "Glutino": "crackers", "Alexia": "frozen-vegetables",
    "Blake's": "frozen-meals", "Bertolli": "frozen-meals",
    "Ranch Style": "canned-beans", "Wolf Brand": "canned-soup",
    "Manwich": "condiments-sauces",
    # Hormel additional
    "Planters": "nuts", "Corn Nuts": "nuts",
    "Lloyd's": "meat-protein", "Stagg": "canned-soup",
    "Valley Fresh": "canned-tuna", "Hormel Compleats": "frozen-meals",
    "Muscle Milk": "supplements",
    # Kimberly-Clark additional
    "WypAll": "paper-towels", "Poise": "personal-care",
    "U by Kotex": "personal-care",
    # Church & Dwight additional
    "Simply Saline": "otc-medicine", "Close-Up": "toothpaste",
    "Aim": "toothpaste", "Pepsodent": "toothpaste",
    "Arrid": "deodorant",
    # Clorox additional
    "Green Works": "all-purpose-cleaner", "Liquid-Plumr": "all-purpose-cleaner",
    "RenewLife": "digestive-health", "Natural Vitality": "vitamins",
    "Rainbow Light": "vitamins",
    # SC Johnson additional  
    "Mr Muscle": "all-purpose-cleaner", "Duck": "bathroom-cleaner",
    "Kiwi": "personal-care", "Baygon": "pest-control",
    # Reckitt additional
    "Calgon": "laundry-detergent", "Vanish": "laundry-detergent",
    "Harpic": "bathroom-cleaner", "Mortein": "pest-control",
    "Durex": "personal-care", "Scholl": "personal-care",
    "Nurofen": "pain-relief", "Strepsils": "otc-medicine",
    "Gaviscon": "digestive-health",
    # Hershey additional
    "Cadbury (US)": "chocolate", "Payday": "chocolate",
    "Heath": "chocolate", "Whoppers": "chocolate",
    "Bubble Yum": "candy", "Good & Plenty": "candy",
    "Rolo": "chocolate",
    # Smucker additional  
    "Cafe Bustelo": "coffee", "1850": "coffee",
    "Robin Hood": "pancake-mix", "Five Roses": "pancake-mix",
    "Milk-Bone Farmer's Medley": "pet-treats",
    "Nature's Recipe": "dog-food",
    # Campbell's additional
    "Rao's": "pasta-sauce", "Noosa": "yogurt",
    "Snyder's-Lance": "pretzels", "Pop Secret": "popcorn",
    "Emerald": "nuts", "Back to Nature": "crackers",
    "Pacific": "canned-soup", "Well Yes": "canned-soup",
    # Colgate additional
    "elmex": "toothpaste", "meridol": "toothpaste",
    "Sanex": "body-wash", "Tahiti": "body-wash",
    # Georgia-Pacific additional
    "enMotion": "paper-towels", "Compact": "toilet-paper",
    "Pacific Blue": "paper-towels",
    # Energizer additional
    "Armor All": "cleaning", "STP": "cleaning",
    "Remington": "razor",
    # Berkshire/Duracell
    "Duracell": "batteries",
    # Haleon
    "Sensodyne": "toothpaste", "Aquafresh": "toothpaste",
    "Parodontax": "toothpaste", "Biotene": "mouthwash",
    "Polident": "personal-care", "Poligrip": "personal-care",
    "Centrum": "vitamins", "Caltrate": "vitamins",
    "Emergen-C": "vitamins", "Tums": "digestive-health",
    "Robitussin": "otc-medicine", "Theraflu": "otc-medicine",
    "Excedrin": "pain-relief", "Flonase": "allergy",
    "Nicorette": "otc-medicine", "Nicoderm": "otc-medicine",
    "ChapStick": "lip-balm", "Preparation H": "otc-medicine",
    # Prestige Consumer
    "Monistat": "otc-medicine", "Summer's Eve": "personal-care",
    "BC Powder": "pain-relief", "Goody's": "pain-relief",
    "Dramamine": "otc-medicine", "Chloraseptic": "otc-medicine",
    "Luden's": "otc-medicine", "PediaCare": "otc-medicine",
    "DenTek": "toothpaste", "Compound W": "otc-medicine",
    "Clear Eyes": "otc-medicine", "TheraTears": "otc-medicine",
    # B&G Foods
    "Green Giant (B&G)": "canned-vegetables",
    "Ortega": "condiments-sauces", "Las Palmas": "condiments-sauces",
    "Cream of Wheat": "oatmeal", "Maple Grove Farms": "syrup",
    "Underwood": "canned-tuna", "B&M": "canned-beans",
    "Joan of Arc": "canned-beans", "Polaner": "condiments-sauces",
    "Ac'cent": "spices", "Dash": "spices",
    "Mrs. Dash": "spices", "Weber": "spices",
    "Clabber Girl": "pancake-mix", "Rumford": "pancake-mix",
    "Crisco": "condiments-sauces", "Snackwell's": "cookies",
    "SnackWell's": "cookies",
    # Keurig Dr Pepper
    "Bai": "juice", "Core": "water", "Evian": "water",
    "Peñafiel": "water", "Dejà Blue": "water",
    "Nantucket Nectars": "juice", "ReaLemon": "juice",
    "Rose's": "condiments-sauces",
    # Tyson additional
    "Raised & Rooted": "plant-based-meat", "Bosco's": "pizza",
    "Lady Aster": "frozen-meals",
    # L'Oreal additional
    "Urban Decay": "makeup", "IT Cosmetics": "makeup",
    "YSL Beauty": "makeup", "Giorgio Armani Beauty": "makeup",
    "Ralph Lauren Fragrances": "perfume", "Diesel": "cologne",
    "Viktor & Rolf": "perfume", "Mugler": "perfume",
    "Carol's Daughter": "shampoo", "Mizani": "shampoo",
    "SoftSheen-Carson": "shampoo", "Dark and Lovely": "shampoo",
    "Baxter of California": "moisturizer",
    # Estee Lauder additional
    "La Mer": "moisturizer", "Jo Malone": "perfume",
    "Le Labo": "perfume", "Frederic Malle": "perfume",
    "Dr. Jart+": "moisturizer", "The Ordinary": "moisturizer",
    "NIOD": "moisturizer", "Smashbox": "makeup",
    "Becca": "makeup", "GlamGlow": "moisturizer",
    # Abbott additional
    "FreeStyle": "health-wellness", "BinaxNOW": "health-wellness",
    "Juven": "supplements", "ZonePerfect": "granola-bars",
    # Bayer additional
    "Phillips'": "digestive-health", "Midol": "pain-relief",
    "Lotrimin": "otc-medicine", "Tinactin": "otc-medicine",
    # Danone additional
    "Aptamil": "baby-formula", "Nutrilon": "baby-formula",
    "Nutricia": "baby-formula", "YoPRO": "yogurt",
    "Light & Free": "yogurt", "Danio": "yogurt",
    "Actimel": "yogurt", "Fortimel": "supplements",
    # Molson Coors additional
    "Coors Light": "beer", "Miller Lite": "beer",
    "Keystone Light": "beer", "Milwaukee's Best": "beer",
    "Leinenkugel's": "beer", "Peroni": "beer",
    "Vizzy": "beer", "Topo Chico Hard Seltzer": "beer",
    "Simply Spiked": "beer", "Arnold Palmer Spiked": "beer",
}


def run():
    db = SessionLocal()
    try:
        # Fix company mappings
        print("Fixing company industry mappings...")
        industry_map = {}
        for row in db.execute(text("SELECT id, slug FROM industries")).fetchall():
            industry_map[row[1]] = row[0]

        for name_part, slug in COMPANY_FIXES.items():
            if slug in industry_map:
                result = db.execute(
                    text("UPDATE companies SET industry_id = :iid WHERE name LIKE :pattern AND industry_id IS NULL"),
                    {"iid": industry_map[slug], "pattern": f"%{name_part}%"}
                )
                if result.rowcount > 0:
                    print(f"  Mapped {name_part} -> {slug} ({result.rowcount} rows)")
        db.commit()

        # Map more brands
        print("Mapping additional brands...")
        cat_map = {}
        for row in db.execute(text("SELECT id, slug FROM product_categories")).fetchall():
            cat_map[row[1]] = row[0]

        mapped = 0
        for bname, slug in MORE_BRANDS.items():
            if slug in cat_map:
                result = db.execute(
                    text("UPDATE brands SET category_id = :cid WHERE name = :bname AND category_id IS NULL"),
                    {"cid": cat_map[slug], "bname": bname}
                )
                mapped += result.rowcount

        db.commit()
        print(f"  Mapped {mapped} additional brands")

        # Check remaining
        remaining_co = db.execute(text("SELECT COUNT(*) FROM companies WHERE industry_id IS NULL")).scalar()
        remaining_br = db.execute(text("SELECT COUNT(*) FROM brands WHERE category_id IS NULL")).scalar()
        total_br = db.execute(text("SELECT COUNT(*) FROM brands")).scalar()
        print(f"\nRemaining unmapped: {remaining_co} companies, {remaining_br}/{total_br} brands")

        if remaining_br > 0:
            unmapped = db.execute(text("""
                SELECT b.name, c.name as company 
                FROM brands b JOIN companies c ON b.company_id = c.id 
                WHERE b.category_id IS NULL
                ORDER BY c.name, b.name
            """)).fetchall()
            with open("migrations/unmapped_brands_v2.txt", "w", encoding="utf-8") as f:
                for b in unmapped:
                    f.write(f"{b[1]} | {b[0]}\n")
            print(f"  Saved remaining to migrations/unmapped_brands_v2.txt")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        import traceback; traceback.trace_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run()
