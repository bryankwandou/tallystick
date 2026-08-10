/**
 * Monospace display for identifiers: DIDs, signatures, pubkeys, contract names.
 *
 * Long identifiers are truncated in the middle, never the end — the tail of a
 * base58 signature carries as much disambiguating information as the head, and
 * users comparing two values scan both ends.
 */
export function Mono({
  value,
  truncate,
  className,
  label,
}: {
  value: string;
  /** Chars to keep on each side. Omit to show the full value. */
  truncate?: number;
  className?: string;
  /** Accessible label, e.g. "Transaction signature". */
  label?: string;
}) {
  const display =
    truncate && value.length > truncate * 2 + 1
      ? `${value.slice(0, truncate)}…${value.slice(-truncate)}`
      : value;

  return (
    <span
      className={`font-mono tnum text-[12.5px] leading-relaxed break-all ${className ?? ""}`}
      title={truncate ? value : undefined}
      aria-label={label ? `${label}: ${value}` : undefined}
    >
      {display}
    </span>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </p>
  );
}
