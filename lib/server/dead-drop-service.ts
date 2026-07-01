import { DeadDrop } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET = "signal-dead-drops";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function objectKey(dateKey: string, number: number) {
  return `${dateKey}/${number}.json`;
}

function parseDrop(raw: string, dateKey: string, number: number): DeadDrop | null {
  try {
    const parsed = JSON.parse(raw) as DeadDrop;
    if (!parsed.body || parsed.expiresAt < Date.now()) {
      return null;
    }
    return {
      id: parsed.id || generateId(),
      body: parsed.body,
      createdAt: parsed.createdAt,
      expiresAt: parsed.expiresAt,
      frequencyNumber: number,
      dateKey,
      frequencyKind: parsed.frequencyKind,
      frequencyLabel: parsed.frequencyLabel
    };
  } catch {
    return null;
  }
}

async function readFromStorage(dateKey: string, number: number): Promise<DeadDrop[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase.storage.from(BUCKET).download(objectKey(dateKey, number));
  if (error || !data) return [];

  const text = await data.text();
  try {
    const arr = JSON.parse(text) as DeadDrop[];
    return arr.filter((d) => d.expiresAt > Date.now());
  } catch {
    const single = parseDrop(text, dateKey, number);
    return single ? [single] : [];
  }
}

async function writeToStorage(drops: DeadDrop[]): Promise<DeadDrop[] | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { error } = await supabase.storage.from(BUCKET).upload(objectKey(drops[0].dateKey, drops[0].frequencyNumber), JSON.stringify(drops), {
    contentType: "application/json",
    upsert: true
  });

  return error ? null : drops;
}

async function readFromTable(dateKey: string, number: number): Promise<DeadDrop[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("signal_dead_drops")
    .select("id, body, created_at, expires_at, frequency_number, date_key, frequency_kind, frequency_label")
    .eq("date_key", dateKey)
    .eq("frequency_number", number)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id || generateId(),
    body: row.body,
    createdAt: new Date(row.created_at).getTime(),
    expiresAt: new Date(row.expires_at).getTime(),
    frequencyNumber: row.frequency_number,
    dateKey: row.date_key,
    frequencyKind: row.frequency_kind,
    frequencyLabel: row.frequency_label
  }));
}

async function writeToTable(drop: DeadDrop): Promise<DeadDrop | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("signal_dead_drops")
    .insert({
      id: drop.id,
      date_key: drop.dateKey,
      frequency_number: drop.frequencyNumber,
      body: drop.body,
      expires_at: new Date(drop.expiresAt).toISOString(),
      frequency_kind: drop.frequencyKind,
      frequency_label: drop.frequencyLabel
    })
    .select("id, body, created_at, expires_at, frequency_number, date_key, frequency_kind, frequency_label")
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    body: data.body,
    createdAt: new Date(data.created_at).getTime(),
    expiresAt: new Date(data.expires_at).getTime(),
    frequencyNumber: data.frequency_number,
    dateKey: data.date_key,
    frequencyKind: data.frequency_kind,
    frequencyLabel: data.frequency_label
  };
}

export async function fetchServerDeadDrops(dateKey: string, number: number): Promise<DeadDrop[]> {
  const fromTable = await readFromTable(dateKey, number);
  if (fromTable.length > 0) return fromTable;

  return readFromStorage(dateKey, number);
}

export async function leaveServerDeadDrop(
  dateKey: string, 
  number: number, 
  body: string,
  kind?: string,
  label?: string
): Promise<DeadDrop | null> {
  const trimmed = body.trim().slice(0, 160);
  if (!trimmed) return null;

  const drop: DeadDrop = {
    id: generateId(),
    body: trimmed,
    createdAt: Date.now(),
    expiresAt: Date.now() + 48 * 60 * 60 * 1000,
    frequencyNumber: number,
    dateKey,
    frequencyKind: kind as any,
    frequencyLabel: label
  };

  const saved = await writeToTable(drop);
  if (saved) return saved;

  const existing = await readFromStorage(dateKey, number);
  const updated = [drop, ...existing].slice(0, 20);
  await writeToStorage(updated);
  return drop;
}
