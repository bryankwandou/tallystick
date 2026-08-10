import type { Metadata } from "next";
import { VerifyClient } from "./verify-client";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Verify a receipt — Tallystick",
  description:
    "Recompute both halves of a settlement and see whether the agent's claim matches the receipt written inside the enclave.",
};

export default function VerifyPage() {
  return (
    <PageShell
      eyebrow="Verify"
      title="Check a settlement's two halves."
      lede="Paste a settlement id, a claim hash, or a devnet signature. The match is recomputed from both stored halves rather than read from a flag, so a tampered record fails here rather than passing silently."
    >
      <VerifyClient />
    </PageShell>
  );
}
