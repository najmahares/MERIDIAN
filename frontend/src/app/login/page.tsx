"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Lock, User } from "lucide-react";
import { login } from "@/lib/api";
import { setAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await login(username, password);
      setAuth({ access_token: data.access_token, refresh_token: data.refresh_token, user: data.user });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      <div className="hidden lg:flex w-[55%] relative overflow-hidden items-center justify-center border-r border-[var(--border)]">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div 
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 0.95, 1],
              opacity: [0.15, 0.25, 0.15]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[20%] -left-[10%] w-[120%] h-[150%] bg-gradient-to-br from-[var(--brand)] to-transparent blur-[120px] rounded-[100%]" 
          />
          <motion.div 
            animate={{ 
              rotate: [0, -5, 5, 0],
              scale: [1, 1.1, 0.9, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute -bottom-[20%] -right-[10%] w-[100%] h-[120%] bg-gradient-to-tl from-[var(--cyan)] to-transparent blur-[100px] rounded-[100%]" 
          />
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.path 
              animate={{ d: ["M0,50 Q25,30 50,50 T100,50", "M0,50 Q25,70 50,50 T100,50", "M0,50 Q25,30 50,50 T100,50"] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              fill="none" 
              stroke="var(--brand-bright)" 
              strokeWidth="0.5" 
            />
            <motion.path 
              animate={{ d: ["M0,60 Q25,40 50,60 T100,60", "M0,60 Q25,80 50,60 T100,60", "M0,60 Q25,40 50,60 T100,60"] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              fill="none" 
              stroke="var(--cyan)" 
              strokeWidth="0.3" 
            />
          </svg>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center gap-6"
        >
          <Logo className="w-24 h-24 text-[var(--brand-bright)]" />
          <h1 className="text-7xl font-bold tracking-tighter text-white">
            Meridian
          </h1>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 relative">
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.2 }} 
          className="w-full max-w-md relative z-10"
        >
          <div className="flex lg:hidden items-center gap-3 mb-12">
            <Logo className="w-8 h-8 text-[var(--brand-bright)]" />
            <span className="text-2xl font-bold tracking-tight">Meridian</span>
          </div>

          <div className="surface p-10 shadow-2xl">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-2">Sign in</h2>
              <p className="text-sm text-[var(--text-muted)]">Enter your credentials to access the workspace.</p>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-5">
              <div>
                <label className="text-xs text-[var(--text-muted)] block mb-2">Username</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus
                    autoComplete="off"
                    className="w-full bg-[var(--surface-2)] text-white border border-[var(--border)] rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[var(--brand)] transition-colors"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs text-[var(--text-muted)] block mb-2">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full bg-[var(--surface-2)] text-white border border-[var(--border)] rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[var(--brand)] transition-colors"
                  />
                </div>
              </div>
              
              {error && <div className="text-sm text-[var(--red)] bg-[var(--red)]/10 p-3 rounded-lg border border-[var(--red)]/20">{error}</div>}
              
              <button
                type="submit"
                disabled={busy}
                className="group flex items-center justify-between px-6 py-3.5 mt-2 text-sm font-medium bg-[var(--brand)] hover:bg-[var(--brand-bright)] transition-colors rounded-lg disabled:opacity-50 text-white"
              >
                {busy ? "Authenticating" : "Continue"}
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>

          <div className="mt-8 text-center text-xs text-[var(--text-dim)]">
            Need access? Contact your administrator.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
