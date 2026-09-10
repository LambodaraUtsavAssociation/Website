import { NextRequest } from 'next/server';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  targetEntity: string;
  entityId?: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  details?: Record<string, any>;
  correlationId: string;
}

// In-Memory Enterprise Telemetry Buffer & Audit Trail Store
const auditLogStore: AuditLogEntry[] = [];
const MAX_LOG_CAPACITY = 1000;

export function logAuditEvent({
  action,
  targetEntity,
  entityId,
  userId = 'admin@LambodaraUtsavAssociation.org',
  request,
  details,
}: {
  action: string;
  targetEntity: string;
  entityId?: string;
  userId?: string;
  request?: NextRequest | Request;
  details?: Record<string, any>;
}): AuditLogEntry {
  const correlationId = `corr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  let ipAddress = '127.0.0.1';
  let userAgent = 'Enterprise-Admin-Portal';

  if (request) {
    if ('headers' in request) {
      ipAddress =
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
      userAgent = request.headers.get('user-agent') || 'Enterprise-Admin-Portal';
    }
  }

  const logEntry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    action,
    targetEntity,
    entityId,
    userId,
    ipAddress,
    userAgent,
    details,
    correlationId,
  };

  auditLogStore.unshift(logEntry);
  if (auditLogStore.length > MAX_LOG_CAPACITY) {
    auditLogStore.pop();
  }

  // Structured Enterprise Console Telemetry
  console.log(
    `[AUDIT-LOG] [${logEntry.timestamp}] [${action}] Entity: ${targetEntity} | ID: ${entityId || 'N/A'} | Correlation: ${correlationId}`
  );

  return logEntry;
}

export function getAuditLogs(limit: number = 50): AuditLogEntry[] {
  return auditLogStore.slice(0, limit);
}
