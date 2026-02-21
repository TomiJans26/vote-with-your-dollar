# Migration 004: Expand ALL industries with companies and brands
# No more empty categories. Deep dive on everyone.
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sqlalchemy import text
from database import SessionLocal

# Format: (slug, name, ticker, country, industry_slug, [brands])
NEW_COMPANIES = [
    # === CLOTHING & APPAREL ===
    ("nike", "Nike", "NKE", "US", "clothing-apparel", [
        "Nike", "Jordan", "Converse", "Nike ACG", "Nike SB",
    ]),
    ("adidas", "Adidas", "ADDYY", "DE", "clothing-apparel", [
        "Adidas", "Adidas Originals", "Reebok", "Y-3",
    ]),
    ("pvh", "PVH Corp", "PVH", "US", "clothing-apparel", [
        "Calvin Klein", "Tommy Hilfiger", "Van Heusen", "IZOD", "Arrow",
    ]),
    ("hanesbrands", "Hanesbrands", "HBI", "US", "clothing-apparel", [
        "Hanes", "Champion", "Playtex (apparel)", "Bali", "Maidenform", "Gear for Sports",
    ]),
    ("vf-corp", "VF Corporation", "VFC", "US", "clothing-apparel", [
        "The North Face", "Timberland", "Dickies", "Vans", "Supreme", "Icebreaker",
    ]),
    ("gap-inc", "Gap Inc.", "GAP", "US", "clothing-apparel", [
        "Gap", "Old Navy", "Banana Republic", "Athleta",
    ]),
    ("levi-strauss", "Levi Strauss & Co.", "LEVI", "US", "clothing-apparel", [
        "Levi's", "Dockers", "Denizen", "Signature by Levi Strauss",
    ]),
    ("tapestry", "Tapestry Inc.", "TPR", "US", "clothing-apparel", [
        "Coach", "Kate Spade", "Stuart Weitzman",
    ]),
    ("capri-holdings", "Capri Holdings", "CPRI", "GB", "clothing-apparel", [
        "Michael Kors", "Versace", "Jimmy Choo",
    ]),
    ("ralph-lauren", "Ralph Lauren Corp.", "RL", "US", "clothing-apparel", [
        "Ralph Lauren", "Polo", "Lauren", "Chaps", "Club Monaco",
    ]),
    ("under-armour", "Under Armour", "UAA", "US", "clothing-apparel", [
        "Under Armour", "UA HOVR", "Project Rock",
    ]),
    ("columbia-sportswear", "Columbia Sportswear", "COLM", "US", "clothing-apparel", [
        "Columbia", "SOREL", "Mountain Hardwear", "prAna",
    ]),
    ("skechers", "Skechers", "SKX", "US", "clothing-apparel", [
        "Skechers", "Skechers Sport", "Skechers Work",
    ]),
    ("wolverine-ww", "Wolverine World Wide", "WWW", "US", "clothing-apparel", [
        "Merrell", "Saucony", "Wolverine", "Cat Footwear", "Chaco", "Hush Puppies", "Keds",
    ]),
    ("inditex", "Inditex", "IDEXY", "ES", "clothing-apparel", [
        "Zara", "Massimo Dutti", "Pull & Bear", "Bershka", "Stradivarius", "Oysho",
    ]),
    ("hm-group", "H&M Group", "HNNMY", "SE", "clothing-apparel", [
        "H&M", "COS", "& Other Stories", "Weekday", "Monki", "ARKET",
    ]),
    ("fast-retailing", "Fast Retailing", "FRCOY", "JP", "clothing-apparel", [
        "Uniqlo", "GU", "Theory", "Helmut Lang",
    ]),
    ("new-balance", "New Balance", None, "US", "clothing-apparel", [
        "New Balance", "NB Numeric", "Warrior Sports",
    ]),
    ("crocs", "Crocs Inc.", "CROX", "US", "clothing-apparel", [
        "Crocs", "HEYDUDE",
    ]),
    ("deckers", "Deckers Brands", "DECK", "US", "clothing-apparel", [
        "UGG", "HOKA", "Teva", "Sanuk",
    ]),

    # === ELECTRONICS & TECH ===
    ("apple", "Apple Inc.", "AAPL", "US", "electronics-tech", [
        "iPhone", "iPad", "Mac", "Apple Watch", "AirPods", "Apple TV", "HomePod",
        "Vision Pro", "Beats",
    ]),
    ("samsung", "Samsung Electronics", "005930", "KR", "electronics-tech", [
        "Galaxy", "Samsung TV", "Samsung Appliances", "Bixby", "Harman Kardon", "JBL",
    ]),
    ("sony", "Sony Group", "SONY", "JP", "electronics-tech", [
        "PlayStation", "Sony TV (Bravia)", "Sony Audio", "Sony Cameras (Alpha)", "Inzone",
    ]),
    ("lg-electronics", "LG Electronics", "066570", "KR", "electronics-tech", [
        "LG TV", "LG Appliances", "LG Gram", "LG ThinQ",
    ]),
    ("microsoft", "Microsoft", "MSFT", "US", "electronics-tech", [
        "Xbox", "Surface", "Windows", "Microsoft 365", "LinkedIn", "GitHub",
    ]),
    ("google-alphabet", "Alphabet (Google)", "GOOGL", "US", "electronics-tech", [
        "Google", "Pixel", "Nest", "Chromecast", "YouTube", "Fitbit", "Waymo",
    ]),
    ("amazon", "Amazon.com", "AMZN", "US", "electronics-tech", [
        "Kindle", "Echo", "Fire TV", "Ring", "Blink", "Eero", "Alexa",
    ]),
    ("meta", "Meta Platforms", "META", "US", "electronics-tech", [
        "Meta Quest", "Facebook", "Instagram", "WhatsApp", "Ray-Ban Meta",
    ]),
    ("dell", "Dell Technologies", "DELL", "US", "electronics-tech", [
        "Dell", "Alienware", "Dell XPS", "Dell Inspiron",
    ]),
    ("hp-inc", "HP Inc.", "HPQ", "US", "electronics-tech", [
        "HP", "HP Spectre", "HP Envy", "HP Pavilion", "HP Omen",
    ]),
    ("lenovo", "Lenovo", "LNVGY", "CN", "electronics-tech", [
        "Lenovo", "ThinkPad", "IdeaPad", "Legion", "Motorola",
    ]),
    ("intel", "Intel Corporation", "INTC", "US", "electronics-tech", [
        "Intel Core", "Intel Arc", "Intel Evo",
    ]),
    ("nvidia", "NVIDIA", "NVDA", "US", "electronics-tech", [
        "GeForce", "NVIDIA Shield", "RTX",
    ]),
    ("amd", "AMD", "AMD", "US", "electronics-tech", [
        "Ryzen", "Radeon", "EPYC",
    ]),
    ("bose", "Bose Corporation", None, "US", "electronics-tech", [
        "Bose", "Bose QuietComfort", "Bose SoundLink",
    ]),
    ("logitech", "Logitech", "LOGI", "CH", "electronics-tech", [
        "Logitech", "Logitech G", "Blue Microphones", "Ultimate Ears", "Streamlabs",
    ]),
    ("nintendo", "Nintendo", "NTDOY", "JP", "electronics-tech", [
        "Nintendo Switch", "Game Boy", "Amiibo",
    ]),
    ("dyson", "Dyson", None, "GB", "electronics-tech", [
        "Dyson", "Dyson Airwrap", "Dyson V15", "Dyson Purifier",
    ]),

    # === AUTOMOTIVE ===
    ("general-motors", "General Motors", "GM", "US", "automotive", [
        "Chevrolet", "GMC", "Cadillac", "Buick", "Corvette", "Hummer EV",
    ]),
    ("ford", "Ford Motor Company", "F", "US", "automotive", [
        "Ford", "Lincoln", "Ford Mustang", "Ford F-150", "Bronco",
    ]),
    ("stellantis", "Stellantis", "STLA", "NL", "automotive", [
        "Jeep", "Ram", "Dodge", "Chrysler", "Fiat", "Alfa Romeo", "Maserati",
    ]),
    ("toyota", "Toyota Motor", "TM", "JP", "automotive", [
        "Toyota", "Lexus", "Toyota Tacoma", "Toyota Camry", "RAV4",
    ]),
    ("honda", "Honda Motor", "HMC", "JP", "automotive", [
        "Honda", "Acura", "Honda Civic", "Honda CR-V",
    ]),
    ("tesla", "Tesla Inc.", "TSLA", "US", "automotive", [
        "Tesla Model 3", "Tesla Model Y", "Tesla Model S", "Tesla Model X", "Cybertruck", "Tesla Energy",
    ]),
    ("volkswagen", "Volkswagen Group", "VWAGY", "DE", "automotive", [
        "Volkswagen", "Audi", "Porsche", "Lamborghini", "Bentley", "Ducati",
    ]),
    ("bmw", "BMW Group", "BMWYY", "DE", "automotive", [
        "BMW", "MINI", "Rolls-Royce",
    ]),
    ("mercedes-benz", "Mercedes-Benz", "MBGYY", "DE", "automotive", [
        "Mercedes-Benz", "AMG", "Mercedes EQ",
    ]),
    ("hyundai-kia", "Hyundai Motor Group", "HYMTF", "KR", "automotive", [
        "Hyundai", "Kia", "Genesis",
    ]),
    ("nissan", "Nissan Motor", "NSANY", "JP", "automotive", [
        "Nissan", "Infiniti", "Nissan Leaf",
    ]),
    ("subaru", "Subaru Corporation", "FUJHY", "JP", "automotive", [
        "Subaru", "Subaru Outback", "Subaru Forester", "WRX",
    ]),
    ("mazda", "Mazda Motor", "MZDAY", "JP", "automotive", [
        "Mazda", "Mazda CX-5", "Mazda MX-5 Miata",
    ]),
    ("rivian", "Rivian Automotive", "RIVN", "US", "automotive", [
        "Rivian R1T", "Rivian R1S",
    ]),
    # Gas stations
    ("exxonmobil", "ExxonMobil", "XOM", "US", "automotive", [
        "Exxon", "Mobil", "Esso", "Mobil 1",
    ]),
    ("chevron", "Chevron Corporation", "CVX", "US", "automotive", [
        "Chevron", "Texaco", "Havoline", "Techron",
    ]),
    ("shell", "Shell plc", "SHEL", "GB", "automotive", [
        "Shell", "Pennzoil", "Jiffy Lube", "Shell V-Power",
    ]),
    ("bp", "BP plc", "BP", "GB", "automotive", [
        "BP", "Castrol", "Aral", "ampm",
    ]),
    ("valvoline", "Valvoline", "VVV", "US", "automotive", [
        "Valvoline", "Valvoline Instant Oil Change",
    ]),
    ("goodyear", "Goodyear Tire", "GT", "US", "automotive", [
        "Goodyear", "Dunlop", "Kelly Tires",
    ]),
    ("bridgestone", "Bridgestone", "BRDCY", "JP", "automotive", [
        "Bridgestone", "Firestone",
    ]),
    ("autozone", "AutoZone", "AZO", "US", "automotive", [
        "AutoZone", "Duralast", "Valucraft",
    ]),

    # === RETAIL & E-COMMERCE ===
    ("walmart", "Walmart Inc.", "WMT", "US", "retail-ecommerce", [
        "Walmart", "Sam's Club", "Great Value", "Equate", "Mainstays",
        "George (clothing)", "Parent's Choice", "Ol' Roy",
    ]),
    ("target-corp", "Target Corporation", "TGT", "US", "retail-ecommerce", [
        "Target", "Good & Gather", "Up & Up", "Threshold", "Cat & Jack",
        "Favorite Day", "Kindfull", "Dealworthy",
    ]),
    ("costco", "Costco Wholesale", "COST", "US", "retail-ecommerce", [
        "Costco", "Kirkland Signature",
    ]),
    ("kroger", "The Kroger Co.", "KR", "US", "retail-ecommerce", [
        "Kroger", "Fred Meyer", "Ralph's", "King Soopers", "Fry's",
        "Simple Truth", "Private Selection", "Home Chef",
    ]),
    ("albertsons", "Albertsons Companies", "ACI", "US", "retail-ecommerce", [
        "Albertsons", "Safeway", "Vons", "Jewel-Osco", "ACME",
        "Signature SELECT", "Open Nature", "O Organics",
    ]),
    ("dollar-general", "Dollar General", "DG", "US", "retail-ecommerce", [
        "Dollar General", "Clover Valley", "DG Home", "DG Health",
    ]),
    ("dollar-tree", "Dollar Tree / Family Dollar", "DLTR", "US", "retail-ecommerce", [
        "Dollar Tree", "Family Dollar",
    ]),
    ("home-depot", "The Home Depot", "HD", "US", "retail-ecommerce", [
        "Home Depot", "Husky", "HDX", "Glacier Bay", "Hampton Bay", "Vigoro",
    ]),
    ("lowes", "Lowe's Companies", "LOW", "US", "retail-ecommerce", [
        "Lowe's", "Kobalt", "allen + roth", "Style Selections",
    ]),
    ("amazon-retail", "Amazon (retail)", "AMZN", "US", "retail-ecommerce", [
        "Amazon Basics", "Amazon Essentials", "Whole Foods 365",
        "Mama Bear", "Solimo", "Presto!",
    ]),
    ("walgreens", "Walgreens Boots Alliance", "WBA", "US", "retail-ecommerce", [
        "Walgreens", "Boots", "No7", "Nice!", "Well at Walgreens",
    ]),
    ("cvs", "CVS Health", "CVS", "US", "retail-ecommerce", [
        "CVS Pharmacy", "CVS Health (store brand)", "Gold Emblem", "Live Better",
    ]),
    ("publix", "Publix Super Markets", None, "US", "retail-ecommerce", [
        "Publix", "Publix Premium", "GreenWise",
    ]),
    ("aldi", "Aldi (US)", None, "DE", "retail-ecommerce", [
        "Aldi", "Clancy's", "Fit & Active", "Simply Nature",
        "Mama Cozzi's", "Deutsche Kuche", "Elevation",
    ]),
    ("trader-joes", "Trader Joe's", None, "US", "retail-ecommerce", [
        "Trader Joe's", "Trader Ming's", "Trader Giotto's",
    ]),
    ("bath-body-works", "Bath & Body Works", "BBWI", "US", "retail-ecommerce", [
        "Bath & Body Works", "White Barn",
    ]),

    # === RESTAURANTS & FOOD SERVICE ===
    ("mcdonalds", "McDonald's Corporation", "MCD", "US", "restaurants-food-service", [
        "McDonald's", "McCafe",
    ]),
    ("starbucks-corp", "Starbucks Corporation", "SBUX", "US", "restaurants-food-service", [
        "Starbucks", "Teavana", "Starbucks Reserve", "Evolution Fresh",
    ]),
    ("yum-brands", "Yum! Brands", "YUM", "US", "restaurants-food-service", [
        "Taco Bell", "KFC", "Pizza Hut", "The Habit Burger Grill",
    ]),
    ("restaurant-brands", "Restaurant Brands International", "QSR", "CA", "restaurants-food-service", [
        "Burger King", "Tim Hortons", "Popeyes", "Firehouse Subs",
    ]),
    ("chipotle", "Chipotle Mexican Grill", "CMG", "US", "restaurants-food-service", [
        "Chipotle",
    ]),
    ("chick-fil-a", "Chick-fil-A", None, "US", "restaurants-food-service", [
        "Chick-fil-A",
    ]),
    ("wendys", "Wendy's Company", "WEN", "US", "restaurants-food-service", [
        "Wendy's",
    ]),
    ("dominos", "Domino's Pizza", "DPZ", "US", "restaurants-food-service", [
        "Domino's",
    ]),
    ("darden", "Darden Restaurants", "DRI", "US", "restaurants-food-service", [
        "Olive Garden", "LongHorn Steakhouse", "Cheddar's", "Yard House", "The Capital Grille",
    ]),
    ("inspire-brands", "Inspire Brands", None, "US", "restaurants-food-service", [
        "Arby's", "Buffalo Wild Wings", "Sonic Drive-In", "Jimmy John's", "Dunkin' (restaurants)",
    ]),
    ("papa-johns", "Papa John's", "PZZA", "US", "restaurants-food-service", [
        "Papa John's",
    ]),
    ("subway", "Subway", None, "US", "restaurants-food-service", [
        "Subway",
    ]),
    ("jack-in-the-box", "Jack in the Box", "JACK", "US", "restaurants-food-service", [
        "Jack in the Box", "Del Taco",
    ]),

    # === FINANCIAL SERVICES ===
    ("jpmorgan", "JPMorgan Chase", "JPM", "US", "financial-services", [
        "Chase", "J.P. Morgan", "Chase Sapphire",
    ]),
    ("bank-of-america", "Bank of America", "BAC", "US", "financial-services", [
        "Bank of America", "Merrill Lynch",
    ]),
    ("wells-fargo", "Wells Fargo", "WFC", "US", "financial-services", [
        "Wells Fargo",
    ]),
    ("citigroup", "Citigroup", "C", "US", "financial-services", [
        "Citi", "Citibank",
    ]),
    ("capital-one", "Capital One", "COF", "US", "financial-services", [
        "Capital One", "Capital One 360",
    ]),
    ("american-express", "American Express", "AXP", "US", "financial-services", [
        "Amex", "American Express",
    ]),
    ("visa", "Visa Inc.", "V", "US", "financial-services", [
        "Visa",
    ]),
    ("mastercard", "Mastercard", "MA", "US", "financial-services", [
        "Mastercard",
    ]),
    ("paypal", "PayPal Holdings", "PYPL", "US", "financial-services", [
        "PayPal", "Venmo",
    ]),
    ("goldman-sachs", "Goldman Sachs", "GS", "US", "financial-services", [
        "Goldman Sachs", "Marcus",
    ]),
    ("state-farm", "State Farm", None, "US", "financial-services", [
        "State Farm",
    ]),
    ("allstate", "Allstate Corporation", "ALL", "US", "financial-services", [
        "Allstate", "Esurance",
    ]),
    ("progressive", "Progressive Corporation", "PGR", "US", "financial-services", [
        "Progressive",
    ]),
    ("blackrock", "BlackRock", "BLK", "US", "financial-services", [
        "BlackRock", "iShares",
    ]),

    # === TELECOM & INTERNET ===
    ("att", "AT&T Inc.", "T", "US", "telecom-internet", [
        "AT&T", "AT&T Fiber", "Cricket Wireless", "DirecTV",
    ]),
    ("verizon", "Verizon Communications", "VZ", "US", "telecom-internet", [
        "Verizon", "Verizon Fios", "Visible", "TracFone",
    ]),
    ("t-mobile", "T-Mobile US", "TMUS", "US", "telecom-internet", [
        "T-Mobile", "Metro by T-Mobile", "Sprint",
    ]),
    ("comcast", "Comcast Corporation", "CMCSA", "US", "telecom-internet", [
        "Xfinity", "Comcast Business", "NBCUniversal", "Peacock",
    ]),
    ("charter", "Charter Communications", "CHTR", "US", "telecom-internet", [
        "Spectrum", "Spectrum Mobile",
    ]),
    ("dish", "DISH Network", "DISH", "US", "telecom-internet", [
        "DISH", "Sling TV", "Boost Mobile",
    ]),

    # === ENTERTAINMENT & MEDIA ===
    ("disney", "The Walt Disney Company", "DIS", "US", "entertainment-media", [
        "Disney", "Disney+", "Pixar", "Marvel", "Star Wars (Lucasfilm)",
        "ESPN", "Hulu", "ABC", "National Geographic", "FX",
    ]),
    ("netflix", "Netflix", "NFLX", "US", "entertainment-media", [
        "Netflix",
    ]),
    ("warner-bros", "Warner Bros. Discovery", "WBD", "US", "entertainment-media", [
        "HBO", "Max", "Warner Bros.", "CNN", "Discovery Channel",
        "Cartoon Network", "DC Comics", "TBS", "TNT",
    ]),
    ("paramount", "Paramount Global", "PARA", "US", "entertainment-media", [
        "Paramount+", "CBS", "Showtime", "MTV", "Nickelodeon",
        "BET", "Comedy Central",
    ]),
    ("fox-corp", "Fox Corporation", "FOXA", "US", "entertainment-media", [
        "Fox News", "Fox Sports", "Fox Broadcasting", "Tubi",
    ]),
    ("spotify", "Spotify", "SPOT", "SE", "entertainment-media", [
        "Spotify",
    ]),
    ("electronic-arts", "Electronic Arts", "EA", "US", "entertainment-media", [
        "EA Sports", "Madden", "FIFA (EA FC)", "Battlefield", "The Sims", "Apex Legends",
    ]),
    ("activision", "Activision Blizzard (Microsoft)", "MSFT", "US", "entertainment-media", [
        "Call of Duty", "World of Warcraft", "Overwatch", "Diablo", "Candy Crush",
    ]),
    ("take-two", "Take-Two Interactive", "TTWO", "US", "entertainment-media", [
        "GTA (Rockstar)", "NBA 2K", "Red Dead Redemption", "BioShock", "Civilization",
    ]),
    ("news-corp", "News Corp", "NWSA", "US", "entertainment-media", [
        "Wall Street Journal", "New York Post", "Dow Jones", "HarperCollins",
    ]),
    ("nyt", "The New York Times", "NYT", "US", "entertainment-media", [
        "New York Times", "The Athletic", "Wirecutter", "Wordle",
    ]),
    ("sirius-xm", "Sirius XM", "SIRI", "US", "entertainment-media", [
        "SiriusXM", "Pandora",
    ]),
    ("live-nation", "Live Nation Entertainment", "LYV", "US", "entertainment-media", [
        "Ticketmaster", "Live Nation",
    ]),

    # === HOME & FURNITURE ===
    ("ikea", "IKEA (Ingka Group)", None, "SE", "home-furniture", [
        "IKEA",
    ]),
    ("wayfair", "Wayfair", "W", "US", "home-furniture", [
        "Wayfair", "AllModern", "Joss & Main", "Birch Lane",
    ]),
    ("williams-sonoma", "Williams-Sonoma", "WSM", "US", "home-furniture", [
        "Williams Sonoma", "Pottery Barn", "West Elm", "Rejuvenation", "Mark and Graham",
    ]),
    ("rh", "RH (Restoration Hardware)", "RH", "US", "home-furniture", [
        "RH", "RH Modern", "RH Baby & Child",
    ]),
    ("whirlpool", "Whirlpool Corporation", "WHR", "US", "home-furniture", [
        "Whirlpool", "Maytag", "KitchenAid", "Amana", "JennAir",
    ]),
    ("ge-appliances", "GE Appliances (Haier)", None, "CN", "home-furniture", [
        "GE Appliances", "Cafe", "Profile", "Monogram", "Hotpoint",
    ]),
    ("stanley-bnd", "Stanley Black & Decker", "SWK", "US", "home-furniture", [
        "Stanley", "Black & Decker", "DeWalt", "Craftsman", "Irwin",
    ]),
    ("sherwin-williams", "Sherwin-Williams", "SHW", "US", "home-furniture", [
        "Sherwin-Williams", "Valspar", "HGTV Home", "Minwax", "Krylon",
    ]),
    ("scotts-miracle", "Scotts Miracle-Gro", "SMG", "US", "home-furniture", [
        "Scotts", "Miracle-Gro", "Ortho", "Roundup (lawn)", "Tomcat",
    ]),
    ("tempur-sealy", "Tempur Sealy", "TPX", "US", "home-furniture", [
        "Tempur-Pedic", "Sealy", "Stearns & Foster",
    ]),
    ("sleep-number", "Sleep Number", "SNBR", "US", "home-furniture", [
        "Sleep Number",
    ]),
    ("church-and-dwight-home", "Spectrum Brands (home)", "SPB", "US", "home-furniture", [
        "Kwikset", "Pfister", "National Hardware",
    ]),
    ("weber", "Weber Inc.", "WEBR", "US", "home-furniture", [
        "Weber", "Weber Spirit", "Weber Genesis",
    ]),
    ("traeger", "Traeger Grills", "COOK", "US", "home-furniture", [
        "Traeger",
    ]),
    ("yeti", "YETI Holdings", "YETI", "US", "home-furniture", [
        "YETI", "YETI Rambler", "YETI Tundra",
    ]),
    ("tupperware", "Tupperware Brands", "TUP", "US", "home-furniture", [
        "Tupperware",
    ]),

    # === TOBACCO & ALCOHOL ===
    ("altria", "Altria Group", "MO", "US", "tobacco-alcohol", [
        "Marlboro", "Black & Mild", "Copenhagen", "Skoal", "NJOY", "on!",
    ]),
    ("philip-morris-intl", "Philip Morris International", "PM", "US", "tobacco-alcohol", [
        "Marlboro (international)", "IQOS", "Parliament", "L&M", "Chesterfield", "ZYN",
    ]),
    ("reynolds-american", "Reynolds American (BAT)", None, "US", "tobacco-alcohol", [
        "Camel", "Newport", "Pall Mall", "Natural American Spirit", "Vuse", "Grizzly",
    ]),
    ("diageo-spirits", "Diageo", "DEO", "GB", "tobacco-alcohol", [
        "Johnnie Walker", "Smirnoff", "Captain Morgan", "Tanqueray", "Guinness",
        "Baileys", "Don Julio", "Casamigos", "Crown Royal", "Ketel One",
    ]),
    ("constellation", "Constellation Brands", "STZ", "US", "tobacco-alcohol", [
        "Corona", "Modelo", "Pacifico", "Robert Mondavi", "Kim Crawford",
        "Meiomi", "The Prisoner", "SVEDKA",
    ]),
    ("brown-forman", "Brown-Forman", "BF.B", "US", "tobacco-alcohol", [
        "Jack Daniel's", "Woodford Reserve", "Old Forester", "Herradura",
        "el Jimador", "Finlandia",
    ]),
    ("boston-beer", "Boston Beer Company", "SAM", "US", "tobacco-alcohol", [
        "Samuel Adams", "Truly Hard Seltzer", "Twisted Tea", "Angry Orchard", "Dogfish Head",
    ]),

    # === BABY & KIDS (dedicated companies beyond P&G/Kimberly-Clark) ===
    ("gerber-nestle", "Gerber Products (Nestle)", None, "US", "baby-kids", [
        "Gerber Baby Food", "Gerber Graduates", "Gerber Lil' Crunchies",
    ]),
    ("mattel", "Mattel", "MAT", "US", "baby-kids", [
        "Barbie", "Hot Wheels", "Fisher-Price", "Thomas & Friends",
        "Mega Bloks", "American Girl", "UNO",
    ]),
    ("hasbro", "Hasbro", "HAS", "US", "baby-kids", [
        "Nerf", "Transformers", "Monopoly", "Play-Doh", "My Little Pony",
        "Dungeons & Dragons", "Magic: The Gathering", "Peppa Pig",
    ]),
    ("lego", "The LEGO Group", None, "DK", "baby-kids", [
        "LEGO", "LEGO Technic", "LEGO Duplo",
    ]),
    ("graco", "Graco (Newell Brands)", None, "US", "baby-kids", [
        "Graco", "Baby Jogger", "NUK", "Dr. Brown's",
    ]),
]


