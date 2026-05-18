#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PROJ = '/home/timothy/Project/Arch-Mk2';
const SHADOW_FILE = path.join(PROJ, '.kiro', 'deploy', 'shadow-state.json');
const TRACE_LOG = path.join(PROJ, 'ltm', 'store', 'traces.jsonl');
const AUDIT_LOG = path.join(PROJ, 'ltm', 'store', 'audit.jsonl');
const GUARD_LOG = path.join(PROJ, 'ltm', 'store', 'guardrails.jsonl');

function loadShadowState() {
  try {
    if (fs.existsSync(SHADOW_FILE)) return JSON.parse(fs.readFileSync(SHADOW_FILE, 'utf8'));
  } catch {}
  return { enabled: false, started_at: null, counts: { total_calls: 0, blocked: 0, warnings: 0 }, by_tool: {} };
}

function saveShadowState(state) {
  try {
    const dir = path.dirname(SHADOW_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SHADOW_FILE, JSON.stringify(state, null, 2));
  } catch {}
}

function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx > 0) {
        args[arg.slice(2, eqIdx)] = arg.slice(eqIdx + 1);
      } else {
        args[arg.slice(2)] = process.argv[++i] || true;
      }
    }
  }
  return args;
}

async function startShadow() {
  const state = loadShadowState();
  state.enabled = true;
  state.started_at = new Date().toISOString();
  state.counts = { total_calls: 0, blocked: 0, warnings: 0 };
  state.by_tool = {};
  saveShadowState(state);
  console.log(JSON.stringify({ status: 'ok', message: 'Shadow mode enabled', started_at: state.started_at }));
}

async function stopShadow() {
  const state = loadShadowState();
  state.enabled = false;
  saveShadowState(state);
  const elapsed = state.started_at ? Math.floor((Date.now() - new Date(state.started_at).getTime()) / 1000) : 0;
  console.log(JSON.stringify({ status: 'ok', message: 'Shadow mode disabled', duration_seconds: elapsed, counts: state.counts }));
}

async function statusShadow() {
  const state = loadShadowState();
  const elapsed = state.started_at ? Math.floor((Date.now() - new Date(state.started_at).getTime()) / 1000) : 0;
  const stats = analyzeShadow();
  console.log(JSON.stringify({
    enabled: state.enabled,
    started_at: state.started_at,
    duration_seconds: elapsed,
    counts: state.counts,
    by_tool: state.by_tool,
    analysis: stats
  }));
}

function analyzeShadow() {
  const result = { guardrail_efficiency: {}, safety_block_rate: 0, tool_distribution: {} };
  try {
    const auditLines = fs.existsSync(AUDIT_LOG) ? fs.readFileSync(AUDIT_LOG, 'utf8').trim().split('\n').filter(Boolean).slice(-200) : [];
    const guardLines = fs.existsSync(GUARD_LOG) ? fs.readFileSync(GUARD_LOG, 'utf8').trim().split('\n').filter(Boolean).slice(-200) : [];
    const traceLines = fs.existsSync(TRACE_LOG) ? fs.readFileSync(TRACE_LOG, 'utf8').trim().split('\n').filter(Boolean).slice(-200) : [];

    const blocks = auditLines.filter(l => l.includes('"severity":"block"')).length;
    const totalAudit = auditLines.length;
    result.safety_block_rate = totalAudit > 0 ? blocks / totalAudit : 0;

    result.guardrail_efficiency = {
      total_evaluations: guardLines.length,
      blocks: guardLines.filter(l => l.includes('"action":"block"')).length,
      warns: guardLines.filter(l => l.includes('"action":"warn"')).length
    };

    const toolCounts = {};
    for (const line of traceLines) {
      try {
        const t = JSON.parse(line);
        const tool = t.tool || 'unknown';
        toolCounts[tool] = (toolCounts[tool] || 0) + 1;
      } catch {}
    }
    result.tool_distribution = toolCounts;
  } catch {}
  return result;
}

const cmd = process.argv[2] || 'status';
switch (cmd) {
  case 'start': startShadow().then(() => process.exit(0)).catch(() => process.exit(1)); break;
  case 'stop': stopShadow().then(() => process.exit(0)).catch(() => process.exit(1)); break;
  case 'status': statusShadow().then(() => process.exit(0)).catch(() => process.exit(1)); break;
  default:
    console.log('Usage: shadow start|stop|status');
    process.exit(1);
}
