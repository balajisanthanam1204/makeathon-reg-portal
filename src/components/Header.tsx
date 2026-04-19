import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { LogOut, ShieldCheck } from "lucide-react";

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  return (
    <header className="relative pt-8 sm:pt-12 pb-6 px-4 text-center">
      {/* Top action bar */}
      {user && (
        <div className="max-w-5xl mx-auto flex items-center justify-end gap-3 mb-6">
          {isAdmin && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-cyan-edge hover:text-foreground transition-colors"
            >
              <ShieldCheck size={14} /> Admin
            </Link>
          )}
          <span className="font-mono text-[11px] text-muted-foreground hidden sm:inline">
            {user.email}
          </span>
          <button
            onClick={signOut}
            className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-spider transition-colors flex items-center gap-1"
          >
            <LogOut size={12} /> Sign out
          </button>
        </div>
      )}

      {/* Logo wordmark */}
      <Link to="/" className="inline-block mb-2">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="tag tag-spider">SVCE · ECE</span>
          <span className="tag tag-cyan">Final Round</span>
        </div>
        <h1
          data-text="MAKEATHON 7.0"
          className="glitch text-4xl sm:text-6xl md:text-7xl mb-2 px-2"
        >
          MAKEATHON <span className="text-cyan-edge">7.0</span>
        </h1>
        <p className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">
          A 24-Hour Hackathon · ECE Department · SVCE
        </p>
      </Link>

      <div className="mt-5 mx-auto max-w-md scan-line" />
    </header>
  );
}
