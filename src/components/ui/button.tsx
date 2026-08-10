import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

const base =
  "anim-press inline-flex items-center justify-center gap-2 rounded-md " +
  "text-[13px] font-medium leading-none " +
  "min-h-10 px-4 " +
  "transition-colors duration-100 ease-out " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
  "disabled:pointer-events-none disabled:opacity-45";

const variants = {
  /* Accent = verification. Exactly one primary action per view. */
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary:
    "border border-border bg-transparent text-foreground hover:bg-secondary",
  ghost: "bg-transparent text-muted-foreground hover:text-foreground",
} as const;

type Variant = keyof typeof variants;

export function Button({
  variant = "secondary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`${base} ${variants[variant]} ${className ?? ""}`}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "secondary",
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant }) {
  return (
    <a
      className={`${base} ${variants[variant]} ${className ?? ""}`}
      {...props}
    />
  );
}
