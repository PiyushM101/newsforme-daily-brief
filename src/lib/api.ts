import { DEMO_URL, SUGGEST_URL, supabase } from "./supabase";

export type DraftTopic = {
  key: string;
  name: string;
  description: string;
  sources: string[];
  custom?: boolean;
};

export type Suggestion = { name: string; description: string; sources: string[] };

let counter = 0;
export const newKey = () => `t${Date.now()}_${counter++}`;

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("not authenticated");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function fetchSuggestions(body: {
  mode: "suggest" | "sources";
  about: string;
  role: string;
  topics?: string[];
}): Promise<Suggestion[]> {
  const res = await fetch(SUGGEST_URL, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`suggest ${res.status}`);
  const json = await res.json();
  if (!json?.ok || !Array.isArray(json.topics)) throw new Error("bad response");
  return json.topics.map((t: Suggestion) => ({
    name: String(t.name ?? "").slice(0, 80),
    description: String(t.description ?? "").slice(0, 400),
    sources: Array.isArray(t.sources) ? t.sources.map(String) : [],
  }));
}

export async function sendDemo(): Promise<boolean> {
  try {
    const res = await fetch(DEMO_URL, { method: "POST", headers: await authHeaders(), body: "{}" });
    return res.ok;
  } catch {
    return false;
  }
}

/** Replace all topics and sources: delete sources, delete topics, insert topics, insert sources. */
export async function replaceTopicsAndSources(
  userId: string,
  topics: DraftTopic[],
  globalSources: string[],
) {
  const d1 = await supabase.from("sources").delete().eq("user_id", userId);
  if (d1.error) throw d1.error;
  const d2 = await supabase.from("topics").delete().eq("user_id", userId);
  if (d2.error) throw d2.error;

  let inserted: { id: string; position: number }[] = [];
  if (topics.length) {
    const r = await supabase
      .from("topics")
      .insert(
        topics.map((t, i) => ({
          user_id: userId,
          name: t.name.trim().slice(0, 80),
          description: t.description.trim().slice(0, 400) || null,
          position: i,
        })),
      )
      .select("id, position");
    if (r.error) throw r.error;
    inserted = r.data ?? [];
  }

  const rows: { user_id: string; topic_id: string | null; domain: string }[] = [];
  const seen = new Set<string>();
  const push = (topic_id: string | null, domain: string) => {
    const k = `${topic_id}|${domain}`;
    if (seen.has(k)) return;
    seen.add(k);
    rows.push({ user_id: userId, topic_id, domain });
  };
  topics.forEach((t, i) => {
    const id = inserted.find((x) => x.position === i)?.id;
    if (id) t.sources.forEach((s) => push(id, s));
  });
  globalSources.forEach((s) => push(null, s));
  if (rows.length) {
    const r = await supabase.from("sources").insert(rows);
    if (r.error) throw r.error;
  }
}
