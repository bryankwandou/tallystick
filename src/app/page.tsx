import Link from "next/link";
import { Logo, LogoMark } from "@/components/brand/logo";
import { Seam } from "@/components/ui/seam";
import { ButtonLink } from "@/components/ui/button";
import { Mono, FieldLabel } from "@/components/ui/mono";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <Hero />
        <Mechanism />
        <Primitives />
        <Stack />
        <ClosingCta />
      </main>
      <SiteFooter />
    </>
  );
}

/* -------------------------------------------------------------------------- */

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Logo />
        </Link>
        <nav className="flex items-center gap-1" aria-label="Main">
          <HeaderLink href="/verify">Verify</HeaderLink>
          <HeaderLink href="/ledger">Ledger</HeaderLink>
          <HeaderLink href="/docs">Docs</HeaderLink>
          <a
            href="https://github.com/bryankwandou/tallystick"
            target="_blank"
            rel="noreferrer"
            className="ml-2 inline-flex min-h-10 items-center rounded-md px-3 text-[13px] text-muted-foreground transition-colors duration-100 ease-out hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Source
          </a>
        </nav>
      </div>
    </header>
  );
}

function HeaderLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center rounded-md px-3 text-[13px] text-muted-foreground transition-colors duration-100 ease-out hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {children}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="border-b border-hairline">
      <div className="mx-auto grid max-w-6xl gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
        {/* Left: the claim */}
        <div className="anim-rise">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.07em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Running on Solana devnet
          </p>

          <h1 className="max-w-[15ch] text-[40px] font-semibold leading-[1.06] tracking-[-0.035em] sm:text-[54px]">
            Settlement your agent can prove.
          </h1>

          <p className="mt-6 max-w-[54ch] text-[15px] leading-[1.7] text-muted-foreground">
            An autonomous agent that spends money leaves you with one question:
            what actually happened, and who says so. Tallystick splits every
            payout in two. The agent signs a claim. A contract running inside a
            trusted enclave writes the receipt. Funds move only when the two
            halves match.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <ButtonLink href="/verify" variant="primary">
              Verify a receipt
            </ButtonLink>
            <ButtonLink
              href="https://github.com/bryankwandou/tallystick"
              variant="secondary"
              target="_blank"
              rel="noreferrer"
            >
              Read the contract
            </ButtonLink>
          </div>

          {/* Figures that can be checked against the chain or re-run from the
              repository, not invented traction metrics. */}
          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-hairline pt-6">
            <Stat label="Settled" value="0.0185" unit="SOL" />
            <Stat label="Released" value="2" unit="of 3" />
            <Stat label="Tests" value="26" unit="pass" />
          </dl>
          <p className="mt-4 max-w-md text-[12px] leading-relaxed text-muted-foreground">
            Two settlements moved value on devnet. The third was refused because
            the halves disagreed. Every figure resolves on Solana Explorer or
            re-runs from the repository.
          </p>
        </div>

        {/* Right: the receipt */}
        <div className="anim-rise [animation-delay:120ms]">
          <ReceiptPanel />
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1.5 font-mono tnum text-[20px] font-medium tracking-[-0.01em]">
        {value}
        {unit && (
          <span className="ml-1 text-[12px] font-normal text-muted-foreground">
            {unit}
          </span>
        )}
      </dd>
    </div>
  );
}

