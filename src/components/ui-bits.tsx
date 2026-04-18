import { type ReactNode } from "react";

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label>{label}</label>
      {children}
      {hint && !error && (
        <p className="font-mono text-[10px] text-muted-foreground/70 uppercase tracking-wider">
          {hint}
        </p>
      )}
      {error && (
        <p className="font-mono text-[11px] text-destructive">{error}</p>
      )}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`panel p-5 sm:p-7 ${className}`}>
      <span className="panel-corner-tl" />
      <span className="panel-corner-tr" />
      <span className="panel-corner-bl" />
      <span className="panel-corner-br" />
      <div className="relative">{children}</div>
    </div>
  );
}

export function SectionTitle({
  index,
  title,
  subtitle,
}: {
  index: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-spider mb-1">
        {index}
      </p>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
      {subtitle && (
        <p className="font-mono text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}
