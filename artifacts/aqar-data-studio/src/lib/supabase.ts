import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase env vars not set — storage upload will not work.");
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");

/**
 * Upload a file to Supabase Storage and return its public URL.
 * Bucket: property-images (must exist and be public in your Supabase project)
 */
export async function uploadPropertyImage(
  propertyId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${propertyId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("property-images")
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("property-images").getPublicUrl(path);
  return data.publicUrl;
}
