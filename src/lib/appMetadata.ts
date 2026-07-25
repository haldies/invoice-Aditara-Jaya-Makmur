export const APP_NAME = "Contoh Invoice";
export const APP_VERSION = "1.0.0";
export const APP_DESCRIPTION = "Sistem Internal Contoh Invoice";
export const SUPPORT_EMAIL = "support@contohinvoice.com";

export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  const markdownLink = trimmed.match(/^\[[^\]]+\]\((https?:\/\/[^)]+)\)$/);
  return (markdownLink?.[1] || trimmed).replace(/\/+$/, "");
}

export function getAppUrl(): string {
  return normalizeUrl(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  );
}

export function getMcpResourceUrl(): string {
  return normalizeUrl(
    process.env.MCP_RESOURCE_URL || `${getAppUrl()}/api/mcp`
  );
}

export function getSupabaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }
  return normalizeUrl(value);
}
