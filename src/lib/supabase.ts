import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export const supabase = createSupabaseClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-15630662`;

// API helper with auth token
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  } else {
    headers['Authorization'] = `Bearer ${publicAnonKey}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}
