# Migration 001: Add Industries table, link companies, and categorize all brands.
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import SessionLocal

INDUSTRIES = [
    ("food-beverage", "Food & Beverage", "Food, drinks, snacks, grocery items"),
    ("personal-care", "Personal Care", "Hygiene, grooming, oral care, body care"),
    ("beauty-cosmetics", "Beauty & Cosmetics", "Skincare, makeup, hair care, fragrance"),
    ("household-cleaning", "Household & Cleaning", "Cleaning products, paper goods, home supplies"),
    ("health-wellness", "Health & Wellness", "OTC medicine, vitamins, supplements"),
    ("baby-kids", "Baby & Kids", "Diapers, formula, baby food, kids products"),
    ("pet-care", "Pet Care", "Pet food, treats, pet supplies"),
    ("clothing-apparel", "Clothing & Apparel", "Fashion, shoes, accessories"),
    ("electronics-tech", "Electronics & Tech", "Phones, computers, gadgets"),
    ("home-furniture", "Home & Furniture", "Furniture, decor, appliances"),
    ("automotive", "Automotive", "Cars, parts, gas stations"),
    ("entertainment-media", "Entertainment & Media", "Streaming, gaming, news, publishing"),
    ("financial-services", "Financial Services", "Banks, credit cards, insurance"),
    ("telecom-internet", "Telecom & Internet", "Cell carriers, ISPs"),
    ("retail-ecommerce", "Retail & E-Commerce", "Stores: Walmart, Amazon, Target"),
    ("restaurants-food-service", "Restaurants & Food Service", "Fast food, restaurant chains"),
    ("tobacco-alcohol", "Tobacco & Alcohol", "Tobacco, alcohol companies"),
    ("consumer-conglomerate", "Consumer Conglomerate", "Multi-industry consumer goods companies"),
]

# Map company names to industry slugs
COMPANY_INDUSTRY_MAP = {
    "Procter & Gamble": "consumer-conglomerate",
    "Unilever": "consumer-conglomerate",
    "Nestlé": "food-beverage",
    "PepsiCo": "food-beverage",
    "The Coca-Cola Company": "food-beverage",
    "Johnson & Johnson": "health-wellness",
    "Colgate-Palmolive": "personal-care",
    "Kimberly-Clark": "household-cleaning",
    "General Mills": "food-beverage",
    "Kellogg's": "food-beverage",
    "Mars, Inc.": "food-beverage",
    "Mondelēz International": "food-beverage",
    "Kraft Heinz": "food-beverage",
    "Conagra Brands": "food-beverage",
    "Campbell's": "food-beverage",
    "Hormel Foods": "food-beverage",
    "Tyson Foods": "food-beverage",
    "JBS": "food-beverage",
    "Clorox": "household-cleaning",
    "Church & Dwight": "household-cleaning",
    "SC Johnson": "household-cleaning",
    "Reckitt Benckiser": "household-cleaning",
    "Henkel": "household-cleaning",
    "Energizer": "household-cleaning",
    "Spectrum Brands": "household-cleaning",
    "Edgewell Personal Care": "personal-care",
    "Revlon": "beauty-cosmetics",
    "Estée Lauder": "beauty-cosmetics",
    "L'Oréal": "beauty-cosmetics",
    "Hershey's": "food-beverage",
    "Ferrara Candy": "food-beverage",
    "Ferrero": "food-beverage",
    "Lindt & Sprüngli": "food-beverage",
    "Danone": "food-beverage",
    "Abbott Laboratories": "health-wellness",
    "Bayer": "health-wellness",
    "GSK": "health-wellness",
    "Pfizer": "health-wellness",
    "Sanofi": "health-wellness",
    "Purina": "pet-care",
    "Blue Buffalo": "pet-care",
    "Smucker's": "food-beverage",
    "McCormick & Company": "food-beverage",
    "TreeHouse Foods": "food-beverage",
    "Post Holdings": "food-beverage",
    "Bob Evans": "food-beverage",
    "Chobani": "food-beverage",
    "Fage": "food-beverage",
    "Georgia-Pacific": "household-cleaning",
    "Anheuser-Busch InBev": "food-beverage",
    "Molson Coors": "food-beverage",
    "Constellation Brands": "food-beverage",
    "Diageo": "food-beverage",
    "Brown-Forman": "food-beverage",
    "Dr Pepper Keurig": "food-beverage",
    "Monster Beverage": "food-beverage",
    "Red Bull": "food-beverage",
    "Starbucks": "food-beverage",
    "Del Monte Foods": "food-beverage",
    "Dole": "food-beverage",
    "Bumble Bee": "food-beverage",
    "Ocean Spray": "food-beverage",
    "Land O'Lakes": "food-beverage",
    "Dean Foods": "food-beverage",
    "Saputo": "food-beverage",
    "Lactalis": "food-beverage",
    "Associated British Foods": "food-beverage",
    "Wolverine World Wide": "clothing-apparel",
    "Hanesbrands": "clothing-apparel",
    "Nike": "clothing-apparel",
    "Adidas": "clothing-apparel",
}

