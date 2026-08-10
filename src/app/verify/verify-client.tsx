"use client";

import { useState, useRef, useId } from "react";
import {
  findSettlement,
  matches,
  toSol,
  type Settlement,
} from "@/lib/settlements";
import { Seam } from "@/components/ui/seam";
import { Button } from "@/components/ui/button";
import { Mono, FieldLabel } from "@/components/ui/mono";

type State =
  | { k: "idle" }
  | { k: "checking" }
  | { k: "found"; s: Settlement }
  | { k: "notfound"; q: string }
  | { k: "error"; msg: string };

export function VerifyClient() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<State>({ k: "idle" });
  const [touched, setTouched] = useState(false);
  const inputId = useId();
  const errId = useId();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const invalid = touched && query.trim().length === 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!query.trim()) return;

    // Cancel any in-flight check so a fast second submit can't race.
    if (timer.current) clearTimeout(timer.current);
    setState({ k: "checking" });

    timer.current = setTimeout(() => {
      try {
        const s = findSettlement(query);
        setState(s ? { k: "found", s } : { k: "notfound", q: query.trim() });
      } catch {
        setState({
          k: "error",
          msg: "The verifier could not read that value.",
        });
      }
    }, 700);
  }

  function reset() {
    if (timer.current) clearTimeout(timer.current);
    setQuery("");
    setTouched(false);
    setState({ k: "idle" });
  }

  return (
    <div>
      <form onSubmit={submit} noValidate>
        <label
          htmlFor={inputId}
          className="mb-2 block text-[13px] font-medium"
        >
          Settlement id, claim hash, or devnet signature
        </label>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <input
            id={inputId}
            name="settlement"
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="4f2a"
            aria-invalid={invalid}
            aria-describedby={invalid ? errId : undefined}
            disabled={state.k === "checking"}
            className="min-h-10 flex-1 rounded-md border border-border bg-card px-3 font-mono text-[13px] text-foreground placeholder:text-muted-foreground/60 transition-colors duration-100 ease-out focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={state.k === "checking"}
          >
            {state.k === "checking" ? "Checking…" : "Check the halves"}
          </Button>
        </div>

        {invalid && (
          <p id={errId} className="mt-2 text-[12px] text-destructive">
            Enter a settlement id, claim hash, or signature.
          </p>
        )}

        <p className="mt-3 text-[12px] text-muted-foreground">
          Try{" "}
          <button
            type="button"
            onClick={() => setQuery("4f2a")}
            className="font-mono underline underline-offset-2 transition-colors duration-100 ease-out hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            4f2a
          </button>{" "}
          for a matched pair, or{" "}
          <button
            type="button"
            onClick={() => setQuery("c3d8")}
            className="font-mono underline underline-offset-2 transition-colors duration-100 ease-out hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            c3d8
          </button>{" "}
          for halves that diverge.
        </p>
      </form>

      <div aria-live="polite" className="mt-9">
        {state.k === "checking" && <CheckingSkeleton />}
        {state.k === "found" && <Result s={state.s} onReset={reset} />}
        {state.k === "notfound" && (
          <NotFound q={state.q} onReset={reset} />
        )}
        {state.k === "error" && (
          <ErrorState msg={state.msg} onRetry={reset} />
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- states -- */

function CheckingSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-[12px] text-muted-foreground">
        Recomputing both halves…
      </p>
      <div className="anim-scan relative mt-4 h-px overflow-hidden bg-hairline" />
      <div className="mt-6 space-y-3">
        <div className="h-3 w-2/5 rounded bg-muted" />
        <div className="h-3 w-4/5 rounded bg-muted" />
        <div className="h-3 w-1/3 rounded bg-muted" />
      </div>
    </div>
  );
}

function NotFound({ q, onReset }: { q: string; onReset: () => void }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <p className="text-[14px] font-medium">No settlement under that value</p>
      <p className="mt-2 max-w-prose text-[13px] leading-relaxed text-muted-foreground">
        Nothing in the ledger matches{" "}
        <span className="font-mono text-foreground/80">{q}</span>. Settlements
        appear here once the escrow program has seen both halves — if the job is
        still running, there is nothing to check yet.
      </p>
      <div className="mt-5">
        <Button onClick={onReset}>Clear and try another</Button>
      </div>
    </div>
  );
}

