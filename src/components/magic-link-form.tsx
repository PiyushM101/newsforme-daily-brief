import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendMagicLink } from "@/lib/auth";
import { friendlyError } from "@/lib/domain";

export function MagicLinkForm({ cta = "Send my link" }: { cta?: string }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function send(addr: string) {
    setSending(true);
    try {
      await sendMagicLink(addr);
      setSentTo(addr);
      setCooldown(60);
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setSending(false);
    }
  }

  if (sentTo) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 shadow-paper">
        <div className="flex items-center gap-2 font-display text-xl font-semibold">
          <Mail className="h-5 w-5 text-primary" /> Check your inbox
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a sign in link to <strong className="text-foreground">{sentTo}</strong>. Open it on
          this device.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" disabled={cooldown > 0 || sending} onClick={() => send(sentTo)}>
            {cooldown > 0 ? `Resend in ${cooldown}s` : sending ? "Sending..." : "Resend link"}
          </Button>
          <Button variant="ghost" onClick={() => setSentTo(null)}>
            Use a different email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) return toast.error("Please enter a valid email.");
        send(email.trim());
      }}
    >
      <Input
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-11 bg-card"
        aria-label="Email address"
      />
      <Button type="submit" size="lg" className="h-11" disabled={sending}>
        {sending ? "Sending..." : cta}
      </Button>
    </form>
  );
}
