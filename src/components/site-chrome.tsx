import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useSignedIn() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => data.subscription.unsubscribe();
  }, []);
  return signedIn;
}

export function SiteHeader() {
  const signedIn = useSignedIn();
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link to="/" className="font-display text-2xl font-bold tracking-tight text-foreground">
          NewsForMe
        </Link>
        {signedIn === null ? null : signedIn ? (
          <Link to="/settings" className="text-sm font-medium text-foreground hover:text-primary">
            Settings
          </Link>
        ) : (
          <Link to="/login" className="text-sm font-medium text-foreground hover:text-primary">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <span className="font-display text-base font-semibold text-foreground">NewsForMe</span>
        <div className="flex gap-5">
          <Link to="/privacy" className="hover:text-primary">
            Privacy
          </Link>
          <a href="mailto:hello@newsforme.fyi" className="hover:text-primary">
            hello@newsforme.fyi
          </a>
        </div>
      </div>
    </footer>
  );
}
