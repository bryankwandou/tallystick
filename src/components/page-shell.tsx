import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function PageShell({
  eyebrow,
  title,
  lede,
  children,
  wide = false,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-hairline bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Logo />
          </Link>
          <nav className="flex items-center gap-1" aria-label="Main">
            <NavLink href="/verify">Verify</NavLink>
            <NavLink href="/ledger">Ledger</NavLink>
            <NavLink href="/docs">Docs</NavLink>
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        <div
          className={`mx-auto px-5 py-16 sm:px-8 sm:py-20 ${
            wide ? "max-w-6xl" : "max-w-3xl"
          }`}
        >
          <div className="anim-rise">
            <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-[30px] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[36px]">
              {title}
            </h1>
            {lede && (
              <p className="mt-4 max-w-[62ch] text-[14.5px] leading-[1.7] text-muted-foreground">
                {lede}
              </p>
            )}
          </div>
          <div className="anim-rise mt-12 [animation-delay:100ms]">
            {children}
          </div>
        </div>
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-9 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Logo />
          <p className="text-[12px] text-muted-foreground">
            Devnet only. Nothing here moves mainnet funds.
          </p>
        </div>
      </footer>
    </>
  );
}

function NavLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center rounded-md px-3 text-[13px] text-muted-foreground transition-colors duration-100 ease-out hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {children}
    </Link>
  );
}
