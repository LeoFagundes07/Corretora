// Shared public queries: site settings, lead session (unlock state) and lead creation.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "./api";
import type { LeadCreatedResponse, LeadSession, SiteSettings } from "./types";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => apiGet<SiteSettings>("/settings"),
    staleTime: 60_000,
    retry: false,
  });
}

export function useLeadSession() {
  return useQuery({
    queryKey: ["lead-session"],
    queryFn: () => apiGet<LeadSession>("/leads/session"),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export interface LeadFormPayload {
  name: string;
  whatsapp: string;
  email: string;
  intent: string;
  message: string;
  marketing_optin: boolean;
  accept_privacy: boolean;
  property_id?: string | null;
  hp?: string;
  utm?: Record<string, string>;
}

/** UTM params from the URL (kept for the whole session so any page can attribute). */
export function collectUtm(): Record<string, string> {
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  let fromUrl: Record<string, string> = {};
  const params = new URLSearchParams(window.location.search);
  for (const k of keys) {
    const v = params.get(k);
    if (v) fromUrl[k] = v;
  }
  try {
    if (Object.keys(fromUrl).length > 0) {
      sessionStorage.setItem("ac_utm", JSON.stringify(fromUrl));
    } else {
      const stored: unknown = JSON.parse(sessionStorage.getItem("ac_utm") || "{}");
      if (stored && typeof stored === "object") fromUrl = stored as Record<string, string>;
    }
  } catch {
    // storage unavailable — proceed with URL values only
  }
  return fromUrl;
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LeadFormPayload) => apiPost<LeadCreatedResponse>("/leads", payload),
    onSuccess: () => {
      // unlock is authoritative server-side (cookie); refresh session + gated content
      qc.invalidateQueries({ queryKey: ["lead-session"] });
      qc.invalidateQueries({ queryKey: ["property"] });
    },
  });
}

export function useRecordEvent() {
  return useMutation({
    mutationFn: (payload: { type: "whatsapp_click" | "share" | "property_view" | "call_click"; property_id?: string | null; meta?: Record<string, string> }) =>
      apiPost<null>("/events", payload),
  });
}
