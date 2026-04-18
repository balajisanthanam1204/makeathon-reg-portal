export function Header() {
  return (
    <header className="relative pt-10 sm:pt-16 pb-8 px-4 text-center">
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="tag tag-spider">SVCE · ECE</span>
        <span className="tag tag-cyan">Final Round</span>
      </div>
      <h1
        data-text="MAKE-A-THON 7.0"
        className="glitch text-4xl sm:text-6xl md:text-7xl mb-3 px-2"
      >
        MAKE-A-THON 7.0
      </h1>
      <p className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">
        ECE Department · SVCE · Final Registration
      </p>
      <div className="mt-6 mx-auto max-w-md scan-line" />
    </header>
  );
}
