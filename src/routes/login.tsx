import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Panel } from "@/components/ui-bits";
import { LogIn, Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) {
      setError(error);
      return;
    }
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1
            data-text="MAKEATHON 7.0"
            className="glitch text-4xl sm:text-5xl mb-2"
          >
            MAKEATHON <span className="text-cyan-edge">7.0</span>
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Final Registration · Sign In
          </p>
        </div>
        <Panel>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label>Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="leader@example.com"
              />
            </div>
            <div>
              <label>Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="font-mono text-[11px] text-destructive">{error}</p>
            )}
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? (
                <><Loader2 size={16} className="animate-spin" /> Signing in…</>
              ) : (
                <><LogIn size={16} /> Sign In</>
              )}
            </button>
            <p className="font-mono text-xs text-center text-muted-foreground">
              No account?{" "}
              <Link to="/signup" className="text-cyan-edge hover:underline">
                Create one
              </Link>
            </p>
          </form>
        </Panel>
      </div>
    </div>
  );
}
