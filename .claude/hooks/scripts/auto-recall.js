#!/usr/bin/env node
/**
 * Auto-Recall Hook
 *
 * Runs on SessionStart. Loads recent observations from the auto-capture store
 * and relevant claude-mem context, then injects them as context into the session.
 *
 * Outputs structured context that Claude Code picks up as session context.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const STORE_DIR = path.join(os.homedir(), ".claude", "observations");
const STORE_FILE = path.join(STORE_DIR, "auto-captures.jsonl");
const MEMORY_DIR = path.join(
  os.homedir(),
  ".claude",
  "projects",
  "-home-timothy-Project-Arch-Mk2",
  "memory",
);
const MEMORY_INDEX = path.join(MEMORY_DIR, "MEMORY.md");

function findProjectRoot() {
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, ".git"))) return dir;
    dir = path.dirname(dir);
  }
  return process.cwd();
}

function loadRecentObservations(maxAge = 7 * 24 * 60 * 60 * 1000, limit = 20) {
  if (!fs.existsSync(STORE_FILE)) return [];

  try {
    const lines = fs
      .readFileSync(STORE_FILE, "utf8")
      .split("\n")
      .filter(Boolean);

    const now = Date.now();
    const recent = [];

    for (let i = lines.length - 1; i >= 0 && recent.length < limit; i--) {
      try {
        const entry = JSON.parse(lines[i]);
        const age = now - new Date(entry.timestamp).getTime();
        if (age <= maxAge) {
          recent.push(entry);
        }
      } catch (_) {
        /* skip malformed */
      }
    }

    return recent;
  } catch (_) {
    return [];
  }
}

function categorizeObservations(observations) {
  const categories = {
    files_created: [],
    files_edited: [],
    commits: [],
    errors: [],
    dependencies: [],
    other: [],
  };

  for (const obs of observations) {
    switch (obs.category) {
      case "file_created":
        categories.files_created.push(obs);
        break;
      case "file_edited":
        categories.files_edited.push(obs);
        break;
      case "git_commit":
        categories.commits.push(obs);
        break;
      case "dependency_change":
        categories.dependencies.push(obs);
        break;
      default:
        if (obs.details?.has_error) categories.errors.push(obs);
        else categories.other.push(obs);
    }
  }

  return categories;
}

function formatContext(categories, project) {
  const parts = [];

  // Recent file changes
  const recentEdits = categories.files_edited.slice(0, 8);
  const recentCreates = categories.files_created.slice(0, 5);

  if (recentCreates.length > 0) {
    const files = recentCreates
      .map((e) => `  - ${path.relative(project || "/", e.details.file || "?")}`)
      .join("\n");
    parts.push(`Recently created files:\n${files}`);
  }

  if (recentEdits.length > 0) {
    // Deduplicate by file, keeping most recent
    const byFile = new Map();
    for (const e of recentEdits) {
      const f = e.details.file || "?";
      if (!byFile.has(f)) byFile.set(f, e);
    }
    const files = [...byFile.keys()]
      .slice(0, 8)
      .map((f) => {
        const e = byFile.get(f);
        const rel = path.relative(project || "/", f);
        const dir = e.details.domain || "general";
        const change = e.details.direction || "changed";
        return `  - ${rel} (${dir}, ${change})`;
      })
      .join("\n");
    parts.push(`Recently edited files:\n${files}`);
  }

  if (categories.commits.length > 0) {
    const commits = categories.commits
      .slice(0, 3)
      .map(
        (e) =>
          `  - ${e.details.command?.replace(/\n/g, " ").slice(0, 100) || "commit"}`,
      )
      .join("\n");
    parts.push(`Recent git activity:\n${commits}`);
  }

  if (categories.errors.length > 0) {
    const errs = categories.errors
      .slice(0, 3)
      .map(
        (e) =>
          `  - ${path.relative(project || "/", e.details.file || "?")} (error)`,
      )
      .join("\n");
    parts.push(`Recent errors:\n${errs}`);
  }

  if (categories.dependencies.length > 0) {
    const deps = categories.dependencies
      .map((e) => `  - ${e.details.command?.slice(0, 80) || "dep change"}`)
      .join("\n");
    parts.push(`Dependency changes:\n${deps}`);
  }

  return parts.length > 0 ? parts.join("\n\n") : null;
}

function loadMemoryIndex() {
  if (!fs.existsSync(MEMORY_INDEX)) return null;
  try {
    return fs.readFileSync(MEMORY_INDEX, "utf8");
  } catch (_) {
    return null;
  }
}

async function main() {
  const projectRoot = findProjectRoot();
  const projectName = path.basename(projectRoot);

  const observations = loadRecentObservations();
  const categories = categorizeObservations(observations);
  const obsContext = formatContext(categories, projectRoot);

  const output = [];

  if (obsContext) {
    output.push(`[AutoRecall] Recent activity context for ${projectName}:`);
    output.push(obsContext);
    output.push("");
    output.push(
      `[AutoRecall] ${observations.length} observations loaded. Use these to maintain continuity across sessions.`,
    );
  } else {
    output.push(
      `[AutoRecall] No recent observations found. Starting fresh for ${projectName}.`,
    );
  }

  // Load memory index hint
  const memIndex = loadMemoryIndex();
  if (memIndex) {
    const lines = memIndex.split("\n").filter((l) => l.startsWith("- ["));
    if (lines.length > 0) {
      output.push("");
      output.push(
        `[AutoRecall] ${lines.length} memory entries available. Key memories:`,
      );
      output.push(lines.slice(0, 5).join("\n"));
    }
  }

  console.error(output.join("\n"));
  process.exit(0);
}

main().catch(() => process.exit(0));
