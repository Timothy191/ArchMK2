import { HotspotReport } from '@repo/shared';

export interface ActionPayload {
  action: 'INCREASE_TTL' | 'PROMOTE' | 'DEMOTE';
  keyPattern: string;
  factor?: number;
}

export interface Rule {
  id: string;
  condition: (report: HotspotReport) => boolean;
  actions: ActionPayload[];
}

export class RulesEngine {
  private rules: Rule[] = [];

  addRule(rule: Rule) {
    this.rules.push(rule);
  }

  evaluate(report: HotspotReport): ActionPayload[] {
    const firedActions: ActionPayload[] = [];
    
    for (const rule of this.rules) {
      if (rule.condition(report)) {
        console.log(`Rule [${rule.id}] fired for pattern: ${report.pattern}`);
        firedActions.push(...rule.actions);
      }
    }
    
    return firedActions;
  }
}
