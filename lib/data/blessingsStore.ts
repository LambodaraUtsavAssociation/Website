// In-memory blessings counter cache
const memoryBlessingsMap: Record<string, number> = {};

export function getBlessingCounts(): Record<string, number> {
  return { ...memoryBlessingsMap };
}

export function saveBlessingCounts(counts: Record<string, number>): void {
  Object.assign(memoryBlessingsMap, counts);
}

export function toggleBlessing(memoryId: string, action: 'bless' | 'unbless'): number {
  const current = memoryBlessingsMap[memoryId] || 0;
  const newCount = action === 'bless' ? current + 1 : Math.max(0, current - 1);
  memoryBlessingsMap[memoryId] = newCount;
  return newCount;
}
