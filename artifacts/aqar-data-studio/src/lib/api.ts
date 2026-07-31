import { supabase } from "@/lib/supabase";

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);

  if (session?.access_token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  return fetch(input, { ...init, headers });
}

export async function readJsonResponse<T>(
  response: Response,
  fallbackMessage = "تعذر إكمال الطلب. حاول مرة أخرى.",
): Promise<T> {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const body = await response.text();
  let data: unknown;

  try {
    data = body ? JSON.parse(body) : {};
  } catch {
    throw new Error(fallbackMessage);
  }

  if (!response.ok) throw new Error(fallbackMessage);

  if (!contentType.includes("application/json") || typeof data !== "object" || data === null) {
    throw new Error(fallbackMessage);
  }

  return data as T;
}