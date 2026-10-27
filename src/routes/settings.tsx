import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { HourSelect, LoadingNote, SourceChips, SuggestionCard, TimezonePicker } from "@/components/editors";
import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { fetchSuggestions, newKey, replaceTopicsAndSources, type DraftTopic, type Suggestion } from "@/lib/api";
import { MAX_TOPICS, friendlyError } from "@/lib/domain";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/settings")({
  ssr: false,
  validateSearch: z.object({ pause: z.coerce.string().optional() }),
  beforeLoad: requireUser,
  head: () => ({
    meta: [
      { title: "Settings | NewsForMe" },
      { name: "description", content: "Change your topics, sources and delivery time." },
      { property: "og:title", content: "Settings | NewsForMe" },
      { property: "og:description", content: "Change your topics, sources and delivery time." },
    ],
  }),
  component: Settings,
});

type Briefing = { id: string; kind: string; status: string; subject: string | null; created_at: string };

function Section({ id, title, children, onSave, saving }: { id: string; title: string; children: React.ReactNode; onSave: () => void; saving: boolean }) {
  return (
    <section id={id} className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
      <div className="mt-5 flex justify-end">
        <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
      </div>
    </section>
  );
}

function Settings() {
  const { user } = Route.useRouteContext();
  const { pause } = Route.useSearch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [about, setAbout] = useState("");
  const [hour, setHour] = useState(8);
  const [tz, setTz] = useState("America/New_York");
  const [active, setActive] = useState(true);
  const [topics, setTopics] = useState<DraftTopic[]>([]);
  const [globalSources, setGlobalSources] = useState<string[]>([]);
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [sugs, setSugs] = useState<Suggestion[] | null>(null);
  const [sugLoading, setSugLoading] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const deliveryRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    setLoadError(false);
    try {
      const [p, t, s, b] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("topics").select("id,name,description,position").eq("user_id", user.id).order("position"),
        supabase.from("sources").select("topic_id,domain").eq("user_id", user.id),
        supabase.from("briefings").select("id,kind,status,subject,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);
      for (const r of [p, t, s, b]) if (r.error) throw r.error;
      const pr = p.data;
      if (pr) {
        setFullName(pr.full_name ?? ""); setRole(pr.role ?? ""); setAbout(pr.about ?? "");
        setHour(pr.send_hour ?? 8); setTz(pr.timezone ?? "America/New_York"); setActive(pr.is_active ?? true);
      }
      const src = s.data ?? [];
      setTopics((t.data ?? []).map((x) => ({ key: x.id, name: x.name, description: x.description ?? "", sources: src.filter((y) => y.topic_id === x.id).map((y) => y.domain) })));
      setGlobalSources(src.filter((y) => !y.topic_id).map((y) => y.domain));
      setBriefings((b.data ?? []) as Briefing[]);
    } catch (e) {
      setLoadError(true);
      toast.error(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user.id]);

  useEffect(() => {
    if (!loading && pause && deliveryRef.current) {
      deliveryRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlight(true);
    }
  }, [loading, pause]);

  async function saveProfile(fields: Record<string, unknown>, label: string) {
    setSaving(label);
    const { error } = await supabase.from("profiles").update(fields).eq("id", user.id);
    setSaving(null);
    if (error) toast.error(friendlyError(error)); else toast.success("Saved.");
  }
  async function saveTopics(label: string) {
    if (topics.some((t) => !t.name.trim())) { toast.error("Every topic needs a name."); return; }
    setSaving(label);
    try { await replaceTopicsAndSources(user.id, topics, globalSources); toast.success("Saved."); await load(); }
    catch (e) { toast.error(friendlyError(e)); }
    finally { setSaving(null); }
  }
  async function getSuggestions() {
    setSugLoading(true);
    try { setSugs(await fetchSuggestions({ mode: "suggest", about, role })); }
    catch { toast.error("We could not load ideas. Try again or type your own."); }
    finally { setSugLoading(false); }
  }
  function addTopic(name: string, description = "", sources: string[] = []) {
    if (topics.length >= MAX_TOPICS) { toast.error("You can have up to 5 topics."); return; }
    if (!name.trim()) return;
    if (topics.some((t) => t.name.toLowerCase() === name.trim().toLowerCase())) { toast.error("You already have that topic."); return; }
    setTopics((p) => [...p, { key: newKey(), name: name.trim().slice(0, 80), description, sources }]);
  }
  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  async function deleteAccount() {
    setDeleting(true);
    try {
      const { error } = await supabase.rpc("delete_my_account");
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success("Your account and data are deleted.");
      navigate({ to: "/", replace: true });
    } catch (e) {
      toast.error(friendlyError(e));
      setDeleting(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-3xl px-5 py-12"><LoadingNote text="Loading your settings..." /></div>;
  if (loadError) return (
    <div className="mx-auto max-w-3xl px-5 py-16 text-center">
      <p className="text-muted-foreground">We could not load your settings.</p>
      <Button className="mt-4" onClick={load}>Try again</Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-semibold">Settings</h1>
        <Button variant="outline" onClick={signOut}>Sign out</Button>
      </div>

      <Section id="profile" title="Profile" saving={saving === "profile"} onSave={() => {
        if (about.trim().length < 30) { toast.error("Please write at least 30 characters about you."); return; }
        saveProfile({ full_name: fullName.trim() || null, role: role.trim() || null, about: about.trim() }, "profile");
      }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="n">Full name</Label><Input id="n" maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="r">Role</Label><Input id="r" maxLength={100} value={role} onChange={(e) => setRole(e.target.value)} /></div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="a">About you</Label>
          <Textarea id="a" rows={4} maxLength={1000} value={about} onChange={(e) => setAbout(e.target.value)} />
          <div className="text-right text-xs text-muted-foreground">{about.length} / 1000</div>
        </div>
      </Section>

      <Section id="topics" title={`Topics (${topics.length} of ${MAX_TOPICS})`} saving={saving === "topics"} onSave={() => saveTopics("topics")}>
        {topics.length === 0 && <p className="text-sm text-muted-foreground">No topics yet. Add one below.</p>}
        {topics.map((t) => (
          <div key={t.key} className="flex gap-2">
            <Input aria-label="Topic name" maxLength={80} value={t.name} onChange={(e) => setTopics((p) => p.map((x) => x.key === t.key ? { ...x, name: e.target.value } : x))} />
            <Button variant="ghost" size="icon" aria-label={`Remove ${t.name}`} onClick={() => setTopics((p) => p.filter((x) => x.key !== t.key))}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input placeholder="Add a topic" maxLength={80} value={newTopic} disabled={topics.length >= MAX_TOPICS} onChange={(e) => setNewTopic(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { addTopic(newTopic); setNewTopic(""); } }} />
          <Button variant="outline" disabled={topics.length >= MAX_TOPICS} onClick={() => { addTopic(newTopic); setNewTopic(""); }}><Plus className="h-4 w-4" /> Add</Button>
        </div>
        <Button variant="secondary" onClick={getSuggestions} disabled={sugLoading}><Sparkles className="h-4 w-4" /> Get suggestions</Button>
        {sugLoading && <LoadingNote text="Finding ideas for you. This takes 10 to 30 seconds." />}
        {sugs && (
          <div className="grid gap-3 sm:grid-cols-2">
            {sugs.map((s) => (
              <SuggestionCard key={s.name} name={s.name} description={s.description}
                selected={topics.some((t) => t.name.toLowerCase() === s.name.toLowerCase())}
                disabled={topics.length >= MAX_TOPICS}
                onToggle={() => {
                  if (topics.some((t) => t.name.toLowerCase() === s.name.toLowerCase())) setTopics((p) => p.filter((t) => t.name.toLowerCase() !== s.name.toLowerCase()));
                  else addTopic(s.name, s.description, s.sources);
                }} />
            ))}
          </div>
        )}
      </Section>

      <Section id="sources" title="Sources" saving={saving === "sources"} onSave={() => saveTopics("sources")}>
        <p className="text-sm text-muted-foreground">Reuters and AP are always included.</p>
        {topics.map((t) => (
          <div key={t.key}>
            <h3 className="mb-2 text-lg font-semibold">{t.name || "Untitled topic"}</h3>
            <SourceChips sources={t.sources} onChange={(s) => setTopics((p) => p.map((x) => x.key === t.key ? { ...x, sources: s } : x))} />
          </div>
        ))}
        <div className="border-t border-border pt-4">
          <h3 className="mb-2 text-lg font-semibold">Sources for all topics</h3>
          <SourceChips sources={globalSources} onChange={setGlobalSources} />
        </div>
      </Section>

      <Section id="delivery" title="Delivery" saving={saving === "delivery"} onSave={() => saveProfile({ send_hour: hour, timezone: tz, is_active: active }, "delivery")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Time</Label><HourSelect value={hour} onChange={setHour} /></div>
          <div className="space-y-2"><Label>Time zone</Label><TimezonePicker value={tz} onChange={setTz} /></div>
        </div>
        <div ref={deliveryRef} className={cn("flex items-center justify-between rounded-md border border-border p-4", highlight && "highlight-pulse border-primary")}>
          <div>
            <Label htmlFor="pause" className="text-base">Pause emails</Label>
            <p className="text-sm text-muted-foreground">{active ? "Your daily brief is on." : "Your daily brief is paused."}</p>
          </div>
          <Switch id="pause" checked={!active} onCheckedChange={(v) => setActive(!v)} />
        </div>
      </Section>

      <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
        <h2 className="text-2xl font-semibold">Recent briefings</h2>
        {briefings.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No briefings yet. Your first one is coming soon.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {briefings.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{b.subject || (b.kind === "demo" ? "Your first brief" : "Daily brief")}</div>
                  <div className="text-muted-foreground">{new Date(b.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}</div>
                </div>
                <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", b.status === "sent" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>
                  {b.status === "sent" ? "Sent" : "Failed"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-destructive/40 bg-card p-5 sm:p-6">
        <h2 className="text-2xl font-semibold">Delete account</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          This removes your account, profile, topics, sources, and email history right away. It cannot be undone.
        </p>
        <AlertDialog onOpenChange={(open) => { if (!open) setConfirmText(""); }}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="mt-4 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive">
              Delete my account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                Your briefs stop and all your data is deleted. You can sign up again later, but you will start from scratch.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor="confirm-delete">Type DELETE to confirm</Label>
              <Input id="confirm-delete" autoComplete="off" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={confirmText.trim().toUpperCase() !== "DELETE" || deleting}
                onClick={deleteAccount}
              >
                {deleting ? "Deleting..." : "Delete forever"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}
