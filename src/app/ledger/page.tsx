import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { Mono } from "@/components/ui/mono";
import { ButtonLink } from "@/components/ui/button";
import { SETTLEMENTS, matches, toSol } from "@/lib/settlements";

export const metadata: Metadata = {
  title: "Ledger — Tallystick",
  description:
    "Every settlement the escrow program has seen, matched and unmatched, with the devnet signature that released the funds.",
};

export default function LedgerPage() {
  const rows = SETTLEMENTS;

  return (
    <PageShell
      wide
      eyebrow="Ledger"
      title="Every settlement, including the ones that failed."
      lede="Unmatched rows are kept deliberately. A ledger that only records successes tells you nothing about an agent's reliability."
    >
      {rows.length === 0 ? (
        <EmptyLedger />
      ) : (
        <>
          {/* Desktop: table. Mobile: the same rows as cards. */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">
                Settlements recorded by the escrow program
              </caption>
              <thead>
                <tr className="border-b border-border">
                  {["Id", "Agent", "Job", "Amount", "Signature", "State"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className={`pb-3 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground ${
                        h === "Amount" || h === "Slot" ? "text-right" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {rows.map((s) => {
                  const ok = matches(s);
                  return (
                    <tr key={s.id}>
                      <td className="py-4 pr-4 align-top">
                        <Mono value={s.id} className="text-foreground" />
                      </td>
                      <td className="py-4 pr-4 align-top">
                        <Mono
                          value={s.agentDid}
                          truncate={10}
                          label="Agent identifier"
                          className="text-muted-foreground"
                        />
                      </td>
                      <td className="max-w-[280px] py-4 pr-4 align-top text-[13px] leading-snug">
                        {s.job}
                      </td>
                      <td className="py-4 pr-4 text-right align-top font-mono tnum text-[13px]">
                        {toSol(s.amountLamports)}
                      </td>
                      <td className="py-4 pr-4 align-top">
                        {s.signature ? (
                          <a
                            href={`https://explorer.solana.com/tx/${s.signature}?cluster=devnet`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-sm underline decoration-hairline underline-offset-4 transition-colors duration-100 ease-out hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          >
                            <Mono
                              value={s.signature}
                              truncate={7}
                              label="Transaction signature"
                              className="text-muted-foreground"
                            />
                          </a>
                        ) : (
                          <span className="text-[12px] text-muted-foreground">
                            not submitted
                          </span>
                        )}
                      </td>
                      <td className="py-4 align-top">
                        <StateBadge ok={ok} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {rows.map((s) => {
              const ok = matches(s);
              return (
                <li
                  key={s.id}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between">
                    <Mono value={s.id} className="text-foreground" />
                    <StateBadge ok={ok} />
                  </div>
                  <p className="mt-2.5 text-[13px] leading-snug">{s.job}</p>
                  <div className="mt-3 flex items-baseline justify-between border-t border-hairline pt-3">
                    <span className="font-mono tnum text-[15px] font-medium">
                      {toSol(s.amountLamports)}
                      <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                        SOL
                      </span>
                    </span>
                    <Mono
                      value={s.agentDid}
                      truncate={8}
                      className="text-muted-foreground"
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-10 border-t border-hairline pt-6">
            <p className="max-w-[68ch] text-[13px] leading-relaxed text-muted-foreground">
              The state column is recomputed from each row&rsquo;s two digests
              rather than read from a stored flag, so a tampered record fails
              here rather than passing quietly. Signatures resolve on Solana
              Explorer against devnet. The held row carries no signature because
              nothing was ever submitted &mdash; the release condition did not
              hold, so there is no transaction to point at.
            </p>
            <div className="mt-4">
              <ButtonLink href="/verify" variant="secondary">
                Open the verifier
              </ButtonLink>
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}

function StateBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] font-medium text-primary">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      Settled
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] font-medium text-destructive">
      <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
      Held
    </span>
  );
}

function EmptyLedger() {
  return (
    <div className="rounded-lg border border-border bg-card px-6 py-14 text-center">
      <p className="text-[14px] font-medium">No settlements recorded yet</p>
      <p className="mx-auto mt-2 max-w-[46ch] text-[13px] leading-relaxed text-muted-foreground">
        Run a job through the escrow program and the first row will appear here,
        matched or not.
      </p>
      <div className="mt-6">
        <ButtonLink href="/docs" variant="secondary">
          Read the setup steps
        </ButtonLink>
      </div>
    </div>
  );
}
