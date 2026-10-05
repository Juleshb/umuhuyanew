import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { LEGAL_EFFECTIVE, LEGAL_UPDATED, privacySections } from "@/content/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for UmuhuzaOnline.com, operated by Shima Prime Services Ltd.",
};

export default function PrivacyPage() {
  const year = new Date().getFullYear();

  return (
    <LegalDocument
      eyebrow="UmuhuzaOnline.com"
      title="Privacy Policy"
      effective={LEGAL_EFFECTIVE}
      updated={LEGAL_UPDATED}
      intro="This Privacy Policy explains how Shima Prime Services Ltd, operating UmuhuzaOnline.com, handles personal data."
      sections={privacySections}
      closing={`© ${year} Shima Prime Services Ltd — UmuhuzaOnline.com. All rights reserved. UmuhuzaOnline.com is a brand owned, operated and managed by Shima Prime Services Ltd.`}
    />
  );
}
