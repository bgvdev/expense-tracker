import { cn } from "@/lib/cn";

/**
 * Standard page gutter and max width for every signed-in screen. There is one
 * width on purpose: switching between screens should not make the content jump
 * wider or narrower. Screens with short forms (Settings) lay out into columns
 * within it rather than asking for a narrower page.
 */
export default function Page({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("mx-auto w-full max-w-[90rem] px-4 py-6 md:px-8 md:py-8", className)}>
      {children}
    </div>
  );
}
