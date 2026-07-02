import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY, PHOTO_BUCKET } from "./config.js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function fetchEvents() {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createEvent(event) {
  const { data, error } = await supabase
    .from("events")
    .insert(event)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeEvent(id) {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function fetchPhotos() {
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function uploadPhoto({ file, date, caption }) {
  const safeName = file.name.replaceAll(" ", "_").replace(/[^a-zA-Z0-9._-]/g, "");
  const path = `${date}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;

  const { error: uploadError } = await supabase
    .storage
    .from(PHOTO_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase
    .storage
    .from(PHOTO_BUCKET)
    .getPublicUrl(path);

  const imageUrl = publicUrlData.publicUrl;

  const { data, error } = await supabase
    .from("photos")
    .insert({
      date,
      caption,
      image_url: imageUrl
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removePhoto(photo) {
  const { error } = await supabase
    .from("photos")
    .delete()
    .eq("id", photo.id);

  if (error) throw error;
}

export function subscribeToChanges(callback) {
  const channel = supabase
    .channel("ourdays-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "events" }, callback)
    .on("postgres_changes", { event: "*", schema: "public", table: "photos" }, callback)
    .subscribe();

  return channel;
}
