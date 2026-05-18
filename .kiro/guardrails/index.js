#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const PROJ = '/home/timothy/Project/Arch-Mk2';
const RULES_DIR = path.join(PROJ, '.kiro', 'guardrails', 'rules');
const CONFIG_FILE = path.join(PROJ, '.kiro', 'guardrails', 'config.json');

const RULE_ORDER = ['input', 'tool-use', 'output', 'budget'];

function readStdin() {
  return new Promise(resolve => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', c => { data += c; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(''));
  });
}

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); }
  catch { return { mode: 'default', rules: { input: { enabled: true }, 'tool-use': { enabled: true }, output: { enabled: true }, budget: { enabled: true } } }; }
}

function loadRules() {
  const rules = [];
  if (!fs.existsSync(RULES_DIR)) return rules;
  const files = fs.readdirSync(RULES_DIR).filter(f => f.endsWith('.js')).sort();
  for (const file of files) {
    try {
      const rule = require(path.join(RULES_DIR, file));
      if (rule && rule.name) rules.push(rule);
    } catch (err) {
      console.error(`[guardrails] Failed to load rule ${file}: ${err.message}`);
    }
  }
  return rules;
}

function getSessionId() {
  const raw = process.env.CLAUDE_SESSION_ID || String(process.ppid) || 'default';
  return raw.replace(/[^a-zA-Z0-9_-]/g, '') || 'default';
}

function logAudit(entry) {
  try {
    const dir = path.join(PROJ, 'ltm', 'store');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, 'guardrails.jsonl'), JSON.stringify({
      timestamp: new Date().toISOString(),
      session_id: getSessionId(),
      ...entry
    }) + '\n');
  } catch {}
}

async function main() {
  const raw = await readStdin();
  let input = {};
  try { input = JSON.parse(raw); } catch { input = {}; }

  const config = loadConfig();
  const rules = loadRules();
  const guardType = process.env.GUARD_TYPE || 'input';
  const results = [];

  for (const rule of rules) {
    if (rule.type !== guardType && rule.type !== '*') continue;
    try {
      const result = await rule.evaluate(input, config);
      results.push(result);
      if (result.action === 'block') {
        logAudit({ guard_type: guardType, rule: rule.name, action: 'block', reason: result.reason, input: sanitize(input) });
        console.error(`[guardrails] BLOCKED by ${rule.name}: ${result.reason}`);
        process.exit(2);
      }
      if (result.action === 'warn') {
        logAudit({ guard_type: guardType, rule: rule.name, action: 'warn', reason: result.reason, input: sanitize(input) });
        console.error(`[guardrails] WARN from ${rule.name}: ${result.reason}`);
      }
    } catch (err) {
      console.error(`[guardrails] Rule ${rule.name} error: ${err.message}`);
    }
  }

  process.exit(0);
}

function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const s = {};
  const secrets = [/password/i, /secret/i, /token/i, /key/i, /auth/i, /credential/i];
  for (const [k, v] of Object.entries(obj)) {
    s[k] = secrets.some(p => p.test(k)) ? '[REDACTED]' : v;
  }
  return s;
}

if (require.main === module) {
  main().catch(err => {
    console.error(`[guardrails] Fatal: ${err.message}`);
    process.exit(2);
  });
}

module.exports = { main, loadConfig, loadRules };
