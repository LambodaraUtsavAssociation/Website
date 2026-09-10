function getNodeFs() {
  if (typeof window !== 'undefined') return null;
  try {
    return eval('require')('fs');
  } catch {
    return null;
  }
}

function getNodePath() {
  if (typeof window !== 'undefined') return null;
  try {
    return eval('require')('path');
  } catch {
    return null;
  }
}

function getBlessingsFilePath(): string | null {
  const path = getNodePath();
  if (!path) return null;
  return path.join(process.cwd(), 'public', 'uploads', 'blessings.json');
}

export function getBlessingCounts(): Record<string, number> {
  const fs = getNodeFs();
  const filePath = getBlessingsFilePath();
  if (!fs || !filePath) return {};

  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading blessings.json:', err);
  }
  return {};
}

export function saveBlessingCounts(counts: Record<string, number>): void {
  const fs = getNodeFs();
  const path = getNodePath();
  const filePath = getBlessingsFilePath();
  if (!fs || !path || !filePath) return;

  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(counts, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving blessings.json:', err);
  }
}

export function toggleBlessing(memoryId: string, action: 'bless' | 'unbless'): number {
  const counts = getBlessingCounts();
  const current = counts[memoryId] || 0;

  if (action === 'bless') {
    counts[memoryId] = current + 1;
  } else {
    counts[memoryId] = Math.max(0, current - 1);
  }

  saveBlessingCounts(counts);
  return counts[memoryId];
}
