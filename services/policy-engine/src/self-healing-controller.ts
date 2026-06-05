import { RepairEngine } from '@repo/cache-self-healing/src/repair-engine';
import { WarmupEngine } from '@repo/cache-self-healing/src/warmup-engine';

export class SelfHealingController {
  private repairEngine: RepairEngine;
  private warmupEngine: WarmupEngine;

  constructor() {
    this.repairEngine = new RepairEngine();
    this.warmupEngine = new WarmupEngine();
  }

  async handleAlert(alert: any) {
    console.log(`[SelfHealingController] Received alert: ${alert.name}`);
    if (alert.name === 'HighMissRateSpike') {
      await this.warmupEngine.replayCriticalKeys(['auth:session:vital']);
    } else if (alert.name === 'ShardCorruptionDetected') {
      await this.repairEngine.rebuildShard(alert.shardId);
      await this.repairEngine.flushCorruptedTags(['tenant:corrupt']);
    }
  }
}
