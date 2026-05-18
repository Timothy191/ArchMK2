const fs = require('fs');
const path = require('path');

const PROJ = '/home/timothy/Project/Arch-Mk2';
const LOOP_FILE = path.join(PROJ, '.kiro', 'guardrails', 'loop-detector.json');

function getSessionId() {
  const raw = process.env.CLAUDE_SESSION_ID || String(process.ppid) || 'default';
  return raw.replace(/[^a-zA-Z0-9_-]/g, '') || 'default';
}

function loadState() {
  try {
    if (fs.existsSync(LOOP_FILE)) return JSON.parse(fs.readFileSync(LOOP_FILE, 'utf8'));
  } catch {}
  return {};
}

function saveState(data) {
  try {
    const dir = path.dirname(LOOP_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOOP_FILE, JSON.stringify(data, null, 2));
  } catch {}
}

module.exports = {
  name: 'infinite-loop-detector',
  type: '*',
  async evaluate(input, config) {
    const sessionId = getSessionId();
    const tool = (input.tool || input.tool_name || '').toString();
    const state = loadState();

    if (!state[sessionId]) {
      state[sessionId] = { recent_tools: [], identical_count: 0, last_tool: null, same_tool_count: 0 };
    }

    const session = state[sessionId];
    const now = Date.now();

    session.recent_tools.push({ tool, time: now });
    if (session.recent_tools.length > 20) session.recent_tools.shift();

    if (tool === session.last_tool) {
      session.same_tool_count++;
    } else {
      session.same_tool_count = 0;
    }
    session.last_tool = tool;

    if (session.same_tool_count >= 15) {
      saveState(state);
      return { action: 'block', reason: `Infinite loop detected: same tool "${tool}" called ${session.same_tool_count} times consecutively`, rule: 'infinite-loop-detector' };
    }

    const recent = session.recent_tools.filter(t => now - t.time < 30000);
    if (recent.length >= 18) {
      saveState(state);
      return { action: 'warn', reason: `High tool call rate: ${recent.length} calls in 30s`, rule: 'infinite-loop-detector' };
    }

    saveState(state);
    return { action: 'allow', rule: 'infinite-loop-detector' };
  }
};
