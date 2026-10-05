import { env } from "./env";

const DPO_API_URL = "https://secure.3gdirectpay.com/API/v6/";
const DPO_PAY_URL = "https://secure.3gdirectpay.com/payv2.php";

const DPO_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  Accept: "application/xml, text/xml, */*",
  // CloudFront WAF often blocks bare Node fetch without a browser-like UA
  "User-Agent":
    "Mozilla/5.0 (compatible; UmuhuzaOnline/1.0; +https://umuhuza.rw) AppleWebKit/537.36",
} as const;

export function isDpoConfigured() {
  return Boolean(env.DPO_COMPANY_TOKEN && env.DPO_SERVICE_TYPE);
}

function xmlTag(tag: string, value: string | number) {
  const safe = String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return `<${tag}>${safe}</${tag}>`;
}

function readXmlTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
  return match?.[1]?.trim() ?? null;
}

function formatServiceDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${d} ${hh}:${mm}`;
}

/**
 * DPO CloudFront WAF blocks createToken when RedirectURL/BackURL use
 * localhost or 127.0.0.1. Rewrite to lvh.me (resolves to 127.0.0.1).
 */
export function dpoSafePublicUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      parsed.hostname = "lvh.me";
      return parsed.toString();
    }
  } catch {
    // keep original
  }
  return url;
}

function explainDpoBody(status: number, body: string) {
  const result = readXmlTag(body, "Result");
  const explanation = readXmlTag(body, "ResultExplanation");
  if (explanation) {
    return { result: result ?? "999", explanation };
  }

  const snippet = body.replace(/\s+/g, " ").trim().slice(0, 180);
  if (status === 403 || /403 ERROR|Request blocked|CloudFront/i.test(body)) {
    return {
      result: "403",
      explanation:
        "DPO blocked the API request (HTTP 403). Localhost redirect URLs are not allowed — use http://lvh.me:3000 or a public URL.",
    };
  }
  if (!body.trim()) {
    return {
      result: String(status || 999),
      explanation: `Empty response from DPO (HTTP ${status})`,
    };
  }
  return {
    result: result ?? String(status || 999),
    explanation: `Unexpected DPO response (HTTP ${status}): ${snippet}`,
  };
}

export type DpoCreateTokenInput = {
  amount: number;
  currency: string;
  companyRef: string;
  redirectUrl: string;
  backUrl: string;
  description: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone?: string | null;
};

export type DpoCreateTokenResult = {
  result: string;
  explanation: string;
  transToken: string | null;
  paymentUrl: string | null;
};

export async function dpoCreateToken(
  input: DpoCreateTokenInput
): Promise<DpoCreateTokenResult> {
  if (!isDpoConfigured()) {
    throw new Error("DPO is not configured");
  }

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  ${xmlTag("CompanyToken", env.DPO_COMPANY_TOKEN!)}
  ${xmlTag("Request", "createToken")}
  <Transaction>
    ${xmlTag("PaymentAmount", input.amount.toFixed(2))}
    ${xmlTag("PaymentCurrency", input.currency)}
    ${xmlTag("CompanyRef", input.companyRef)}
    ${xmlTag("RedirectURL", dpoSafePublicUrl(input.redirectUrl))}
    ${xmlTag("BackURL", dpoSafePublicUrl(input.backUrl))}
    ${xmlTag("CompanyRefUnique", "0")}
    ${xmlTag("PTL", "24")}
    ${xmlTag("customerFirstName", input.customerFirstName)}
    ${xmlTag("customerLastName", input.customerLastName)}
    ${xmlTag("customerEmail", input.customerEmail)}
    ${input.customerPhone ? xmlTag("customerPhone", input.customerPhone) : ""}
  </Transaction>
  <Services>
    <Service>
      ${xmlTag("ServiceType", env.DPO_SERVICE_TYPE!)}
      ${xmlTag("ServiceDescription", input.description)}
      ${xmlTag("ServiceDate", formatServiceDate())}
    </Service>
  </Services>
</API3G>`;

  const res = await fetch(DPO_API_URL, {
    method: "POST",
    headers: DPO_HEADERS,
    body: xml,
  });

  const body = await res.text();
  const { result, explanation } = explainDpoBody(res.status, body);
  const transToken = readXmlTag(body, "TransToken");

  if (result !== "000" || !transToken) {
    console.error("[dpo createToken]", { status: res.status, result, explanation, body: body.slice(0, 500) });
  }

  return {
    result,
    explanation,
    transToken,
    paymentUrl: transToken ? `${DPO_PAY_URL}?ID=${encodeURIComponent(transToken)}` : null,
  };
}

