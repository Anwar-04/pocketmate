import { Category, PaymentMethod } from "@/types/transaction";
import { autoCategorize } from "@/lib/financial/categorizer";

export interface ParsedSmsTransaction {
  amount: number;
  merchant: string;
  category: Category;
  paymentMethod: PaymentMethod;
  type: "debit" | "credit";
  date: string; // YYYY-MM-DD
  rawSms: string;
  accountEnding?: string;
  confidence: "high" | "medium" | "low";
}

/**
 * Regex patterns tailored specifically for Indian banking and UPI SMS formats:
 * - HDFC Bank, SBI, ICICI Bank, Axis Bank, Kotak Bank, IndusInd, PNB, Canara
 * - UPI notifications (PhonePe, Google Pay, Paytm, CRED)
 */
export function parseBankSms(smsText: string): ParsedSmsTransaction | null {
  if (!smsText || typeof smsText !== "string") return null;

  const raw = smsText.trim();
  const lower = raw.toLowerCase();

  // 1. Detect Transaction Type (Debit vs Credit)
  const isCredit =
    lower.includes("credited") ||
    lower.includes("received rs") ||
    lower.includes("refund") ||
    lower.includes("cashback") ||
    lower.includes("added to your account");

  const isDebit =
    lower.includes("debited") ||
    lower.includes("spent") ||
    lower.includes("paid rs") ||
    lower.includes("paid inr") ||
    lower.includes("sent rs") ||
    lower.includes("transfer to") ||
    lower.includes("txn of rs") ||
    lower.includes("withdrawn");

  // If neither, or clearly a balance enquiry / OTP message, ignore
  if (!isDebit && !isCredit) {
    if (lower.includes("otp") || lower.includes("verification code") || lower.includes("balance is")) {
      return null;
    }
  }

  const type: "debit" | "credit" = isCredit && !isDebit ? "credit" : "debit";

  // 2. Extract Amount (Handles Rs., Rs, INR, ₹ with optional decimals)
  const amountRegexes = [
    /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:debited by|spent|paid)\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:rs|inr|debited)/i,
  ];

  let amount: number | null = null;
  for (const regex of amountRegexes) {
    const match = raw.match(regex);
    if (match && match[1]) {
      const cleanNum = parseFloat(match[1].replace(/,/g, ""));
      if (!isNaN(cleanNum) && cleanNum > 0) {
        amount = cleanNum;
        break;
      }
    }
  }

  if (!amount) return null;

  // 3. Extract Merchant / Recipient Entity
  let merchant = "Unknown Merchant";
  let confidence: "high" | "medium" | "low" = "low";

  const merchantPatterns = [
    /(?:at|to|towards|vpa|info:?)\s+([a-zA-Z0-9\s\.\&\*\-]+?)(?:\s+on|\s+via|\s+using|\s+ref|\s+avl|\s+bal|\.|$)/i,
    /(?:paid to)\s+([a-zA-Z0-9\s\.\&\*\-]+?)(?:\s+on|\s+using|\.|$)/i,
    /(?:transferred to)\s+([a-zA-Z0-9\s\.\&\*\-]+?)(?:\s+ref|\.|$)/i,
    /(?:swiggy|zomato|blinkit|zepto|uber|ola|netflix|spotify|amazon|flipkart|bescom|airtel|jio|bookmyshow|apollo)/i,
  ];

  for (const pattern of merchantPatterns) {
    const match = raw.match(pattern);
    if (match) {
      if (match[1]) {
        let extracted = match[1].trim();
        extracted = extracted.replace(/^(the|a)\s+/i, "");
        extracted = extracted.replace(/\s+(a\/c|card|ref|vpa).*$/i, "");
        if (extracted.length >= 2 && !extracted.toLowerCase().includes("a/c")) {
          merchant = cleanMerchantName(extracted);
          confidence = "high";
          break;
        }
      } else if (match[0]) {
        merchant = cleanMerchantName(match[0]);
        confidence = "medium";
        break;
      }
    }
  }

  // 4. Extract Payment Method
  let paymentMethod: PaymentMethod = "UPI";
  if (lower.includes("card") || lower.includes("credit card") || lower.includes("debit card") || lower.includes("pos")) {
    paymentMethod = "Card";
  } else if (lower.includes("netbanking") || lower.includes("neft") || lower.includes("rtgs") || lower.includes("imps")) {
    paymentMethod = "NetBanking";
  } else if (lower.includes("upi") || lower.includes("vpa") || lower.includes("phonepe") || lower.includes("gpay") || lower.includes("paytm")) {
    paymentMethod = "UPI";
  } else if (lower.includes("atm") || lower.includes("cash")) {
    paymentMethod = "Cash";
  }

  // 5. Extract Account Number (if available)
  let accountEnding: string | undefined;
  const acMatch = raw.match(/(?:a\/c|acct|card|ac|account)\s*(?:no\.?)?\s*[\*xX]*(\d{3,4})/i);
  if (acMatch && acMatch[1]) {
    accountEnding = acMatch[1];
  }

  // 6. Extract Date (Handles DD-MM-YY, DD-MMM-YY, DD/MM/YYYY, etc.)
  let date = new Date().toISOString().split("T")[0];
  const dateMatch = raw.match(/(\d{1,2})[-/]([a-zA-Z]{3}|\d{1,2})[-/](\d{2,4})/);
  if (dateMatch) {
    try {
      const day = parseInt(dateMatch[1], 10);
      const monthPart = dateMatch[2];
      const yearPart = dateMatch[3];
      const year = yearPart.length === 2 ? 2000 + parseInt(yearPart, 10) : parseInt(yearPart, 10);

      let month = 0;
      if (isNaN(parseInt(monthPart, 10))) {
        const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        const foundIdx = monthNames.indexOf(monthPart.toLowerCase().slice(0, 3));
        if (foundIdx !== -1) month = foundIdx;
      } else {
        month = parseInt(monthPart, 10) - 1;
      }

      const parsedDate = new Date(Date.UTC(year, month, day));
      if (!isNaN(parsedDate.getTime())) {
        date = parsedDate.toISOString().split("T")[0];
      }
    } catch {
      // Keep today's date
    }
  }

  // 7. Auto-categorize via merchant name and narrative
  const category = autoCategorize(`${merchant} ${raw}`);

  return {
    amount,
    merchant,
    category,
    paymentMethod,
    type,
    date,
    rawSms: raw,
    accountEnding,
    confidence,
  };
}

function cleanMerchantName(str: string): string {
  const cleaned = str
    .replace(/[^\w\s\.\-]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return cleaned || "Discretionary Vendor";
}