# Brand categorization: map brand names to product_category slugs
# We'll do this with keyword/company matching
BRAND_CATEGORY_RULES = {
    # By company type - P&G brands
    "Tide": "laundry-detergent", "Gain": "laundry-detergent", "Downy": "fabric-softener",
    "Bounce": "dryer-sheets", "Dreft": "laundry-detergent", "Era": "laundry-detergent",
    "Cascade": "dish-soap", "Dawn": "dish-soap", "Fairy": "dish-soap", "Joy": "dish-soap",
    "Swiffer": "all-purpose-cleaner", "Mr. Clean": "all-purpose-cleaner",
    "Febreze": "air-freshener",
    "Charmin": "toilet-paper", "Bounty": "paper-towels", "Puffs": "tissues",
    "Pampers": "diapers", "Luvs": "diapers",
    "Crest": "toothpaste", "Oral-B": "toothpaste", "Scope": "mouthwash",
    "Head & Shoulders": "shampoo", "Pantene": "shampoo", "Herbal Essences": "shampoo",
    "Aussie": "shampoo", "Vidal Sassoon": "shampoo",
    "Olay": "moisturizer", "Old Spice": "deodorant", "Secret": "deodorant",
    "Gillette": "razor", "Venus": "razor", "Braun": "razor",
    "Ivory": "soap", "Safeguard": "soap", "Zest": "soap",
    "SK-II": "moisturizer", "Native": "deodorant",
    # Unilever
    "Dove": "soap", "Axe": "deodorant", "Degree": "deodorant",
    "Suave": "shampoo", "TRESemmé": "shampoo", "Nexxus": "shampoo",
    "St. Ives": "lotion", "Vaseline": "lotion", "Pond's": "moisturizer",
    "Lever 2000": "soap",
    "Hellmann's": "mayonnaise", "Best Foods": "mayonnaise",
    "Knorr": "condiments-sauces", "Lipton": "tea",
    "Ben & Jerry's": "ice-cream", "Breyers": "ice-cream", "Klondike": "ice-cream",
    "Magnum": "ice-cream", "Talenti": "ice-cream", "Popsicle": "ice-cream",
    "Good Humor": "ice-cream",
    "Sir Kensington's": "condiments-sauces",
    # Nestlé
    "Nescafé": "coffee", "Nespresso": "coffee", "Coffee mate": "coffee",
    "Nestea": "tea", "Nesquik": "dairy-milk",
    "KitKat": "chocolate", "Butterfinger": "chocolate", "Crunch": "chocolate",
    "Toll House": "cookies", "Skinny Cow": "ice-cream",
    "Gerber": "baby-food", "NAN": "baby-formula",
    "Stouffer's": "frozen-meals", "Lean Cuisine": "frozen-meals",
    "DiGiorno": "frozen-pizza", "Tombstone": "frozen-pizza", "Jack's": "frozen-pizza",
    "Hot Pockets": "frozen-snacks", "Buitoni": "pasta",
    "Purina": "dog-food", "Fancy Feast": "cat-food", "Friskies": "cat-food",
    "Beneful": "dog-food", "Dog Chow": "dog-food", "Cat Chow": "cat-food",
    "Pro Plan": "dog-food", "Tidy Cats": "pet-care",
    "Poland Spring": "water", "Deer Park": "water", "Arrowhead": "water",
    "S.Pellegrino": "water", "Perrier": "water", "Acqua Panna": "water",
    "Sweet Earth": "frozen-meals", "Garden of Life": "vitamins",
    # PepsiCo
    "Pepsi": "soda", "Mountain Dew": "soda", "Sierra Mist": "soda", "Mug Root Beer": "soda",
    "Gatorade": "sports-drinks", "Propel": "sports-drinks",
    "Tropicana": "juice", "Naked Juice": "juice", "Dole (juice)": "juice",
    "Lay's": "chips", "Ruffles": "chips", "Doritos": "chips", "Tostitos": "chips",
    "Cheetos": "chips", "Fritos": "chips", "Sun Chips": "chips",
    "Stacy's Pita Chips": "chips",
    "Quaker": "oatmeal", "Cap'n Crunch": "cereal", "Life": "cereal",
    "Aunt Jemima": "pancake-mix", "Pearl Milling Company": "pancake-mix",
    "Rice-A-Roni": "rice", "Near East": "rice",
    "SoBe": "soda", "Bubly": "water",
    "Smartfood": "popcorn", "Grandma's": "cookies",
    "Sabra": "condiments-sauces",
    # Coca-Cola
    "Coca-Cola": "soda", "Sprite": "soda", "Fanta": "soda", "Barq's": "soda",
    "Mello Yello": "soda", "Pibb Xtra": "soda", "Fresca": "soda",
    "Minute Maid": "juice", "Simply Orange": "juice", "Hi-C": "juice",
    "Powerade": "sports-drinks", "BodyArmor": "sports-drinks",
    "Dasani": "water", "Smartwater": "water", "Topo Chico": "water",
    "Gold Peak": "tea", "Honest Tea": "tea", "Peace Tea": "tea", "Fuze": "tea",
    "Costa Coffee": "coffee",
    "Vitaminwater": "water", "AHA": "water",
    "Fairlife": "dairy-milk",
    # General Mills
    "Cheerios": "cereal", "Lucky Charms": "cereal", "Chex": "cereal",
    "Cinnamon Toast Crunch": "cereal", "Cocoa Puffs": "cereal",
    "Trix": "cereal", "Wheaties": "cereal", "Total": "cereal",
    "Fiber One": "cereal", "Cascadian Farm": "cereal",
    "Nature Valley": "granola-bars", "Lärabar": "granola-bars",
    "Annie's": "crackers", "Betty Crocker": "pancake-mix",
    "Pillsbury": "pancake-mix", "Bisquick": "pancake-mix",
    "Gold Medal": "pancake-mix", "Progresso": "canned-soup",
    "Old El Paso": "condiments-sauces", "Hamburger Helper": "pasta",
    "Totino's": "frozen-pizza", "Green Giant": "canned-vegetables",
    "Häagen-Dazs": "ice-cream", "Yoplait": "yogurt",
    "Fruit Roll-Ups": "fruit-snacks", "Gushers": "fruit-snacks",
    "Fruit by the Foot": "fruit-snacks",
    "Gardein": "plant-based-meat", "Blue Buffalo": "dog-food",
    "Bugles": "chips", "Chex Mix": "chips",
    # Kellogg's (now Kellanova + WK Kellogg)
    "Frosted Flakes": "cereal", "Froot Loops": "cereal", "Rice Krispies": "cereal",
    "Corn Flakes": "cereal", "Raisin Bran": "cereal", "Mini-Wheats": "cereal",
    "Apple Jacks": "cereal", "Corn Pops": "cereal", "Honey Smacks": "cereal",
    "Special K": "cereal", "All-Bran": "cereal", "Cracklin' Oat Bran": "cereal",
    "Pop-Tarts": "toaster-pastries", "Nutri-Grain": "breakfast-bars",
    "Eggo": "frozen-breakfast",
    "Pringles": "chips", "Cheez-It": "crackers",
    "Club": "crackers", "Zesta": "crackers", "Town House": "crackers",
    "Keebler": "cookies", "Famous Amos": "cookies", "Murray": "cookies",
    "MorningStar Farms": "plant-based-meat", "Incogmeato": "plant-based-meat",
    "Gardenburger": "plant-based-meat",
    "RXBar": "granola-bars", "Bear Naked": "granola",
    # Mars
    "M&M's": "chocolate", "Snickers": "chocolate", "Twix": "chocolate",
    "Milky Way": "chocolate", "3 Musketeers": "chocolate",
    "Skittles": "candy", "Starburst": "candy", "Life Savers": "candy",
    "Altoids": "candy", "Wrigley's": "candy", "Orbit": "candy",
    "Extra": "candy", "Hubba Bubba": "candy", "Juicy Fruit": "candy",
    "Doublemint": "candy",
    "Uncle Ben's": "rice", "Ben's Original": "rice", "Seeds of Change": "rice",
    "Dolmio": "pasta-sauce", "Masterfoods": "condiments-sauces",
    "Pedigree": "dog-food", "Whiskas": "cat-food", "Iams": "dog-food",
    "Royal Canin": "dog-food", "Nutro": "dog-food", "Sheba": "cat-food",
    "Temptations": "pet-treats", "Greenies": "pet-treats", "Cesar": "dog-food",
    "Dove Chocolate": "chocolate",
    # Mondelēz
    "Oreo": "cookies", "Chips Ahoy!": "cookies", "Nutter Butter": "cookies",
    "belVita": "breakfast-bars",
    "Ritz": "crackers", "Wheat Thins": "crackers", "Triscuit": "crackers",
    "Honey Maid": "crackers", "Premium": "crackers",
    "Cadbury": "chocolate", "Toblerone": "chocolate", "Milka": "chocolate",
    "Côte d'Or": "chocolate", "Green & Black's": "chocolate",
    "Sour Patch Kids": "candy", "Swedish Fish": "candy", "Maynards": "candy",
    "Halls": "otc-medicine",
    "Tang": "juice", "Crystal Light": "juice",
    "Philadelphia": "cream-cheese", "Velveeta": "cheese",
    "Clif Bar": "granola-bars",
    "Trident": "candy",
    # Kraft Heinz
    "Heinz": "ketchup", "Kraft": "cheese", "Oscar Mayer": "deli-meat",
    "Jell-O": "snacks", "Kool-Aid": "juice", "Maxwell House": "coffee",
    "Capri Sun": "juice",
    "Lunchables": "deli-meat", "Planters": "nuts",
    "Grey Poupon": "mustard", "Classico": "pasta-sauce",
    "Ore-Ida": "frozen-vegetables", "Bagel Bites": "frozen-snacks",
    "Gevalia": "coffee",
    "Smart Ones": "frozen-meals",
    # Conagra
    "Banquet": "frozen-meals", "Marie Callender's": "frozen-meals",
    "Healthy Choice": "frozen-meals", "Kid Cuisine": "frozen-meals",
    "Slim Jim": "jerky",
    "Hunt's": "pasta-sauce", "Rotel": "canned-vegetables",
    "Chef Boyardee": "canned-soup", "PAM": "condiments-sauces",
    "Reddi-wip": "cream", "Swiss Miss": "coffee",
    "Angie's BOOMCHICKAPOP": "popcorn", "Orville Redenbacher's": "popcorn",
    "Act II": "popcorn", "Jiffy Pop": "popcorn",
    "Vlasic": "condiments-sauces", "Gulden's": "mustard",
    "Duke's": "jerky", "David": "nuts",
    "Birds Eye": "frozen-vegetables", "Gardein": "plant-based-meat",
    "Frontera": "condiments-sauces", "Wishbone": "salad-dressing",
    "Peter Pan": "condiments-sauces",
    "Egg Beaters": "eggs",
    # Campbell's
    "Campbell's": "canned-soup", "Chunky": "canned-soup", "Well Yes!": "canned-soup",
    "Swanson": "canned-soup", "Pace": "salsa", "Prego": "pasta-sauce",
    "V8": "juice", "SpaghettiOs": "canned-soup",
    "Snyder's of Hanover": "pretzels", "Lance": "crackers",
    "Cape Cod": "chips", "Kettle Brand": "chips",
    "Late July": "chips", "Goldfish": "crackers",
    "Pepperidge Farm": "bread", "Milano": "cookies",
    "Pacific Foods": "canned-soup",
    # Hershey's
    "Hershey's": "chocolate", "Reese's": "chocolate", "Kit Kat": "chocolate",
    "Jolly Rancher": "candy", "Twizzlers": "candy", "Ice Breakers": "candy",
    "Almond Joy": "chocolate", "Mounds": "chocolate",
    "York": "chocolate", "Brookside": "chocolate",
    "SkinnyPop": "popcorn", "Pirate's Booty": "chips",
    "Dot's Pretzels": "pretzels",
    # Hormel
    "Hormel": "deli-meat", "SPAM": "canned-tuna", "Dinty Moore": "canned-soup",
    "Skippy": "condiments-sauces", "Wholly Guacamole": "condiments-sauces",
    "Applegate": "deli-meat", "Jennie-O": "turkey",
    "Natural Choice": "deli-meat", "Columbus": "deli-meat",
    "Herdez": "salsa", "La Victoria": "salsa",
    "Black Label": "bacon", "Compleats": "frozen-meals",
    # Colgate-Palmolive
    "Colgate": "toothpaste", "Tom's of Maine": "toothpaste",
    "Palmolive": "dish-soap", "Ajax": "all-purpose-cleaner",
    "Irish Spring": "soap", "Softsoap": "soap", "Protex": "soap",
    "Speed Stick": "deodorant", "Lady Speed Stick": "deodorant",
    "Hill's": "dog-food", "Science Diet": "dog-food",
    # Kimberly-Clark
    "Kleenex": "tissues", "Scott": "toilet-paper", "Cottonelle": "toilet-paper",
    "Viva": "paper-towels", "Huggies": "diapers", "Pull-Ups": "diapers",
    "GoodNites": "diapers", "Kotex": "personal-care", "Depend": "personal-care",
    # Clorox
    "Clorox": "bleach", "Pine-Sol": "all-purpose-cleaner",
    "Tilex": "bathroom-cleaner", "Formula 409": "all-purpose-cleaner",
    "S.O.S": "dish-soap", "Glad": "trash-bags",
    "Fresh Step": "pet-care", "Scoop Away": "pet-care",
    "Brita": "water", "Burt's Bees": "lip-balm",
    "Kingsford": "condiments-sauces", "Hidden Valley": "salad-dressing",
    "KC Masterpiece": "bbq-sauce",
    # Church & Dwight
    "Arm & Hammer": "laundry-detergent", "OxiClean": "laundry-detergent",
    "Kaboom": "bathroom-cleaner", "Orange Glo": "all-purpose-cleaner",
    "Nair": "personal-care", "First Response": "health-wellness",
    "Orajel": "otc-medicine", "Trojan": "personal-care",
    "Xtra": "laundry-detergent", "Spinbrush": "toothpaste",
    "Batiste": "shampoo", "TheraBreath": "mouthwash",
    "Vitafusion": "vitamins", "L'il Critters": "vitamins",
    "WaterPik": "toothpaste",
    # SC Johnson
    "Windex": "glass-cleaner", "Scrubbing Bubbles": "bathroom-cleaner",
    "Pledge": "all-purpose-cleaner", "Glade": "air-freshener",
    "Raid": "pest-control", "OFF!": "pest-control",
    "Ziploc": "storage-bags", "Saran Wrap": "plastic-wrap",
    "Fantastik": "all-purpose-cleaner", "Drano": "all-purpose-cleaner",
    "Shout": "laundry-detergent", "Mrs. Meyer's": "all-purpose-cleaner",
    "Method": "all-purpose-cleaner",
    # Reckitt
    "Lysol": "disinfectant", "Dettol": "disinfectant",
    "Finish": "dish-soap", "Woolite": "laundry-detergent",
    "Air Wick": "air-freshener",
    "Mucinex": "otc-medicine", "Delsym": "otc-medicine",
    "Clearasil": "face-wash",
    "Enfamil": "baby-formula", "Nutramigen": "baby-formula",
    # Georgia-Pacific (Koch)
    "Brawny": "paper-towels", "Angel Soft": "toilet-paper",
    "Quilted Northern": "toilet-paper", "Dixie": "paper-goods",
    "Sparkle": "paper-towels", "Vanity Fair": "paper-goods",
    "Stainmaster": "cleaning",
    # Smucker's
    "Smucker's": "condiments-sauces", "Jif": "condiments-sauces",
    "Folgers": "coffee", "Dunkin'": "coffee", "Café Bustelo": "coffee",
    "Milk-Bone": "pet-treats", "Meow Mix": "cat-food",
    "Rachael Ray Nutrish": "dog-food", "9Lives": "cat-food",
    "Uncrustables": "bread",
    "Hostess": "baked-goods",
    # Tyson
    "Tyson": "chicken", "Jimmy Dean": "sausage", "Hillshire Farm": "deli-meat",
    "Ball Park": "hot-dogs", "Sara Lee": "bread",
    "Aidells": "sausage", "Wright": "bacon",
    "State Fair": "frozen-snacks",
    # Energizer
    "Energizer": "batteries", "Eveready": "batteries",
    "Rayovac": "batteries", "VARTA": "batteries",
    "Schick": "razor", "Banana Boat": "sunscreen", "Hawaiian Tropic": "sunscreen",
    "Playtex": "personal-care", "Wet Ones": "personal-care",
    "Bulldog": "razor",
    # L'Oréal
    "L'Oréal Paris": "makeup", "Maybelline": "makeup", "NYX": "makeup",
    "Garnier": "shampoo", "Lancôme": "makeup",
    "Kiehl's": "moisturizer", "La Roche-Posay": "moisturizer",
    "CeraVe": "moisturizer", "Vichy": "moisturizer",
    "Essie": "nail-care", "Redken": "shampoo",
    "Matrix": "shampoo", "Pureology": "shampoo",
    # Estée Lauder
    "Estée Lauder": "moisturizer", "Clinique": "moisturizer",
    "MAC": "makeup", "Bobbi Brown": "makeup",
    "Too Faced": "makeup", "Aveda": "shampoo",
    "Bumble and bumble": "shampoo", "Origins": "moisturizer",
    "DKNY": "perfume", "Tom Ford": "perfume",
    # Johnson & Johnson
    "Band-Aid": "first-aid", "Neosporin": "first-aid",
    "Tylenol": "pain-relief", "Motrin": "pain-relief", "Advil": "pain-relief",
    "Benadryl": "allergy", "Zyrtec": "allergy",
    "Imodium": "digestive-health", "Pepcid": "digestive-health",
    "Listerine": "mouthwash", "Johnson's": "baby-care",
    "Aveeno": "lotion", "Neutrogena": "moisturizer",
    "Clean & Clear": "face-wash", "RoC": "moisturizer",
    "Rogaine": "hair-styling", "Visine": "otc-medicine",
    "Splenda": "condiments-sauces",
    # Abbott
    "Similac": "baby-formula", "Ensure": "supplements",
    "Pedialyte": "otc-medicine", "Glucerna": "supplements",
    "PediaSure": "supplements",
    # McCormick
    "McCormick": "spices", "Old Bay": "spices", "Lawry's": "spices",
    "Zatarain's": "spices", "Stubb's": "bbq-sauce",
    "French's": "mustard", "Frank's RedHot": "hot-sauce",
    "Cholula": "hot-sauce", "Thai Kitchen": "condiments-sauces",
    "Simply Asia": "condiments-sauces",
    # Dr Pepper / Keurig
    "Dr Pepper": "soda", "7UP": "soda", "A&W": "soda",
    "Sunkist": "soda", "Canada Dry": "soda", "Schweppes": "soda",
    "Snapple": "juice", "Mott's": "juice", "Clamato": "juice",
    "Hawaiian Punch": "juice", "Yoo-hoo": "dairy-milk",
    "Green Mountain Coffee": "coffee", "The Original Donut Shop": "coffee",
    "Keurig": "coffee",
    # Post Holdings
    "Grape-Nuts": "cereal", "Honeycomb": "cereal", "Great Grains": "cereal",
    "Fruity Pebbles": "cereal", "Cocoa Pebbles": "cereal",
    "Honey Bunches of Oats": "cereal", "Malt-O-Meal": "cereal",
    "Raisin Bran (Post)": "cereal", "Shredded Wheat": "cereal",
    "Bob Evans": "sausage",
    # Danone
    "Dannon": "yogurt", "Activia": "yogurt", "Oikos": "yogurt",
    "International Delight": "coffee", "Silk": "plant-based-milk",
    "So Delicious": "plant-based-milk", "Alpro": "plant-based-milk",
    "evian": "water", "Volvic": "water",
    "Horizon Organic": "dairy-milk", "Wallaby": "yogurt",
    "Stonyfield": "yogurt",
    # Bayer
    "Bayer Aspirin": "pain-relief", "Aleve": "pain-relief", "Alka-Seltzer": "pain-relief",
    "Claritin": "allergy", "MiraLAX": "digestive-health",
    "One A Day": "vitamins", "Flintstones": "vitamins",
    "Coppertone": "sunscreen", "Dr. Scholl's": "personal-care",
    # Monster/Red Bull
    "Monster Energy": "energy-drinks", "Reign": "energy-drinks",
    "Red Bull": "energy-drinks",
    # Alcohol
    "Budweiser": "beer", "Bud Light": "beer", "Michelob Ultra": "beer",
    "Stella Artois": "beer", "Corona": "beer", "Modelo": "beer",
    "Coors": "beer", "Miller": "beer", "Blue Moon": "beer",
    "Johnnie Walker": "spirits", "Smirnoff": "spirits", "Captain Morgan": "spirits",
    "Tanqueray": "spirits", "Guinness": "beer", "Baileys": "spirits",
    "Crown Royal": "spirits", "Bulleit": "spirits", "Woodford Reserve": "spirits",
    "Jack Daniel's": "spirits", "Maker's Mark": "spirits",
    "Robert Mondavi": "wine", "Kim Crawford": "wine",
}

