export type PropertyReferenceInput = {
  id?: unknown;
  code?: unknown;
};

export function propertyReference(property: PropertyReferenceInput): string {
  const id = typeof property.id === "string" ? property.id.trim() : "";
  if (id) return id;

  const code = typeof property.code === "string" ? property.code.trim() : "";
  return code;
}

export function propertyPath(property: PropertyReferenceInput): string | null {
  const reference = propertyReference(property);
  return reference ? `/properties/${encodeURIComponent(reference)}` : null;
}

export function decodePropertyReference(value: unknown): string {
  if (typeof value !== "string") return "";
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
}