/**
 * Decorative, flat (no gradients) shapes fixed behind every page. They are
 * drawn in the primary/accent tokens at low opacity, so they follow the
 * active palette and light/dark theme automatically. Purely visual: hidden
 * from assistive tech and never intercepts clicks.
 */
export default function BackgroundShapes() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Large soft disc, top right */}
      <div className="absolute -right-32 -top-40 h-[30rem] w-[30rem] rounded-full bg-primary/[0.06] dark:bg-primary/[0.07]" />

      {/* Thick ring, bottom left */}
      <div className="absolute -bottom-40 -left-32 h-[26rem] w-[26rem] rounded-full border-[36px] border-accent/[0.07] dark:border-accent/[0.08]" />

      {/* Tilted rounded square, mid right */}
      <div className="absolute right-[8%] top-[55%] h-40 w-40 rotate-12 rounded-[2.5rem] bg-accent/[0.06] dark:bg-accent/[0.07]" />

      {/* Small disc, upper left of the content area */}
      <div className="absolute left-[30%] top-[14%] h-16 w-16 rounded-full bg-accent/[0.08]" />

      {/* Thin outlined square, lower middle */}
      <div className="absolute bottom-[12%] left-[48%] h-24 w-24 -rotate-12 rounded-2xl border-2 border-primary/[0.1]" />

      {/* Dot grid, top left */}
      <svg className="absolute left-[18%] top-8 h-32 w-48 text-primary/[0.14]" viewBox="0 0 192 128">
        <defs>
          <pattern id="bg-dots" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="2" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="192" height="128" fill="url(#bg-dots)" />
      </svg>

      {/* Plus marks */}
      <svg className="absolute right-[24%] top-[22%] h-6 w-6 text-accent/30" viewBox="0 0 24 24">
        <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <svg className="absolute bottom-[28%] left-[12%] h-5 w-5 text-primary/25" viewBox="0 0 24 24">
        <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      {/* Wavy line, bottom right */}
      <svg className="absolute bottom-[6%] right-[6%] h-10 w-40 text-primary/[0.18]" viewBox="0 0 160 40" fill="none">
        <path
          d="M2 20c13-16 26-16 39 0s26 16 39 0 26-16 39 0 26 16 39 0"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