def run():
    db = SessionLocal()
    try:
        # 1. Create industries table
        print("Creating industries table...")
        db.execute(text("""
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'industries')
            CREATE TABLE industries (
                id INT IDENTITY(1,1) PRIMARY KEY,
                slug VARCHAR(100) NOT NULL UNIQUE,
                name VARCHAR(255) NOT NULL,
                description TEXT
            )
        """))
        db.commit()

        # 2. Seed industries
        print("Seeding industries...")
        for slug, name, desc in INDUSTRIES:
            db.execute(text("""
                IF NOT EXISTS (SELECT 1 FROM industries WHERE slug = :slug)
                INSERT INTO industries (slug, name, description) VALUES (:slug, :name, :desc)
            """), {"slug": slug, "name": name, "desc": desc})
        db.commit()

        # 3. Add industry_id to companies if not exists
        print("Adding industry_id to companies...")
        db.execute(text("""
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('companies') AND name = 'industry_id')
            ALTER TABLE companies ADD industry_id INT NULL
        """))
        db.commit()

        # Add FK if not exists
        db.execute(text("""
            IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_companies_industry')
            ALTER TABLE companies ADD CONSTRAINT fk_companies_industry 
            FOREIGN KEY (industry_id) REFERENCES industries(id)
        """))
        db.commit()

        # 4. Map companies to industries
        print("Mapping companies to industries...")
        companies = db.execute(text("SELECT id, name FROM companies")).fetchall()
        industry_map = {}
        for row in db.execute(text("SELECT id, slug FROM industries")).fetchall():
            industry_map[row[1]] = row[0]

        mapped = 0
        for cid, cname in companies:
            slug = COMPANY_INDUSTRY_MAP.get(cname)
            if slug and slug in industry_map:
                db.execute(text("UPDATE companies SET industry_id = :iid WHERE id = :cid"),
                          {"iid": industry_map[slug], "cid": cid})
                mapped += 1
        db.commit()
        print(f"  Mapped {mapped}/{len(companies)} companies to industries")

        # 5. Add category_id to brands if not exists  
        print("Adding category_id to brands...")
        db.execute(text("""
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('brands') AND name = 'category_id')
            ALTER TABLE brands ADD category_id INT NULL
        """))
        db.commit()

        db.execute(text("""
            IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_brands_category')
            ALTER TABLE brands ADD CONSTRAINT fk_brands_category 
            FOREIGN KEY (category_id) REFERENCES product_categories(id)
        """))
        db.commit()

        # 6. Map brands to categories
        print("Mapping brands to product categories...")
        brands = db.execute(text("SELECT id, name FROM brands")).fetchall()
        cat_map = {}
        for row in db.execute(text("SELECT id, slug FROM product_categories")).fetchall():
            cat_map[row[1]] = row[0]

        mapped = 0
        unmapped = []
        for bid, bname in brands:
            slug = BRAND_CATEGORY_RULES.get(bname)
            if slug and slug in cat_map:
                db.execute(text("UPDATE brands SET category_id = :cid WHERE id = :bid"),
                          {"cid": cat_map[slug], "bid": bid})
                mapped += 1
            else:
                unmapped.append(bname)
        db.commit()
        print(f"  Mapped {mapped}/{len(brands)} brands to categories")
        if unmapped:
            print(f"  Unmapped brands ({len(unmapped)}): {unmapped[:20]}...")
            # Save unmapped for review
            with open("migrations/unmapped_brands.txt", "w") as f:
                f.write("\n".join(unmapped))
            print("  Full list saved to migrations/unmapped_brands.txt")

        print("\n✅ Migration complete!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    run()
