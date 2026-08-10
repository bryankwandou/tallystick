/**
 * The seam — the structural device the whole layout hangs on.
 *
 * A tally stick is cleft lengthwise; the two halves only prove a record when
 * their notches align. Here the seam divides a claim from its receipt. It is
 * load-bearing layout, not decoration: if a Seam is not separating two things
 * that genuinely represent the two halves, it should be deleted.
 */
export function Seam({
  matched = true,
  className,
}: {
  matched?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center ${className ?? ""}`}
      aria-hidden="true"
    >
      <span className="h-px flex-1 bg-hairline" />
      <span
        className={`mx-0 h-2 w-2 rotate-45 border ${
          matched ? "border-primary" : "border-muted-foreground"
        }`}
      />
      <span className="h-px flex-1 bg-hairline" />
    </div>
  );
}

/** Vertical variant, used to split the hero's two halves on wide viewports. */
export function SeamVertical({ className }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center ${className ?? ""}`}
      aria-hidden="true"
    >
      <span className="w-px flex-1 bg-hairline" />
      <span className="my-0 h-2 w-2 rotate-45 border border-primary" />
      <span className="w-px flex-1 bg-hairline" />
    </div>
  );
}
