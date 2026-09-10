import { createAdminSupabaseClient } from './supabase/admin';

export interface AuthLogEntry {
  id: string;
  email: string;
  ip_address: string;
  user_agent: string;
  status: 'success' | 'failed';
  failure_reason?: string | null;
  created_at: string;
}

// In-memory buffer for recent runtime logs (fallback if DB query fails)
const recentLogsBuffer: AuthLogEntry[] = [];

export async function logAdminAuthAttempt(
  entry: Omit<AuthLogEntry, 'id' | 'created_at'>
): Promise<AuthLogEntry> {
  const newLog: AuthLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...entry,
    created_at: new Date().toISOString(),
  };

  // Keep recent in-memory log entries (max 50)
  recentLogsBuffer.unshift(newLog);
  if (recentLogsBuffer.length > 50) recentLogsBuffer.pop();

  // Insert into secure Supabase database table (protected by RLS)
  try {
    const supabase = createAdminSupabaseClient();
    if (supabase) {
      await supabase.from('admin_login_logs').insert([
        {
          email: newLog.email,
          ip_address: newLog.ip_address,
          user_agent: newLog.user_agent,
          status: newLog.status,
          failure_reason: newLog.failure_reason || null,
          created_at: newLog.created_at,
        },
      ]);
    }
  } catch (err) {
    console.warn('Supabase admin_login_logs insert warning:', err);
  }

  return newLog;
}

export async function getAdminAuthLogs(): Promise<AuthLogEntry[]> {
  try {
    const supabase = createAdminSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('admin_login_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        return data as AuthLogEntry[];
      }
    }
  } catch (err) {
    console.warn('Failed to query admin_login_logs from DB:', err);
  }

  return recentLogsBuffer;
}