def run():
    db = SessionLocal()
    try:
        # Build industry slug->id map
        industry_map = {}
        for row in db.execute(text("SELECT id, slug FROM industries")).fetchall():
            industry_map[row[1]] = row[0]

        # Build category slug->id map
        cat_map = {}
        for row in db.execute(text("SELECT id, slug FROM product_categories")).fetchall():
            cat_map[row[1]] = row[0]

        # Check existing company slugs
        existing = set()
        for row in db.execute(text("SELECT slug FROM companies")).fetchall():
            existing.add(row[0])

        companies_added = 0
        brands_added = 0

        for slug, name, ticker, country, ind_slug, brands in NEW_COMPANIES:
            if slug in existing:
                # Update industry_id if not set
                db.execute(text(
                    "UPDATE companies SET industry_id = :iid WHERE slug = :slug AND industry_id IS NULL"
                ), {"iid": industry_map.get(ind_slug), "slug": slug})
                continue

            ind_id = industry_map.get(ind_slug)
            db.execute(text("""
                INSERT INTO companies (slug, name, ticker, industry, country, industry_id)
                VALUES (:slug, :name, :ticker, :industry, :country, :ind_id)
            """), {
                "slug": slug, "name": name, "ticker": ticker,
                "industry": ind_slug.replace("-", " ").title(),
                "country": country, "ind_id": ind_id,
            })
            companies_added += 1

            # Get the new company ID
            cid = db.execute(text("SELECT id FROM companies WHERE slug = :slug"), {"slug": slug}).scalar()

            for brand_name in brands:
                db.execute(text("""
                    INSERT INTO brands (company_id, name) VALUES (:cid, :bname)
                """), {"cid": cid, "bname": brand_name})
                brands_added += 1

        db.commit()
        print(f"Added {companies_added} companies, {brands_added} brands")

        # Now categorize all new brands that don't have category_id
        # We'll use a simple approach: most non-food brands get a generic category
        # based on their industry
        INDUSTRY_TO_CATEGORY = {
            "clothing-apparel": None,  # no matching product_category yet
            "electronics-tech": None,
            "automotive": None,
            "retail-ecommerce": None,
            "restaurants-food-service": None,
            "financial-services": None,
            "telecom-internet": None,
            "entertainment-media": None,
            "home-furniture": None,
            "tobacco-alcohol": None,
            "baby-kids": "baby",
        }

        # We need product categories for the new industries
        # Add top-level categories for industries that don't have them
        new_cats = [
            ("clothing", "Clothing & Apparel", None),
            ("footwear", "Footwear", "clothing"),
            ("sportswear", "Sportswear", "clothing"),
            ("luxury-fashion", "Luxury Fashion", "clothing"),
            ("casual-wear", "Casual Wear", "clothing"),
            ("electronics", "Electronics", None),
            ("smartphones", "Smartphones", "electronics"),
            ("computers", "Computers & Laptops", "electronics"),
            ("gaming", "Gaming", "electronics"),
            ("audio", "Audio", "electronics"),
            ("smart-home", "Smart Home", "electronics"),
            ("automotive-cat", "Automotive", None),
            ("cars", "Cars", "automotive-cat"),
            ("fuel-gas", "Fuel & Gas", "automotive-cat"),
            ("tires", "Tires", "automotive-cat"),
            ("auto-parts", "Auto Parts", "automotive-cat"),
            ("retail", "Retail Stores", None),
            ("grocery-stores", "Grocery Stores", "retail"),
            ("department-stores", "Department Stores", "retail"),
            ("home-improvement", "Home Improvement", "retail"),
            ("pharmacy", "Pharmacy", "retail"),
            ("restaurants", "Restaurants", None),
            ("fast-food", "Fast Food", "restaurants"),
            ("casual-dining", "Casual Dining", "restaurants"),
            ("coffee-shops", "Coffee Shops", "restaurants"),
            ("pizza-delivery", "Pizza Delivery", "restaurants"),
            ("financial", "Financial Services", None),
            ("banks", "Banks", "financial"),
            ("credit-cards", "Credit Cards", "financial"),
            ("insurance", "Insurance", "financial"),
            ("investment", "Investment", "financial"),
            ("telecom", "Telecom", None),
            ("wireless-carriers", "Wireless Carriers", "telecom"),
            ("internet-providers", "Internet Providers", "telecom"),
            ("streaming-tv", "Streaming & TV", "telecom"),
            ("entertainment", "Entertainment", None),
            ("streaming-services", "Streaming Services", "entertainment"),
            ("video-games", "Video Games", "entertainment"),
            ("movies-tv", "Movies & TV", "entertainment"),
            ("music", "Music", "entertainment"),
            ("news-publishing", "News & Publishing", "entertainment"),
            ("live-events", "Live Events", "entertainment"),
            ("home-garden", "Home & Garden", None),
            ("furniture", "Furniture", "home-garden"),
            ("appliances", "Appliances", "home-garden"),
            ("tools", "Tools", "home-garden"),
            ("paint", "Paint", "home-garden"),
            ("outdoor-grills", "Outdoor & Grills", "home-garden"),
            ("bedding", "Bedding & Mattresses", "home-garden"),
            ("kitchenware", "Kitchenware", "home-garden"),
            ("tobacco", "Tobacco & Nicotine", None),
            ("cigarettes", "Cigarettes", "tobacco"),
            ("vaping", "Vaping & E-Cigarettes", "tobacco"),
            ("smokeless-tobacco", "Smokeless Tobacco", "tobacco"),
            ("alcohol", "Alcoholic Beverages", None),
            ("whiskey-bourbon", "Whiskey & Bourbon", "alcohol"),
            ("vodka-gin", "Vodka & Gin", "alcohol"),
            ("craft-beer", "Craft Beer", "alcohol"),
            ("hard-seltzer", "Hard Seltzer", "alcohol"),
            ("toys", "Toys & Games", None),
            ("action-figures", "Action Figures & Dolls", "toys"),
            ("board-games", "Board & Card Games", "toys"),
            ("building-toys", "Building Toys", "toys"),
            ("baby-gear", "Baby Gear", "baby"),
        ]

        for slug, name, parent_slug in new_cats:
            exists = db.execute(text("SELECT id FROM product_categories WHERE slug = :s"), {"s": slug}).scalar()
            if exists:
                continue
            parent_id = None
            if parent_slug:
                parent_id = db.execute(text("SELECT id FROM product_categories WHERE slug = :s"), {"s": parent_slug}).scalar()
            db.execute(text(
                "INSERT INTO product_categories (slug, name, parent_id) VALUES (:s, :n, :p)"
            ), {"s": slug, "n": name, "p": parent_id})
        db.commit()

        # Rebuild cat_map
        cat_map = {}
        for row in db.execute(text("SELECT id, slug FROM product_categories")).fetchall():
            cat_map[row[1]] = row[0]

        # Brand -> category mapping for new brands
        BRAND_CATS = {
            # Clothing
            "Nike": "sportswear", "Jordan": "footwear", "Converse": "footwear",
            "Nike ACG": "sportswear", "Nike SB": "footwear",
            "Adidas": "sportswear", "Adidas Originals": "casual-wear", "Reebok": "sportswear", "Y-3": "luxury-fashion",
            "Calvin Klein": "casual-wear", "Tommy Hilfiger": "casual-wear",
            "Van Heusen": "casual-wear", "IZOD": "casual-wear", "Arrow": "casual-wear",
            "Hanes": "casual-wear", "Champion": "sportswear",
            "Playtex (apparel)": "casual-wear", "Bali": "casual-wear", "Maidenform": "casual-wear",
            "The North Face": "sportswear", "Timberland": "footwear", "Dickies": "casual-wear",
            "Vans": "footwear", "Supreme": "casual-wear", "Icebreaker": "sportswear",
            "Gap": "casual-wear", "Old Navy": "casual-wear", "Banana Republic": "casual-wear", "Athleta": "sportswear",
            "Levi's": "casual-wear", "Dockers": "casual-wear", "Denizen": "casual-wear",
            "Signature by Levi Strauss": "casual-wear",
            "Coach": "luxury-fashion", "Kate Spade": "luxury-fashion", "Stuart Weitzman": "footwear",
            "Michael Kors": "luxury-fashion", "Versace": "luxury-fashion", "Jimmy Choo": "footwear",
            "Ralph Lauren": "luxury-fashion", "Polo": "casual-wear", "Lauren": "casual-wear",
            "Chaps": "casual-wear", "Club Monaco": "casual-wear",
            "Under Armour": "sportswear", "UA HOVR": "footwear", "Project Rock": "sportswear",
            "Columbia": "sportswear", "SOREL": "footwear", "Mountain Hardwear": "sportswear", "prAna": "casual-wear",
            "Skechers": "footwear", "Skechers Sport": "footwear", "Skechers Work": "footwear",
            "Merrell": "footwear", "Saucony": "footwear", "Wolverine": "footwear",
            "Cat Footwear": "footwear", "Chaco": "footwear", "Hush Puppies": "footwear", "Keds": "footwear",
            "Zara": "casual-wear", "Massimo Dutti": "casual-wear", "Pull & Bear": "casual-wear",
            "Bershka": "casual-wear", "Stradivarius": "casual-wear", "Oysho": "casual-wear",
            "H&M": "casual-wear", "COS": "casual-wear", "& Other Stories": "casual-wear",
            "Weekday": "casual-wear", "Monki": "casual-wear", "ARKET": "casual-wear",
            "Uniqlo": "casual-wear", "GU": "casual-wear", "Theory": "casual-wear", "Helmut Lang": "luxury-fashion",
            "New Balance": "footwear", "NB Numeric": "footwear", "Warrior Sports": "sportswear",
            "Crocs": "footwear", "HEYDUDE": "footwear",
            "UGG": "footwear", "HOKA": "footwear", "Teva": "footwear", "Sanuk": "footwear",
            "Gear for Sports": "sportswear",
            # Electronics
            "iPhone": "smartphones", "iPad": "computers", "Mac": "computers",
            "Apple Watch": "smart-home", "AirPods": "audio", "Apple TV": "smart-home",
            "HomePod": "audio", "Vision Pro": "gaming", "Beats": "audio",
            "Galaxy": "smartphones", "Samsung TV": "electronics", "Samsung Appliances": "appliances",
            "Bixby": "smart-home", "Harman Kardon": "audio", "JBL": "audio",
            "PlayStation": "gaming", "Sony TV (Bravia)": "electronics", "Sony Audio": "audio",
            "Sony Cameras (Alpha)": "electronics", "Inzone": "gaming",
            "LG TV": "electronics", "LG Appliances": "appliances", "LG Gram": "computers", "LG ThinQ": "smart-home",
            "Xbox": "gaming", "Surface": "computers", "Windows": "computers",
            "Microsoft 365": "computers", "LinkedIn": "electronics", "GitHub": "electronics",
            "Google": "electronics", "Pixel": "smartphones", "Nest": "smart-home",
            "Chromecast": "smart-home", "YouTube": "streaming-services", "Fitbit": "smart-home", "Waymo": "electronics",
            "Kindle": "electronics", "Echo": "smart-home", "Fire TV": "smart-home",
            "Ring": "smart-home", "Blink": "smart-home", "Eero": "smart-home", "Alexa": "smart-home",
            "Meta Quest": "gaming", "Facebook": "electronics", "Instagram": "electronics",
            "WhatsApp": "electronics", "Ray-Ban Meta": "electronics",
            "Dell": "computers", "Alienware": "gaming", "Dell XPS": "computers", "Dell Inspiron": "computers",
            "HP": "computers", "HP Spectre": "computers", "HP Envy": "computers",
            "HP Pavilion": "computers", "HP Omen": "gaming",
            "Lenovo": "computers", "ThinkPad": "computers", "IdeaPad": "computers",
            "Legion": "gaming", "Motorola": "smartphones",
            "Intel Core": "computers", "Intel Arc": "gaming", "Intel Evo": "computers",
            "GeForce": "gaming", "NVIDIA Shield": "gaming", "RTX": "gaming",
            "Ryzen": "computers", "Radeon": "gaming", "EPYC": "computers",
            "Bose": "audio", "Bose QuietComfort": "audio", "Bose SoundLink": "audio",
            "Logitech": "computers", "Logitech G": "gaming",
            "Blue Microphones": "audio", "Ultimate Ears": "audio", "Streamlabs": "gaming",
            "Nintendo Switch": "gaming", "Game Boy": "gaming", "Amiibo": "gaming",
            "Dyson": "appliances", "Dyson Airwrap": "appliances", "Dyson V15": "appliances", "Dyson Purifier": "appliances",
            # Automotive
            "Chevrolet": "cars", "GMC": "cars", "Cadillac": "cars", "Buick": "cars",
            "Corvette": "cars", "Hummer EV": "cars",
            "Ford": "cars", "Lincoln": "cars", "Ford Mustang": "cars", "Ford F-150": "cars", "Bronco": "cars",
            "Jeep": "cars", "Ram": "cars", "Dodge": "cars", "Chrysler": "cars",
            "Fiat": "cars", "Alfa Romeo": "cars", "Maserati": "cars",
            "Toyota": "cars", "Lexus": "cars", "Toyota Tacoma": "cars", "Toyota Camry": "cars", "RAV4": "cars",
            "Honda": "cars", "Acura": "cars", "Honda Civic": "cars", "Honda CR-V": "cars",
            "Tesla Model 3": "cars", "Tesla Model Y": "cars", "Tesla Model S": "cars",
            "Tesla Model X": "cars", "Cybertruck": "cars", "Tesla Energy": "cars",
            "Volkswagen": "cars", "Audi": "cars", "Porsche": "cars",
            "Lamborghini": "cars", "Bentley": "cars", "Ducati": "cars",
            "BMW": "cars", "MINI": "cars", "Rolls-Royce": "cars",
            "Mercedes-Benz": "cars", "AMG": "cars", "Mercedes EQ": "cars",
            "Hyundai": "cars", "Kia": "cars", "Genesis": "cars",
            "Nissan": "cars", "Infiniti": "cars", "Nissan Leaf": "cars",
            "Subaru": "cars", "Subaru Outback": "cars", "Subaru Forester": "cars", "WRX": "cars",
            "Mazda": "cars", "Mazda CX-5": "cars", "Mazda MX-5 Miata": "cars",
            "Rivian R1T": "cars", "Rivian R1S": "cars",
            "Exxon": "fuel-gas", "Mobil": "fuel-gas", "Esso": "fuel-gas", "Mobil 1": "fuel-gas",
            "Chevron": "fuel-gas", "Texaco": "fuel-gas", "Havoline": "fuel-gas", "Techron": "fuel-gas",
            "Shell": "fuel-gas", "Pennzoil": "fuel-gas", "Jiffy Lube": "fuel-gas", "Shell V-Power": "fuel-gas",
            "BP": "fuel-gas", "Castrol": "fuel-gas", "Aral": "fuel-gas", "ampm": "fuel-gas",
            "Valvoline": "fuel-gas", "Valvoline Instant Oil Change": "fuel-gas",
            "Goodyear": "tires", "Dunlop": "tires", "Kelly Tires": "tires",
            "Bridgestone": "tires", "Firestone": "tires",
            "AutoZone": "auto-parts", "Duralast": "auto-parts", "Valucraft": "auto-parts",
            # Retail
            "Walmart": "grocery-stores", "Sam's Club": "grocery-stores",
            "Great Value": "grocery-stores", "Equate": "pharmacy",
            "Mainstays": "department-stores", "George (clothing)": "department-stores",
            "Parent's Choice": "grocery-stores", "Ol' Roy": "grocery-stores",
            "Target": "department-stores", "Good & Gather": "grocery-stores",
            "Up & Up": "pharmacy", "Threshold": "department-stores",
            "Cat & Jack": "department-stores", "Favorite Day": "grocery-stores",
            "Kindfull": "grocery-stores", "Dealworthy": "department-stores",
            "Costco": "grocery-stores", "Kirkland Signature": "grocery-stores",
            "Kroger": "grocery-stores", "Fred Meyer": "grocery-stores",
            "Ralph's": "grocery-stores", "King Soopers": "grocery-stores", "Fry's": "grocery-stores",
            "Simple Truth": "grocery-stores", "Private Selection": "grocery-stores", "Home Chef": "grocery-stores",
            "Albertsons": "grocery-stores", "Safeway": "grocery-stores",
            "Vons": "grocery-stores", "Jewel-Osco": "grocery-stores", "ACME": "grocery-stores",
            "Signature SELECT": "grocery-stores", "Open Nature": "grocery-stores", "O Organics": "grocery-stores",
            "Dollar General": "department-stores", "Clover Valley": "grocery-stores",
            "DG Home": "department-stores", "DG Health": "pharmacy",
            "Dollar Tree": "department-stores", "Family Dollar": "department-stores",
            "Home Depot": "home-improvement", "Husky": "tools",
            "HDX": "home-improvement", "Glacier Bay": "home-improvement",
            "Hampton Bay": "home-improvement", "Vigoro": "home-improvement",
            "Lowe's": "home-improvement", "Kobalt": "tools",
            "allen + roth": "home-improvement", "Style Selections": "home-improvement",
            "Amazon Basics": "department-stores", "Amazon Essentials": "department-stores",
            "Whole Foods 365": "grocery-stores", "Mama Bear": "grocery-stores",
            "Solimo": "grocery-stores", "Presto!": "department-stores",
            "Walgreens": "pharmacy", "Boots": "pharmacy", "No7": "pharmacy",
            "Nice!": "pharmacy", "Well at Walgreens": "pharmacy",
            "CVS Pharmacy": "pharmacy", "CVS Health (store brand)": "pharmacy",
            "Gold Emblem": "pharmacy", "Live Better": "pharmacy",
            "Publix": "grocery-stores", "Publix Premium": "grocery-stores", "GreenWise": "grocery-stores",
            "Aldi": "grocery-stores", "Clancy's": "grocery-stores",
            "Fit & Active": "grocery-stores", "Simply Nature": "grocery-stores",
            "Mama Cozzi's": "grocery-stores", "Deutsche Kuche": "grocery-stores", "Elevation": "grocery-stores",
            "Trader Joe's": "grocery-stores", "Trader Ming's": "grocery-stores", "Trader Giotto's": "grocery-stores",
            "Bath & Body Works": "department-stores", "White Barn": "department-stores",
            # Restaurants
            "McDonald's": "fast-food", "McCafe": "coffee-shops",
            "Starbucks": "coffee-shops", "Teavana": "coffee-shops",
            "Starbucks Reserve": "coffee-shops", "Evolution Fresh": "coffee-shops",
            "Taco Bell": "fast-food", "KFC": "fast-food", "Pizza Hut": "pizza-delivery",
            "The Habit Burger Grill": "fast-food",
            "Burger King": "fast-food", "Tim Hortons": "coffee-shops",
            "Popeyes": "fast-food", "Firehouse Subs": "fast-food",
            "Chipotle": "fast-food", "Chick-fil-A": "fast-food",
            "Wendy's": "fast-food", "Domino's": "pizza-delivery",
            "Olive Garden": "casual-dining", "LongHorn Steakhouse": "casual-dining",
            "Cheddar's": "casual-dining", "Yard House": "casual-dining",
            "The Capital Grille": "casual-dining",
            "Arby's": "fast-food", "Buffalo Wild Wings": "casual-dining",
            "Sonic Drive-In": "fast-food", "Jimmy John's": "fast-food",
            "Dunkin' (restaurants)": "coffee-shops",
            "Papa John's": "pizza-delivery", "Subway": "fast-food",
            "Jack in the Box": "fast-food", "Del Taco": "fast-food",
            # Financial
            "Chase": "banks", "J.P. Morgan": "investment", "Chase Sapphire": "credit-cards",
            "Bank of America": "banks", "Merrill Lynch": "investment",
            "Wells Fargo": "banks", "Citi": "banks", "Citibank": "banks",
            "Capital One": "banks", "Capital One 360": "banks",
            "Amex": "credit-cards", "American Express": "credit-cards",
            "Visa": "credit-cards", "Mastercard": "credit-cards",
            "PayPal": "financial", "Venmo": "financial",
            "Goldman Sachs": "investment", "Marcus": "banks",
            "State Farm": "insurance", "Allstate": "insurance", "Esurance": "insurance",
            "Progressive": "insurance",
            "BlackRock": "investment", "iShares": "investment",
            # Telecom
            "AT&T": "wireless-carriers", "AT&T Fiber": "internet-providers",
            "Cricket Wireless": "wireless-carriers", "DirecTV": "streaming-tv",
            "Verizon": "wireless-carriers", "Verizon Fios": "internet-providers",
            "Visible": "wireless-carriers", "TracFone": "wireless-carriers",
            "T-Mobile": "wireless-carriers", "Metro by T-Mobile": "wireless-carriers", "Sprint": "wireless-carriers",
            "Xfinity": "internet-providers", "Comcast Business": "internet-providers",
            "NBCUniversal": "streaming-tv", "Peacock": "streaming-services",
            "Spectrum": "internet-providers", "Spectrum Mobile": "wireless-carriers",
            "DISH": "streaming-tv", "Sling TV": "streaming-services", "Boost Mobile": "wireless-carriers",
            # Entertainment
            "Disney": "movies-tv", "Disney+": "streaming-services", "Pixar": "movies-tv",
            "Marvel": "movies-tv", "Star Wars (Lucasfilm)": "movies-tv",
            "ESPN": "live-events", "Hulu": "streaming-services", "ABC": "movies-tv",
            "National Geographic": "movies-tv", "FX": "movies-tv",
            "Netflix": "streaming-services",
            "HBO": "streaming-services", "Max": "streaming-services", "Warner Bros.": "movies-tv",
            "CNN": "news-publishing", "Discovery Channel": "movies-tv",
            "Cartoon Network": "movies-tv", "DC Comics": "movies-tv", "TBS": "movies-tv", "TNT": "movies-tv",
            "Paramount+": "streaming-services", "CBS": "movies-tv", "Showtime": "streaming-services",
            "MTV": "movies-tv", "Nickelodeon": "movies-tv",
            "BET": "movies-tv", "Comedy Central": "movies-tv",
            "Fox News": "news-publishing", "Fox Sports": "live-events",
            "Fox Broadcasting": "movies-tv", "Tubi": "streaming-services",
            "Spotify": "music",
            "EA Sports": "video-games", "Madden": "video-games", "FIFA (EA FC)": "video-games",
            "Battlefield": "video-games", "The Sims": "video-games", "Apex Legends": "video-games",
            "Call of Duty": "video-games", "World of Warcraft": "video-games",
            "Overwatch": "video-games", "Diablo": "video-games", "Candy Crush": "video-games",
            "GTA (Rockstar)": "video-games", "NBA 2K": "video-games",
            "Red Dead Redemption": "video-games", "BioShock": "video-games", "Civilization": "video-games",
            "Wall Street Journal": "news-publishing", "New York Post": "news-publishing",
            "Dow Jones": "news-publishing", "HarperCollins": "news-publishing",
            "New York Times": "news-publishing", "The Athletic": "news-publishing",
            "Wirecutter": "news-publishing", "Wordle": "video-games",
            "SiriusXM": "music", "Pandora": "music",
            "Ticketmaster": "live-events", "Live Nation": "live-events",
            # Home
            "IKEA": "furniture", "Wayfair": "furniture", "AllModern": "furniture",
            "Joss & Main": "furniture", "Birch Lane": "furniture",
            "Williams Sonoma": "kitchenware", "Pottery Barn": "furniture",
            "West Elm": "furniture", "Rejuvenation": "furniture", "Mark and Graham": "furniture",
            "RH": "furniture", "RH Modern": "furniture", "RH Baby & Child": "furniture",
            "Whirlpool": "appliances", "Maytag": "appliances", "KitchenAid": "kitchenware",
            "Amana": "appliances", "JennAir": "appliances",
            "GE Appliances": "appliances", "Cafe": "appliances", "Profile": "appliances",
            "Monogram": "appliances", "Hotpoint": "appliances",
            "Stanley": "tools", "Black & Decker": "tools", "DeWalt": "tools",
            "Craftsman": "tools", "Irwin": "tools",
            "Sherwin-Williams": "paint", "Valspar": "paint", "HGTV Home": "paint",
            "Minwax": "paint", "Krylon": "paint",
            "Scotts": "home-garden", "Miracle-Gro": "home-garden", "Ortho": "home-garden",
            "Roundup (lawn)": "home-garden", "Tomcat": "home-garden",
            "Tempur-Pedic": "bedding", "Sealy": "bedding", "Stearns & Foster": "bedding",
            "Sleep Number": "bedding",
            "Kwikset": "tools", "Pfister": "tools", "National Hardware": "tools",
            "Weber": "outdoor-grills", "Weber Spirit": "outdoor-grills", "Weber Genesis": "outdoor-grills",
            "Traeger": "outdoor-grills",
            "YETI": "outdoor-grills", "YETI Rambler": "kitchenware", "YETI Tundra": "outdoor-grills",
            "Tupperware": "kitchenware",
            # Tobacco
            "Marlboro": "cigarettes", "Black & Mild": "cigarettes",
            "Copenhagen": "smokeless-tobacco", "Skoal": "smokeless-tobacco",
            "NJOY": "vaping", "on!": "smokeless-tobacco",
            "Marlboro (international)": "cigarettes", "IQOS": "vaping",
            "Parliament": "cigarettes", "L&M": "cigarettes", "Chesterfield": "cigarettes",
            "ZYN": "smokeless-tobacco",
            "Camel": "cigarettes", "Newport": "cigarettes", "Pall Mall": "cigarettes",
            "Natural American Spirit": "cigarettes", "Vuse": "vaping", "Grizzly": "smokeless-tobacco",
            "Johnnie Walker": "whiskey-bourbon", "Smirnoff": "vodka-gin",
            "Captain Morgan": "spirits", "Tanqueray": "vodka-gin", "Guinness": "beer",
            "Baileys": "spirits", "Don Julio": "spirits", "Casamigos": "spirits",
            "Crown Royal": "whiskey-bourbon", "Ketel One": "vodka-gin",
            "Corona": "beer", "Modelo": "beer", "Pacifico": "beer",
            "Robert Mondavi": "wine", "Kim Crawford": "wine",
            "Meiomi": "wine", "The Prisoner": "wine", "SVEDKA": "vodka-gin",
            "Jack Daniel's": "whiskey-bourbon", "Woodford Reserve": "whiskey-bourbon",
            "Old Forester": "whiskey-bourbon", "Herradura": "spirits",
            "el Jimador": "spirits", "Finlandia": "vodka-gin",
            "Samuel Adams": "craft-beer", "Truly Hard Seltzer": "hard-seltzer",
            "Twisted Tea": "craft-beer", "Angry Orchard": "craft-beer", "Dogfish Head": "craft-beer",
            # Baby & Kids
            "Gerber Baby Food": "baby-food", "Gerber Graduates": "baby-food", "Gerber Lil' Crunchies": "baby-food",
            "Barbie": "action-figures", "Hot Wheels": "toys", "Fisher-Price": "toys",
            "Thomas & Friends": "toys", "Mega Bloks": "building-toys",
            "American Girl": "action-figures", "UNO": "board-games",
            "Nerf": "toys", "Transformers": "action-figures", "Monopoly": "board-games",
            "Play-Doh": "toys", "My Little Pony": "action-figures",
            "Dungeons & Dragons": "board-games", "Magic: The Gathering": "board-games",
            "Peppa Pig": "toys",
            "LEGO": "building-toys", "LEGO Technic": "building-toys", "LEGO Duplo": "building-toys",
            "Graco": "baby-gear", "Baby Jogger": "baby-gear", "NUK": "baby-care", "Dr. Brown's": "baby-care",
        }

        mapped = 0
        for bname, slug in BRAND_CATS.items():
            if slug in cat_map:
                result = db.execute(
                    text("UPDATE brands SET category_id = :cid WHERE name = :bname AND category_id IS NULL"),
                    {"cid": cat_map[slug], "bname": bname}
                )
                mapped += result.rowcount
        db.commit()
        print(f"Categorized {mapped} new brands")

        # Final stats
        total_companies = db.execute(text("SELECT COUNT(*) FROM companies")).scalar()
        total_brands = db.execute(text("SELECT COUNT(*) FROM brands")).scalar()
        categorized = db.execute(text("SELECT COUNT(*) FROM brands WHERE category_id IS NOT NULL")).scalar()
        total_cats = db.execute(text("SELECT COUNT(*) FROM product_categories")).scalar()

        print(f"\nFINAL STATS:")
        print(f"  Companies: {total_companies}")
        print(f"  Brands: {total_brands} ({categorized} categorized)")
        print(f"  Product Categories: {total_cats}")

        # Industry breakdown
        print(f"\nINDUSTRY BREAKDOWN:")
        rows = db.execute(text("""
            SELECT i.name, COUNT(DISTINCT c.id) as cos, COUNT(DISTINCT b.id) as brands
            FROM industries i
            LEFT JOIN companies c ON c.industry_id = i.id
            LEFT JOIN brands b ON b.company_id = c.id
            GROUP BY i.name ORDER BY COUNT(DISTINCT b.id) DESC
        """)).fetchall()
        for name, cos, brands in rows:
            print(f"  {name}: {cos} companies, {brands} brands")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        import traceback; traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    run()
