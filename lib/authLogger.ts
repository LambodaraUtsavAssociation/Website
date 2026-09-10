import fs from 'fs';
import path from 'path';
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

const AUDIT_LOG_FILE = path.join(process.cwd(), 'public', 'uploads', 'admin_audit_logs.json');

export async function logAdminAuthAttempt(
  entry: Omit<AuthLogEntry, 'id' | 'created_at'>
): Promise<AuthLogEntry> {
  const newLog: AuthLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...entry,
    created_at: new Date().toISOString(),
  };

  // 1. Log to persistent file audit log
  try {
    const dir = path.dirname(AUDIT_LOG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let logs: AuthLogEntry[] = [];
    if (fs.existsSync(AUDIT_LOG_FILE)) {
      const content = fs.readFileSync(AUDIT_LOG_FILE, 'utf8');
      logs = JSON.parse(content);
    }

    logs.unshift(newLog);
    // Keep last 1000 audit logs
    if (logs.length > 1000) logs = logs.slice(0, 1000);

    fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify(logs, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed writing local auth log:', err);
  }

  // 2. Insert into Supabase database table if present
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
  } catch {
    // Table may not exist yet in schema cache
  }

  return newLog;
}

export function getAdminAuthLogs(): AuthLogEntry[] {
  try {
    if (fs.existsSync(AUDIT_LOG_FILE)) {
      const content = fs.readFileSync(AUDIT_LOG_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch {
    // Fallback
  }
  return [];
}