export type DpoVerifyResult = {
  result: string;
  explanation: string;
  paid: boolean;
  raw: string;
};

export async function dpoVerifyToken(transToken: string): Promise<DpoVerifyResult> {
  if (!isDpoConfigured()) {
    throw new Error("DPO is not configured");
  }

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  ${xmlTag("CompanyToken", env.DPO_COMPANY_TOKEN!)}
  ${xmlTag("Request", "verifyToken")}
  ${xmlTag("TransactionToken", transToken)}
</API3G>`;

  const res = await fetch(DPO_API_URL, {
    method: "POST",
    headers: DPO_HEADERS,
    body: xml,
  });

  const raw = await res.text();
  const { result, explanation } = explainDpoBody(res.status, raw);

  // 000 = paid/authorized on verifyToken for successful charges
  // 900 = not paid yet (normal while waiting for MoMo PIN)
  const paid = result === "000";

  if (!paid && result !== "900") {
    console.error("[dpo verifyToken]", { status: res.status, result, explanation, raw: raw.slice(0, 500) });
  }

  return { result, explanation, paid, raw };
}

export type DpoMobileOption = {
  country: string;
  countryCode: string;
  paymentName: string;
  logo: string | null;
  cellularPrefix: string | null;
  instructions: string | null;
};

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#8218;/g, ",")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/;/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseMobileOptions(xml: string): DpoMobileOption[] {
  const blocks = xml.match(/<mobileoption>[\s\S]*?<\/mobileoption>/gi) ?? [];
  return blocks
    .map((block) => {
      const country = readXmlTag(block, "country") ?? "";
      const paymentName = readXmlTag(block, "paymentname") ?? "";
      if (!country || !paymentName) return null;
      const instructionsRaw = readXmlTag(block, "instructions");
      return {
        country,
        countryCode: readXmlTag(block, "countryCode") ?? "",
        paymentName,
        logo: readXmlTag(block, "logo"),
        cellularPrefix: readXmlTag(block, "celluarprefix") ?? readXmlTag(block, "cellularprefix"),
        instructions: instructionsRaw ? decodeHtmlEntities(instructionsRaw) : null,
      } satisfies DpoMobileOption;
    })
    .filter((opt): opt is DpoMobileOption => Boolean(opt));
}

/** Prefer Rwanda operators for Umuhuza; fall back to full list. */
export function preferRwandaMobileOptions(options: DpoMobileOption[]) {
  const rwanda = options.filter(
    (o) =>
      o.countryCode.toUpperCase() === "RW" ||
      o.country.toLowerCase() === "rwanda"
  );
  return rwanda.length > 0 ? rwanda : options;
}

export async function dpoGetMobilePaymentOptions(
  transToken: string
): Promise<{ result: string; explanation: string; options: DpoMobileOption[] }> {
  if (!isDpoConfigured()) {
    throw new Error("DPO is not configured");
  }

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  ${xmlTag("CompanyToken", env.DPO_COMPANY_TOKEN!)}
  ${xmlTag("Request", "GetMobilePaymentOptions")}
  ${xmlTag("TransactionToken", transToken)}
</API3G>`;

  const res = await fetch(DPO_API_URL, {
    method: "POST",
    headers: DPO_HEADERS,
    body: xml,
  });

  const body = await res.text();
  const options = preferRwandaMobileOptions(parseMobileOptions(body));
  if (options.length > 0) {
    return { result: "000", explanation: "OK", options };
  }

  const { result, explanation } = explainDpoBody(res.status, body);
  return { result, explanation, options: [] };
}

export type DpoChargeMobileInput = {
  transToken: string;
  phoneNumber: string;
  mno: string;
  mnoCountry: string;
};

