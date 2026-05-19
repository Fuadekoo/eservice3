let hasStarted = false;

export function startAuditCleanupScheduler(): void {
  if (hasStarted) {
    return;
  }

  hasStarted = true;
}
