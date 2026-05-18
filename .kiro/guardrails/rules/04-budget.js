const fs = require('fs');
const path = require('path');

const PROJ = '/home/timothy/Project/Arch-Mk2';
const BUDGET_FILE = path.join(PROJ, '.kiro', 'guardrails', 'session-budget.json');

function getSessionId() {
  const raw = process.env.CLAUDE_SESSION_ID || String(process.ppid) || 'default';
  return raw.replace(/[^a-zA-Z0-9_-]/g, '') || 'default';
}

function loadBudget() {
  try {
    if (fs.existsSync(BUDGET_FILE)) return JSON.parse(fs.readFileSync(BUDGET_FILE, 'utf8'));
  } catch {}
  return {};
}

function saveBudget(data) {
  try {
    const dir = path.dirname(BUDGET_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(BUDGET_FILE, JSON.stringify(data, null, 2));
  } catch {}
}

module.exports = {
  name: 'budget-controller',
  type: '*',
  async evaluate(input, config) {
    const sessionId = getSessionId();
    const budget = loadBudget();
    const ruleConfig = config.rules?.budget || {};
    if (!ruleConfig.enabled) return { action: 'allow', rule: 'budget-controller' };

    if (!budget[sessionId]) {
      budget[sessionId] = { tokens: 0, tool_calls: 0, subagents: 0, blocked_at: null };
    }

    const session = budget[sessionId];

    if (session.blocked_at) {
      const cooldown = ruleConfig.cooldown_after_block_seconds || 60;
      const elapsed = (Date.now() - session.blocked_at) / 1000;
      if (elapsed < cooldown) {
        return { action: 'block', reason: `Session in cooldown (${Math.ceil(cooldown - elapsed)}s remaining)`, rule: 'budget-controller' };
      }
      session.blocked_at = null;
    }

    if (ruleConfig.max_tokens_per_session && session.tokens > ruleConfig.max_tokens_per_session) {
      session.blocked_at = Date.now();
      saveBudget(budget);
      return { action: 'block', reason: `Token budget exceeded (${session.tokens}/${ruleConfig.max_tokens_per_session})`, rule: 'budget-controller' };
    }

    if (ruleConfig.max_tool_calls_per_session && session.tool_calls > ruleConfig.max_tool_calls_per_session) {
      session.blocked_at = Date.now();
      saveBudget(budget);
      return { action: 'block', reason: `Tool call budget exceeded (${session.tool_calls}/${ruleConfig.max_tool_calls_per_session})`, rule: 'budget-controller' };
    }

    if (input.tool) session.tool_calls++;
    if (ruleConfig.estimate_tokens) {
      const inputStr = JSON.stringify(input);
      session.tokens += Math.ceil(inputStr.length / 4);
    }

    saveBudget(budget);
    return { action: 'allow', rule: 'budget-controller' };
  }
};
