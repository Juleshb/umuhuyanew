import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { LEGAL_EFFECTIVE, LEGAL_UPDATED, termsSections } from "@/content/legal";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    "Terms and Conditions for UmuhuzaOnline.com, owned, operated and managed by Shima Prime Services Ltd.",
};

export default function TermsPage() {
  const year = new Date().getFullYear();

  return (
    <LegalDocument
      eyebrow="UmuhuzaOnline.com"
      title="Terms and Conditions"
      effective={LEGAL_EFFECTIVE}
      updated={LEGAL_UPDATED}
      intro="These Terms govern your use of UmuhuzaOnline.com, the real-estate platform owned, operated and managed by Shima Prime Services Ltd."
      sections={termsSections}
      closing={`© ${year} Shima Prime Services Ltd — UmuhuzaOnline.com. All rights reserved. UmuhuzaOnline.com is a brand owned, operated and managed by Shima Prime Services Ltd.`}
    />
  );
}
