import ThemeToggle from "@/components/ui/ThemeToggle";

interface AuthCardProps {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Line under the card, e.g. "Don't have an account? Sign up". */
  footer?: React.ReactNode;
}

/** Centered, single-column frame shared by login, register and password reset. */
export default function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-semibold text-primary-foreground">
            ₹
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">{children}</div>

        {footer && <p className="mt-6 text-center text-sm text-muted">{footer}</p>}
      </div>
    </main>
  );
}