function ErrorState({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
      <p className="text-[14px] font-medium text-destructive">
        Verification could not run
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
        {msg} This is usually transient — the ledger read is retryable.
      </p>
      <div className="mt-5">
        <Button onClick={onRetry}>Try again</Button>
      </div>
    </div>
  );
}

function Result({ s, onReset }: { s: Settlement; onReset: () => void }) {
  const ok = matches(s);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-3.5">
        <span className="font-mono text-[12px] text-muted-foreground">
          Settlement {s.id}
        </span>
        {ok ? (
          <span className="inline-flex items-center gap-2 text-[12px] font-medium text-primary">
            <span className="anim-settle h-2 w-2 rotate-45 border border-primary" />
            Halves matched
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 text-[12px] font-medium text-destructive">
            <span className="h-2 w-2 rotate-45 border border-destructive" />
            Halves diverge
          </span>
        )}
      </div>

      <div className="px-5 py-5">
        <p className="text-[13.5px] leading-relaxed">{s.job}</p>

        <div className="mt-6">
          <FieldLabel>
            Claim — agent reported{" "}
            <span className="font-mono text-foreground/70">
              {s.unitsClaimed.toLocaleString("en-US")}
            </span>{" "}
            units
          </FieldLabel>
          <Mono value={s.claimHash} label="Claim hash" />
        </div>

        <Seam matched={ok} className="my-5" />

        <div>
          <FieldLabel>
            Receipt — enclave observed{" "}
            <span
              className={`font-mono ${ok ? "text-foreground/70" : "text-destructive"}`}
            >
              {s.unitsObserved.toLocaleString("en-US")}
            </span>{" "}
            units
          </FieldLabel>
          <Mono
            value={s.receiptHash}
            label="Receipt hash"
            className={ok ? undefined : "text-destructive"}
          />
        </div>

        {!ok && (
          <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-[12.5px] leading-relaxed text-muted-foreground">
            The escrow held the funds. The agent reported{" "}
            <span className="font-mono tnum text-foreground/80">
              {(s.unitsClaimed - s.unitsObserved).toLocaleString("en-US")}
            </span>{" "}
            more units than the enclave could account for, so the release
            condition never evaluated true. The mismatch stays attributed to{" "}
            <span className="font-mono text-foreground/80">{s.agentDid}</span>.
          </p>
        )}

        <dl className="mt-6 grid grid-cols-2 gap-5 border-t border-hairline pt-5 sm:grid-cols-4">
          <Field label="Amount">
            <span className="font-mono tnum">{toSol(s.amountLamports)} SOL</span>
          </Field>
          <Field label="Slot">
            <span className="font-mono tnum">
              {s.slot ? s.slot.toLocaleString("en-US") : "—"}
            </span>
          </Field>
          <Field label="Contract">
            <span className="font-mono">v{s.contractVersion}</span>
          </Field>
          <Field label="Settled">
            <span className="font-mono tnum">
              {new Date(s.settledAt).toISOString().slice(11, 19)}Z
            </span>
          </Field>
        </dl>

        <div className="mt-5">
          <FieldLabel>Devnet signature</FieldLabel>
          {s.signature ? (
            <a
              href={`https://explorer.solana.com/tx/${s.signature}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-sm underline decoration-hairline underline-offset-4 transition-colors duration-100 ease-out hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Mono
                value={s.signature}
                label="Transaction signature"
                className="text-muted-foreground"
              />
            </a>
          ) : (
            <p className="text-[12.5px] text-muted-foreground">
              None — funds were never released.
            </p>
          )}
        </div>

        <div className="mt-7">
          <Button onClick={onReset}>Check another settlement</Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1.5 text-[13px]">{children}</dd>
    </div>
  );
}
