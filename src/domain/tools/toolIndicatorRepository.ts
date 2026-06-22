export type ToolIndicatorStatus = 'required_not_active' | 'in_use' | 'controlled_error' | 'active' | 'success' | 'blocked';

interface ToolIndicatorRecord {
  entiId: string;
  toolId: string;
  status: ToolIndicatorStatus;
}

class ToolIndicatorStore {
  private records: ToolIndicatorRecord[] = [];
  private listeners: Set<() => void> = new Set();

  setIndicator(entiId: string, toolId: string, status: ToolIndicatorStatus) {
    const existing = this.records.find(r => r.entiId === entiId && r.toolId === toolId);
    if (existing) {
      existing.status = status;
    } else {
      this.records.push({ entiId, toolId, status });
    }
    this.notify();
  }

  clearIndicator(entiId: string, toolId: string) {
    this.records = this.records.filter(r => !(r.entiId === entiId && r.toolId === toolId));
    this.notify();
  }

  getIndicator(entiId: string, toolId: string): ToolIndicatorStatus | undefined {
    return this.records.find(r => r.entiId === entiId && r.toolId === toolId)?.status;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l());
  }
}

export const toolIndicatorRepository = new ToolIndicatorStore();