/** The two halves, rendered as one panel split by the seam. */
function ReceiptPanel() {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
        <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Settlement 4f2a
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Matched
        </span>
      </div>

      <div className="px-5 py-5">
        <FieldLabel>Claim — signed by agent</FieldLabel>
        <Mono
          value="did:t3n:8f2c9a4e17bd35006ea1cc4820f9b7d3"
          label="Agent decentralised identifier"
          className="text-foreground/90"
        />

        <Seam className="my-5 anim-seam-draw" />

        <FieldLabel>Receipt — written in enclave</FieldLabel>
        <Mono
          value="z:8f2c9a4e17bd35006ea1cc4820f9b7d3:settle"
          label="Contract script name"
          className="text-foreground/90"
        />

        <div className="mt-6 grid grid-cols-2 gap-5 border-t border-hairline pt-5">
          <div>
            <FieldLabel>Amount</FieldLabel>
            <p className="font-mono tnum text-[19px] font-medium">
              0.0125
              <span className="ml-1.5 text-[12px] font-normal text-muted-foreground">
                SOL
              </span>
            </p>
          </div>
          <div>
            <FieldLabel>Units</FieldLabel>
            <p className="font-mono tnum text-[19px] font-medium">
              1,284
              <span className="ml-1.5 text-[12px] font-normal text-muted-foreground">
                / 1,284
              </span>
            </p>
          </div>
        </div>

        <div className="mt-5">
          <FieldLabel>Devnet signature — slot 482,637,177</FieldLabel>
          <a
            href="https://explorer.solana.com/tx/NkQ8razSuKBNXSfcS7U5t7esj9BQ7EMGfxC1Zr2eMLYwLA6dd221WUAAfdXuQ9NhCN23Ygz7BKUF7y785g6Zqcb?cluster=devnet"
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-sm underline decoration-hairline underline-offset-4 transition-colors duration-100 ease-out hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Mono
              value="NkQ8razSuKBNXSfcS7U5t7esj9BQ7EMGfxC1Zr2eMLYwLA6dd221WUAAfdXuQ9NhCN23Ygz7BKUF7y785g6Zqcb"
              label="Transaction signature"
              className="text-muted-foreground"
            />
          </a>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Mechanism() {
  const steps = [
    {
      n: "01",
      t: "The agent states what it did",
      d: "Work finishes and the agent signs a claim against its T3N identifier — an identifier the platform issued, not one derived from a wallet the agent controls. It cannot rewrite the claim afterwards without breaking the signature.",
    },
    {
      n: "02",
      t: "The enclave writes the other half",
      d: "A Rust contract compiled to WASM runs inside a trusted execution environment. It reads the agent's claim, checks the work against whatever source of truth the job named, and emits a receipt. The contract holds the API credentials; the agent never sees them.",
    },
    {
      n: "03",
      t: "Solana releases the funds",
      d: "An escrow program on devnet holds the payout. It compares the claim hash against the receipt hash. Equal, and it transfers. Unequal, and the money stays put and the mismatch is recorded against the agent's identifier.",
    },
  ];

  return (
    <section className="border-b border-hairline">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <SectionHead
          eyebrow="Mechanism"
          title="Three steps, none of them trusting the agent."
        />
        <ol className="anim-stagger mt-14 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="bg-background p-6">
              <span className="font-mono tnum text-[11px] text-primary">
                {s.n}
              </span>
              <h3 className="mt-3 text-[15px] font-medium leading-snug">
                {s.t}
              </h3>
              <p className="mt-2.5 text-[13.5px] leading-[1.65] text-muted-foreground">
                {s.d}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Primitives() {
  const rows = [
    {
      k: "Identity that outlives the key",
      v: "Agents rotate keys, get redeployed, and run in swarms. A T3N decentralised identifier survives all three, so a payment history belongs to the agent rather than to whichever keypair happened to sign.",
    },
    {
      k: "Credentials the agent cannot read",
      v: "Outbound calls carrying sensitive fields use placeholder markers that resolve inside the enclave. The contract sends a real API key; the agent's own code never holds one.",
    },
    {
      k: "A receipt that is not self-reported",
      v: "The agent does not write its own receipt. That is the entire point. The enclave writes it, and the ledger row is produced by the same execution that did the work.",
    },
    {
      k: "Disputes with somewhere to look",
      v: "When halves fail to match, the mismatch is durable and attributable. You get the claim, the receipt, the contract version that produced it, and the identifier responsible.",
    },
  ];

  return (
    <section className="border-b border-hairline">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <SectionHead
          eyebrow="What it buys you"
          title="Four things that are hard to retrofit."
        />
        <dl className="anim-stagger mt-14 grid gap-x-14 gap-y-10 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.k} className="border-t border-hairline pt-5">
              <dt className="text-[14.5px] font-medium">{r.k}</dt>
              <dd className="mt-2 text-[13.5px] leading-[1.65] text-muted-foreground">
                {r.v}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Stack() {
  const layers = [
    { l: "Identity", v: "T3N DID · did:t3n:…", n: "Issued by the platform, resolvable to an A2A card." },
    { l: "Execution", v: "Rust → wasm32-wasip2", n: "WASM component, registered against a tenant namespace." },
    { l: "Isolation", v: "TEE node", n: "Host capabilities limited to the WIT interfaces imported." },
    { l: "Settlement", v: "Solana devnet", n: "Escrow releases on hash equality, not on assertion." },
  ];

  return (
    <section className="border-b border-hairline">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <SectionHead eyebrow="Stack" title="Where each guarantee comes from." />
        <div className="anim-stagger mt-14 divide-y divide-hairline border-y border-hairline">
          {layers.map((x) => (
            <div
              key={x.l}
              className="grid gap-2 py-5 sm:grid-cols-[160px_220px_1fr] sm:items-baseline sm:gap-8"
            >
              <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                {x.l}
              </span>
              <span className="font-mono text-[13px] text-foreground">
                {x.v}
              </span>
              <span className="text-[13.5px] leading-[1.6] text-muted-foreground">
                {x.n}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <div className="anim-rise mx-auto max-w-lg text-center">
          <LogoMark className="mx-auto h-8 w-8" />
          <h2 className="mt-7 text-[27px] font-semibold tracking-[-0.03em]">
            Pay the agent when the halves match.
          </h2>
          <p className="mt-4 text-[14.5px] leading-[1.65] text-muted-foreground">
            The contract, the escrow program, and the verification flow are all
            in the repository. Devnet signatures included, so you can check the
            claims here against the chain yourself.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/verify" variant="primary">
              Verify a receipt
            </ButtonLink>
            <ButtonLink href="/docs" variant="secondary">
              How it fits together
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="anim-rise max-w-2xl">
      <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-[27px] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[32px]">
        {title}
      </h2>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-9 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Logo />
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Devnet only. Nothing here moves mainnet funds.
        </p>
      </div>
    </footer>
  );
}
