import { DeadDrop } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET = "signal-dead-drops";

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
      body: parsed.body,
      createdAt: parsed.createdAt,
      expiresAt: parsed.expiresAt,
      frequencyNumber: number,
      dateKey
    };
  } catch {
    return null;
  }
}

async function readFromStorage(dateKey: string, number: number): Promise<DeadDrop | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.storage.from(BUCKET).download(objectKey(dateKey, number));
  if (error || !data) {
    return null;
  }

  return parseDrop(await data.text(), dateKey, number);
}

async function writeToStorage(drop: DeadDrop): Promise<DeadDrop | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { error } = await supabase.storage.from(BUCKET).upload(objectKey(drop.dateKey, drop.frequencyNumber), JSON.stringify(drop), {
    contentType: "application/json",
    upsert: true
  });

  if (error) {
    return null;
  }

  return drop;
}

async function readFromTable(dateKey: string, number: number): Promise<DeadDrop | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("signal_dead_drops")
    .select("body, created_at, expires_at, frequency_number, date_key")
    .eq("date_key", dateKey)
    .eq("frequency_number", number)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    body: data.body,
    createdAt: new Date(data.created_at).getTime(),
    expiresAt: new Date(data.expires_at).getTime(),
    frequencyNumber: data.frequency_number,
    dateKey: data.date_key
  };
}

async function writeToTable(drop: DeadDrop): Promise<DeadDrop | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("signal_dead_drops")
    .insert({
      date_key: drop.dateKey,
      frequency_number: drop.frequencyNumber,
      body: drop.body,
      expires_at: new Date(drop.expiresAt).toISOString()
    })
    .select("body, created_at, expires_at, frequency_number, date_key")
    .single();

  if (error || !data) {
    return null;
  }

  return {
    body: data.body,
    createdAt: new Date(data.created_at).getTime(),
    expiresAt: new Date(data.expires_at).getTime(),
    frequencyNumber: data.frequency_number,
    dateKey: data.date_key
  };
}

export async function fetchServerDeadDrop(dateKey: string, number: number): Promise<DeadDrop | null> {
  const fromTable = await readFromTable(dateKey, number);
  if (fromTable) {
    return fromTable;
  }

  return readFromStorage(dateKey, number);
}

export async function leaveServerDeadDrop(dateKey: string, number: number, body: string): Promise<DeadDrop | null> {
  const trimmed = body.trim().slice(0, 140);
  if (!trimmed) {
    return null;
  }

  const drop: DeadDrop = {
    body: trimmed,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    frequencyNumber: number,
    dateKey
  };

  const fromTable = await writeToTable(drop);
  if (fromTable) {
    return fromTable;
  }

  return writeToStorage(drop);
}
