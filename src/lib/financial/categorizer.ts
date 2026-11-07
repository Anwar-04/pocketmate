import { Category, ALL_CATEGORIES } from "@/types/transaction";

const CATEGORY_RULES: Array<{ category: Category; keywords: string[] }> = [
  {
    category: "Rent",
    keywords: ["rent", "maintenance", "society", "nobroker", "nestaway", "landlord", "flat rent", "house rent"],
  },
  {
    category: "Groceries",
    keywords: [
      "blinkit",
      "zepto",
      "bigbasket",
      "dmart",
      "instamart",
      "nature's basket",
      "spencers",
      "supermarket",
      "grocer",
      "vegetable",
      "fruit",
      "milk",
      "country delight",
    ],
  },
  {
    category: "Food",
    keywords: [
      "swiggy",
      "zomato",
      "chai",
      "chaayos",
      "starbucks",
      "mcdonald",
      "kfc",
      "biryani",
      "restaurant",
      "cafe",
      "dominos",
      "pizza",
      "burger",
      "haldiram",
      "sagar",
      "dhaba",
      "bakery",
      "eats",
      "sweet",
    ],
  },
  {
    category: "Transport",
    keywords: [
      "uber",
      "ola",
      "rapido",
      "metro",
      "petrol",
      "fuel",
      "hpcl",
      "iocl",
      "bpcl",
      "shell",
      "fastag",
      "parking",
      "auto",
      "railway",
      "irctc",
      "toll",
      "bus",
    ],
  },
  {
    category: "Shopping",
    keywords: [
      "amazon",
      "flipkart",
      "myntra",
      "ajio",
      "zara",
      "h&m",
      "nykaa",
      "decathlon",
      "meesho",
      "tata cliq",
      "clothing",
      "shoes",
      "mall",
      "fashion",
    ],
  },
  {
    category: "Bills",
    keywords: [
      "electricity",
      "bescom",
      "tata power",
      "adani electricity",
      "water",
      "gas",
      "igl",
      "broadband",
      "airtel",
      "jio",
      "vi",
      "vodafone",
      "recharge",
      "dth",
      "wifi",
      "bill",
    ],
  },
  {
    category: "Subscriptions",
    keywords: [
      "netflix",
      "spotify",
      "hotstar",
      "prime",
      "youtube",
      "apple",
      "disney",
      "sonyliv",
      "zee5",
      "notion",
      "zoom",
      "figma",
      "github",
      "slack",
      "google one",
      "chatgpt",
      "openai",
      "aws",
      "subscription",
      "membership",
      "cult.fit",
      "gym",
    ],
  },
  {
    category: "Healthcare",
    keywords: [
      "apollo",
      "1mg",
      "pharmeasy",
      "netmeds",
      "hospital",
      "clinic",
      "doctor",
      "pharmacy",
      "medicine",
      "diagnostic",
      "pathology",
      "lab",
      "dental",
    ],
  },
  {
    category: "Entertainment",
    keywords: ["bookmyshow", "pvr", "inox", "cinepolis", "cinema", "movie", "gaming", "steam", "playstation"],
  },
  {
    category: "Education",
    keywords: ["udemy", "coursera", "college", "school", "tuition", "books", "fee", "exam", "course"],
  },
  {
    category: "Travel",
    keywords: ["makemytrip", "cleartrip", "goibibo", "indigo", "air india", "hotel", "flight", "booking.com", "airbnb", "resort"],
  },
];

/**
 * Deterministically auto-categorizes a transaction narrative using a keyword rule dictionary.
 * Fallbacks to "Other" if no pattern matches.
 */
export function autoCategorize(text: string): Category {
  if (!text) return "Other";
  const normalized = text.toLowerCase();

  for (const rule of CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      if (normalized.includes(keyword)) {
        return rule.category;
      }
    }
  }

  return "Other";
}

/**
 * Normalizes any arbitrary category string (from user CSVs or external banks)
 * into a valid SpendWise Category enum value, falling back to auto-categorization
 * or "Other" without throwing validation errors.
 */
export function normalizeCategory(input?: string | null, fallbackDescription?: string): Category {
  // If we have a fallback description, check if description gives a stronger match (e.g. Uber, Notion)
  if (fallbackDescription) {
    const fromDesc = autoCategorize(fallbackDescription);
    if (fromDesc !== "Other") return fromDesc;
  }

  if (!input || typeof input !== "string") {
    return fallbackDescription ? autoCategorize(fallbackDescription) : "Other";
  }

  const trimmed = input.trim();
  if (!trimmed) return "Other";

  // 1. Direct match with valid categories
  const exact = ALL_CATEGORIES.find((c) => c.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;

  // 2. Map common corporate/bank taxonomy synonyms
  const lower = trimmed.toLowerCase();
  if (["housing", "apartment", "pg", "property", "lease", "shelter"].includes(lower)) return "Rent";
  if (["transportation", "cab", "taxi", "commute", "fuel", "gasoline", "diesel", "auto", "rides", "fleet"].includes(lower)) return "Transport";
  if (["groceries", "supermarket", "grocery", "mart", "provisions", "food & supplies"].includes(lower)) return "Groceries";
  if (["dining", "restaurant", "cafe", "takeaway", "meals", "lunch", "dinner", "breakfast", "snacks", "food & dining"].includes(lower)) return "Food";
  if (["utilities", "electricity", "utility", "broadband", "telecom", "water", "gas bill", "phone"].includes(lower)) return "Bills";
  if (["saas", "software", "cloud", "recurring", "membership", "services"].includes(lower)) return "Subscriptions";
  if (["health", "medical", "pharmacy", "medicine", "doctor", "wellness", "fitness"].includes(lower)) return "Healthcare";
  if (["movies", "cinema", "recreation", "leisure", "events", "games"].includes(lower)) return "Entertainment";
  if (["training", "tuition", "courses", "learning", "study", "books", "education", "development"].includes(lower)) return "Education";
  if (["flights", "hotels", "lodging", "vacation", "trip", "tourism"].includes(lower)) return "Travel";
  if (["marketing", "advertising", "ads", "hardware", "office", "supplies", "retail", "e-commerce", "electronics", "equipment"].includes(lower)) return "Shopping";

  return "Other";
}
