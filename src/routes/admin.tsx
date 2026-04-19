import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Panel } from "@/components/ui-bits";
import { ShieldCheck, Loader2, Download, LogOut, Lock, Crown } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type TeamRow = {
  id: string;
  reference_id: string;
  team_number: number;
  team_name: string;
  team_size: number;
  is_svce: boolean;
  college_name: string | null;
  category: string;
  problem_statement_id: string | null;
  problem_statement_name: string | null;
  company_name: string | null;
  mentor_name: string;
  mentor_designation: string | null;
  mentor_phone: string | null;
  mentor_email: string | null;
  payment_transaction_id: string;
  payment_bank_name: string;
  payer_name: string | null;
  payer_mobile: string | null;
  amount_paid: number | null;
  payment_screenshot_url: string | null;
  submission_status: string;
  submitted_at: string;
};

type MemberRow = {
  id: string;
  team_id: string;
  unique_member_id: string;
  member_order: number;
  is_leader: boolean;
  full_name: string;
  department: string;
  department_other: string | null;
  year_of_study: string;
  registration_number: string | null;
  phone_number: string;
  whatsapp_number: string | null;
  college_email: string;
  personal_email: string;
  photo_url: string | null;
};

function AdminPage() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [verified, setVerified] = useState(false);
  const [pin, setPin] = useState("");
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const verifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyMsg(null);
    const { data, error } = await supabase.rpc("admin_verify", { p_pin: pin });
    setVerifying(false);
    if (error) {
      setVerifyMsg(error.message);
      return;
    }
    const r = data as { ok: boolean; error?: string };
    if (!r.ok) {
      setVerifyMsg(r.error ?? "Verification failed");
      return;
    }
    setVerified(true);
  };

  useEffect(() => {
    if (!verified) return;
    (async () => {
      setDataLoading(true);
      const [{ data: t }, { data: m }] = await Promise.all([
        supabase.from("teams").select("*").order("team_number", { ascending: true }),
        supabase.from("members").select("*").order("member_order", { ascending: true }),
      ]);
      setTeams((t as TeamRow[]) ?? []);
      setMembers((m as MemberRow[]) ?? []);
      setDataLoading(false);
    })();
  }, [verified]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-spider" />
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="panel max-w-md w-full p-8 text-center">
          <span className="panel-corner-tl" />
          <span className="panel-corner-tr" />
          <span className="panel-corner-bl" />
          <span className="panel-corner-br" />
          <div className="relative">
            <Lock size={28} className="mx-auto text-spider mb-3" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="font-mono text-xs text-muted-foreground mb-4">
              Your account does not have admin privileges.
            </p>
            <button onClick={signOut} className="btn-ghost">
              <LogOut size={14} className="inline mr-1" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!verified) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold tracking-tight">
              <ShieldCheck className="inline mr-2 text-spider" size={28} /> Admin Access
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-2">
              Enter your 4-digit PIN
            </p>
          </div>
          <Panel>
            <form onSubmit={verifyPin} className="space-y-4">
              <div>
                <label>Admin PIN</label>
                <input
                  type="password"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="text-center tracking-[0.5em]"
                />
              </div>
              {verifyMsg && (
                <p className="font-mono text-[11px] text-destructive">{verifyMsg}</p>
              )}
              <p className="font-mono text-[10px] text-muted-foreground">
                3 wrong attempts will lock you out for 2 hours.
              </p>
              <button type="submit" className="btn-primary w-full" disabled={verifying}>
                {verifying ? (
                  <><Loader2 size={16} className="animate-spin" /> Verifying…</>
                ) : (
                  <><ShieldCheck size={16} /> Verify</>
                )}
              </button>
            </form>
          </Panel>
        </div>
      </div>
    );
  }

  // ---- Verified admin dashboard ----
  const stats = {
    total: teams.length,
    hardware: teams.filter((t) => t.category === "Hardware").length,
    software: teams.filter((t) => t.category === "Software").length,
    industry: teams.filter((t) => t.category === "Industry Problem Statement").length,
    svce: teams.filter((t) => t.is_svce).length,
    other: teams.filter((t) => !t.is_svce).length,
    pending: teams.filter((t) => t.submission_status === "pending").length,
    verifiedCount: teams.filter((t) => t.submission_status === "verified").length,
    totalMembers: members.length,
    totalAmount: teams.reduce((s, t) => s + (t.amount_paid ?? 0), 0),
  };

  const downloadCsv = () => {
    const rows: string[][] = [];
    rows.push([
      "Reference ID", "Team Number", "Team Name", "Size", "College", "Category",
      "PS ID", "PS Name", "Company", "Mentor", "Mentor Phone", "Mentor Email",
      "Txn ID", "Bank", "Payer Name", "Payer Mobile", "Amount", "Status", "Submitted At",
      "Member Order", "Unique Member ID", "Member Name", "Department", "Year",
      "Reg No", "Phone", "WhatsApp", "College Email", "Personal Email",
    ]);
    teams.forEach((t) => {
      const tm = members.filter((m) => m.team_id === t.id);
      tm.forEach((m) => {
        rows.push([
          t.reference_id, String(t.team_number), t.team_name, String(t.team_size),
          t.is_svce ? "SVCE" : (t.college_name ?? ""), t.category,
          t.problem_statement_id ?? "", t.problem_statement_name ?? "", t.company_name ?? "",
          t.mentor_name, t.mentor_phone ?? "", t.mentor_email ?? "",
          t.payment_transaction_id, t.payment_bank_name, t.payer_name ?? "", t.payer_mobile ?? "",
          String(t.amount_paid ?? ""), t.submission_status, t.submitted_at,
          String(m.member_order), m.unique_member_id, m.full_name,
          m.department === "Other" ? (m.department_other ?? "Other") : m.department,
          m.year_of_study, m.registration_number ?? "", m.phone_number, m.whatsapp_number ?? "",
          m.college_email, m.personal_email,
        ]);
      });
    });
    const csv = rows
      .map((r) => r.map((c) => `"${(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `makeathon7-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <ShieldCheck className="text-spider" size={26} /> Admin Dashboard
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-1">
              Makeathon 7.0 · Registration Overview
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={downloadCsv} className="btn-primary">
              <Download size={14} /> Download CSV
            </button>
            <button onClick={signOut} className="btn-ghost">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Stat label="Total Teams" value={stats.total} accent="spider" />
          <Stat label="Total Members" value={stats.totalMembers} accent="cyan" />
          <Stat label="Hardware" value={stats.hardware} accent="cyan" />
          <Stat label="Software" value={stats.software} accent="cyan" />
          <Stat label="Industry PS" value={stats.industry} accent="amber" />
          <Stat label="SVCE Teams" value={stats.svce} accent="spider" />
          <Stat label="Other College" value={stats.other} accent="cyan" />
          <Stat label="₹ Collected" value={`₹${stats.totalAmount.toLocaleString("en-IN")}`} accent="amber" />
        </div>

        {dataLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-spider" />
          </div>
        ) : teams.length === 0 ? (
          <Panel>
            <p className="text-center font-mono text-sm text-muted-foreground py-8">
              No registrations yet.
            </p>
          </Panel>
        ) : (
          <div className="space-y-4">
            {teams.map((t) => {
              const tm = members.filter((m) => m.team_id === t.id);
              return (
                <div key={t.id} className="panel p-5">
                  <span className="panel-corner-tl" />
                  <span className="panel-corner-tr" />
                  <span className="panel-corner-bl" />
                  <span className="panel-corner-br" />
                  <div className="relative">
                    <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-spider">
                          #{t.team_number} · {t.reference_id}
                        </p>
                        <h3 className="text-lg font-bold">{t.team_name}</h3>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {t.is_svce ? "SVCE" : t.college_name} · {t.category} · {t.team_size} members
                        </p>
                        {t.problem_statement_id && (
                          <p className="font-mono text-[11px] text-cyan-edge mt-1">
                            PS: {t.problem_statement_id} — {t.problem_statement_name}
                            {t.company_name && ` · ${t.company_name}`}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`tag ${t.submission_status === "verified" ? "tag-cyan" : t.submission_status === "rejected" ? "tag-spider" : "tag-amber"}`}>
                          {t.submission_status}
                        </span>
                        <p className="font-mono text-[10px] text-muted-foreground mt-2">
                          ₹{(t.amount_paid ?? 0).toLocaleString("en-IN")} · TXN: {t.payment_transaction_id}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          Payer: {t.payer_name} ({t.payer_mobile})
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {tm.map((m) => (
                        <div key={m.id} className="rounded-md border border-border p-3 bg-[oklch(0.16_0.03_270)]">
                          <div className="flex items-center gap-1 mb-1">
                            {m.is_leader && <Crown size={11} className="text-amber-edge" />}
                            <p className="font-mono text-xs font-bold text-spider tracking-wider">
                              {m.unique_member_id}
                            </p>
                          </div>
                          <p className="font-mono text-xs text-foreground truncate">{m.full_name}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            {m.department === "Other" ? m.department_other : m.department} · {m.year_of_study}
                          </p>
                          <p className="font-mono text-[10px] text-muted-foreground truncate">
                            📱 {m.phone_number}
                          </p>
                          <p className="font-mono text-[10px] text-muted-foreground truncate">
                            {m.college_email}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 pt-3 border-t border-border font-mono text-[10px] text-muted-foreground">
                      Mentor: {t.mentor_name}
                      {t.mentor_designation && ` (${t.mentor_designation})`}
                      {t.mentor_phone && ` · ${t.mentor_phone}`}
                      {t.mentor_email && ` · ${t.mentor_email}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent: "spider" | "cyan" | "amber" }) {
  const color = accent === "spider" ? "text-spider" : accent === "cyan" ? "text-cyan-edge" : "text-amber-edge";
  return (
    <div className="rounded-lg border border-border bg-[oklch(0.16_0.03_270)] p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
    </div>
  );
}
