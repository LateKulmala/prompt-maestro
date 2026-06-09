import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Zap, LogOut, History, Sparkles, Palette, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const initial = (user.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/app" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary group-hover:bg-primary/25 transition">
              <Zap className="h-4 w-4" fill="currentColor" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Prompt Engine</span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              to="/app"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition"
              activeProps={{ className: "text-foreground bg-accent" }}
              activeOptions={{ exact: true }}
            >
              <Sparkles className="h-3.5 w-3.5" /> Generate
            </Link>
            <Link
              to="/history"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition"
              activeProps={{ className: "text-foreground bg-accent" }}
            >
              <History className="h-3.5 w-3.5" /> History
            </Link>
            <Link
              to="/style"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition"
              activeProps={{ className: "text-foreground bg-accent" }}
            >
              <Palette className="h-3.5 w-3.5" /> Tyyli
            </Link>
            <Link
              to="/api-keys"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition"
              activeProps={{ className: "text-foreground bg-accent" }}
            >
              <KeyRound className="h-3.5 w-3.5" /> API
            </Link>

            <div className="relative ml-2">
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-semibold ring-1 ring-primary/30 hover:bg-primary/30 transition"
                aria-label="Account menu"
              >
                {initial}
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-popover p-1.5 shadow-xl">
                  <div className="px-3 py-2 text-xs text-muted-foreground truncate border-b border-border mb-1">
                    {user.email}
                  </div>
                  <Link
                    to="/app"
                    className="sm:hidden flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                  >
                    <Sparkles className="h-4 w-4" /> Generate
                  </Link>
                  <Link
                    to="/history"
                    className="sm:hidden flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                  >
                    <History className="h-4 w-4" /> History
                  </Link>
                  <Link
                    to="/style"
                    className="sm:hidden flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                  >
                    <Palette className="h-4 w-4" /> Tyyli
                  </Link>
                  <Link
                    to="/api-keys"
                    className="sm:hidden flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                  >
                    <KeyRound className="h-4 w-4" /> API
                  </Link>
                  <button
                    onClick={signOut}
                    className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
