import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Panel } from "@/components/ui-bits";
import { UserPlus, Loader2 } from "lucide-react";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    const { error } = await signUp(email.trim(), password);
    setBusy(false);
    if (error) {
      setError(error);
      return;
    }
    setInfo("Account created. Signing you in…");
    setTimeout(() => navigate({ to: "/" }), 1200);
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
            Create Team Leader Account
          </p>
        </div>
        <Panel>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label>Team Leader Email</label>
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label>Confirm Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
              />
            </div>
            {error && <p className="font-mono text-[11px] text-destructive">{error}</p>}
            {info && <p className="font-mono text-[11px] text-cyan-edge">{info}</p>}
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? (
                <><Loader2 size={16} className="animate-spin" /> Creating…</>
              ) : (
                <><UserPlus size={16} /> Create Account</>
              )}
            </button>
            <p className="font-mono text-xs text-center text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-cyan-edge hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </Panel>
        <p className="text-center font-mono text-[10px] text-muted-foreground mt-4 px-4 leading-relaxed">
          One account per team. Your draft is auto-saved as you fill the form, so you can return any time and continue where you left off.
        </p>
      </div>
    </div>
  );
}
