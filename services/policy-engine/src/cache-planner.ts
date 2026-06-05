import { ActionPayload } from './rules-engine';
import { TTLManager } from './ttl-manager';

export class CachePlanner {
  private ttlManager: TTLManager;

  constructor(ttlManager: TTLManager) {
    this.ttlManager = ttlManager;
  }

  async executeActions(actions: ActionPayload[]) {
    for (const action of actions) {
      switch (action.action) {
        case 'INCREASE_TTL':
          await this.ttlManager.increaseTTL(action.keyPattern, action.factor || 1.5);
          break;
        case 'PROMOTE':
          console.log(`[CachePlanner] Promoting ${action.keyPattern} to L1 priority`);
          break;
        case 'DEMOTE':
          console.log(`[CachePlanner] Demoting ${action.keyPattern} from L1`);
          break;
      }
    }
  }
}
