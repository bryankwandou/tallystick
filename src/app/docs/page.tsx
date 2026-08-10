import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How it fits together — Tallystick",
  description:
    "The identity layer, the enclave contract, and the Solana escrow program, and what each one is responsible for.",
};

export default function DocsPage() {
  return (
    <PageShell
      eyebrow="Docs"
      title="How it fits together."
      lede="Three moving parts. Each one is replaceable, and each one is doing a job the other two cannot be trusted to do."
    >
      <div className="space-y-14">
        <Section
          h="1. Identity — T3N"
          body={[
            "The agent authenticates against T3N and receives a decentralised identifier in the form did:t3n:… . That identifier is issued by the platform. It is not derived from a wallet address, and the agent cannot mint one for itself.",
            "This matters because agents are not stable. They get redeployed, they rotate keys, they run as several processes at once. Attaching a payment history to a keypair means losing it the first time that keypair changes. Attaching it to an issued identifier means the record survives.",
          ]}
          code={`const address = eth_get_address(T3N_API_KEY);
const did = await t3n.authenticate(createEthAuthInput(address));
const tenantDid = did.value; // did:t3n:…`}
        />

        <Section
          h="2. Execution — a TEE contract"
          body={[
            "The work itself runs as a Rust crate compiled to a WASM component targeting wasm32-wasip2. It is registered against the tenant namespace and executed inside a trusted execution environment.",
            "The contract imports only the host interfaces it needs, and those imports are its entire capability set. If it never imports the HTTP interface, it cannot reach the network — this is enforced by the component model rather than by policy.",
            "Credentials live in a tenant key-value map that the contract reads at execution time. Requests carrying sensitive fields use placeholder markers that resolve inside the enclave, so the agent's own code never holds a plaintext key.",
          ]}
          code={`world settle {
  import host:tenant/tenant-context@1.0.0;
  import host:interfaces/logging@2.1.0;
  import host:interfaces/kv-store@2.1.0;

  export contracts;
}`}
        />

        <Section
          h="3. Settlement — Solana devnet"
          body={[
            "An escrow account on devnet holds the payout for the duration of the job. Release is conditional on the claim hash equalling the receipt hash.",
            "The comparison happens on-chain. Neither the agent nor the operator can assert a match into existence: if the halves differ, the release condition evaluates false and the lamports stay in escrow.",
          ]}
          code={`if claim_hash != receipt_hash {
    return Err(SettleError::HalvesDiverge.into());
}
// transfer lamports from escrow to the agent's payee`}
        />

        <div className="border-t border-hairline pt-8">
          <h2 className="text-[17px] font-medium">Running it yourself</h2>
          <p className="mt-3 text-[14px] leading-[1.7] text-muted-foreground">
            The repository carries the contract, the escrow program, and the
            scripts that register and invoke both. You will need a T3N API key
            from the ADK community page, plus a devnet keypair with a small
            airdrop. Every step is scripted; nothing requires a dashboard.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink
              href="https://github.com/bryankwandou/tallystick"
              variant="primary"
              target="_blank"
              rel="noreferrer"
            >
              Open the repository
            </ButtonLink>
            <ButtonLink
              href="https://docs.terminal3.io/developers/adk/get-started/quickstart"
              variant="secondary"
              target="_blank"
              rel="noreferrer"
            >
              T3N ADK quickstart
            </ButtonLink>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Section({
  h,
  body,
  code,
}: {
  h: string;
  body: string[];
  code: string;
}) {
  return (
    <section>
      <h2 className="text-[17px] font-medium">{h}</h2>
      {body.map((p) => (
        <p
          key={p.slice(0, 24)}
          className="mt-3 text-[14px] leading-[1.7] text-muted-foreground"
        >
          {p}
        </p>
      ))}
      <pre className="mt-5 overflow-x-auto rounded-md border border-border bg-card px-4 py-3.5">
        <code className="font-mono text-[12.5px] leading-[1.65] text-foreground/85">
          {code}
        </code>
      </pre>
    </section>
  );
}