export type DpoChargeMobileResult = {
  code: string;
  explanation: string;
  instructions: string | null;
  redirectOption: boolean;
  redirectUrl: string | null;
  ok: boolean;
};

function extractUrlFromText(text: string | null) {
  if (!text) return null;
  const match = text.match(/https?:\/\/[^\s"'<>]+/i);
  return match?.[0] ?? null;
}

export async function dpoChargeTokenMobile(
  input: DpoChargeMobileInput
): Promise<DpoChargeMobileResult> {
  if (!isDpoConfigured()) {
    throw new Error("DPO is not configured");
  }

  // CompanyMobilePaymentOptions uses title-case country for Rwanda terminals
  const mnoCountry =
    input.mnoCountry.toLowerCase() === "rwanda" ? "Rwanda" : input.mnoCountry;

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  ${xmlTag("CompanyToken", env.DPO_COMPANY_TOKEN!)}
  ${xmlTag("Request", "ChargeTokenMobile")}
  ${xmlTag("TransactionToken", input.transToken)}
  ${xmlTag("PhoneNumber", input.phoneNumber)}
  ${xmlTag("MNO", input.mno)}
  ${xmlTag("MNOcountry", mnoCountry)}
</API3G>`;

  const res = await fetch(DPO_API_URL, {
    method: "POST",
    headers: DPO_HEADERS,
    body: xml,
  });

  const body = await res.text();
  const code =
    readXmlTag(body, "StatusCode") ??
    readXmlTag(body, "Code") ??
    readXmlTag(body, "Result") ??
    String(res.status);
  const explanation =
    readXmlTag(body, "ResultExplanation") ??
    readXmlTag(body, "Explanation") ??
    explainDpoBody(res.status, body).explanation;
  const instructionsRaw =
    readXmlTag(body, "instructions") ?? readXmlTag(body, "Instructions");
  const instructions = instructionsRaw ? decodeHtmlEntities(instructionsRaw) : null;
  const redirectOption = (readXmlTag(body, "RedirectOption") ?? "0") === "1";
  const explicitRedirect =
    readXmlTag(body, "RedirectUrl") ??
    readXmlTag(body, "MnoUrl") ??
    readXmlTag(body, "MNOUrl") ??
    extractUrlFromText(instructions);

  // MTN Rwanda terminals require redirect (terminalredirecturi=1). If DPO
  // does not return a URL, fall back to the hosted pay page for this token.
  const redirectUrl =
    explicitRedirect ||
    (redirectOption
      ? `${DPO_PAY_URL}?ID=${encodeURIComponent(input.transToken)}`
      : null);

  // 130 = New invoice (push / invoice created); 001 = Authorized
  const ok = code === "130" || code === "001" || code === "000";

  if (!ok) {
    console.error("[dpo ChargeTokenMobile]", {
      status: res.status,
      code,
      explanation,
      body: body.slice(0, 500),
    });
  } else {
    console.info("[dpo ChargeTokenMobile]", {
      code,
      redirectOption,
      phone: input.phoneNumber,
      mno: input.mno,
      hasRedirectUrl: Boolean(redirectUrl),
    });
  }

  return {
    code,
    explanation,
    instructions,
    redirectOption,
    redirectUrl,
    ok,
  };
}

/** Public DPO sandbox company tokens do not deliver live MoMo push to phones. */
export function isDpoSandboxToken(token = env.DPO_COMPANY_TOKEN) {
  const sandbox = new Set([
    "B3F59BE7-0756-420E-BB88-1D98E7A6B040",
    "C40E4138-3DF7-4A56-A6D1-375A49407A1C",
    "8BB9CF9A-6E89-4E78-828F-088D5A000269",
    "732CDD7C-34B3-4506-ACF6-B03F94FB44C8",
    "8E0F3AD8-B254-419A-80DF-6D9C280A5130",
    "8D3DA73D-9D7F-4E09-96D4-3D44E7A83EA3",
  ]);
  return Boolean(token && sandbox.has(token.toUpperCase()));
}

/** Normalize Rwanda MSISDN to 2507XXXXXXXX */
export function normalizeRwandaPhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("250") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `250${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith("7")) return `250${digits}`;
  return digits;
}
