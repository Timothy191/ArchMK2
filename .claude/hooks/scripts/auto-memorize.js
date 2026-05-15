#!/usr/bin/env node
/**
 * Auto-Memorize Hook
 *
 * Runs on PostToolUse for Write/Edit/Bash(git commit) events.
 * Captures significant changes to a local JSONL observation store
 * that the auto-recall hook can inject at session start.
 *
 * Captures: file changes, git commits, errors, pattern discoveries.
 * Skips: reads, searches, non-mutating operations.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const STORE_DIR = path.join(os.homedir(), ".claude", "observations");
const STORE_FILE = path.join(STORE_DIR, "auto-captures.jsonl");

function ensureStore() {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }
}

function append(entry) {
  ensureStore();
  fs.appendFileSync(STORE_FILE, JSON.stringify(entry) + "\n");
}

function categorize(toolName, toolInput, toolResponse) {
  // Determine what kind of event this is
  if (toolName === "Write") {
    return { type: "file_created", file: toolInput.file_path };
  }
  if (toolName === "Edit") {
    return { type: "file_edited", file: toolInput.file_path };
  }
  if (toolName === "Bash") {
    const cmd = toolInput.command || "";
    if (/\bgit\s+commit\b/.test(cmd)) {
      return { type: "git_commit", command: cmd.slice(0, 200) };
    }
    if (/\bgit\s+(push|merge|rebase|checkout)\b/.test(cmd)) {
      return { type: "git_operation", command: cmd.slice(0, 200) };
    }
    if (
      /\b(install|add|remove)\b.*\b(dependenc|package|npm|pnpm|yarn)\b/.test(
        cmd,
      )
    ) {
      return { type: "dependency_change", command: cmd.slice(0, 200) };
    }
    return null; // Skip non-significant bash commands
  }
  return null;
}

function extractKeyDetails(toolInput, toolResponse) {
  // Pull out the most useful context from the operation
  const details = {};

  if (toolInput.file_path) {
    const ext = path.extname(toolInput.file_path);
    details.ext = ext;

    // Categorize by file type
    if (/\.(tsx?|jsx?)$/.test(toolInput.file_path)) {
      details.domain = "frontend";
    } else if (/\.(sql|prisma)$/.test(toolInput.file_path)) {
      details.domain = "database";
    } else if (/\.(css|scss)$/.test(toolInput.file_path)) {
      details.domain = "styling";
    } else if (/\.md$/.test(toolInput.file_path)) {
      details.domain = "docs";
    } else if (
      /\.json$/.test(toolInput.file_path) &&
      toolInput.file_path.includes("package")
    ) {
      details.domain = "dependencies";
    }
  }

  if (toolInput.old_string && toolInput.new_string) {
    // For edits, capture what changed at a high level
    const oldLines = toolInput.old_string.split("\n").length;
    const newLines = toolInput.new_string.split("\n").length;
    details.change_size = Math.abs(newLines - oldLines);
    details.direction =
      newLines > oldLines
        ? "addition"
        : newLines < oldLines
          ? "removal"
          : "modification";
  }

  // Check for errors in response
  if (
    typeof toolResponse === "string" &&
    /\b(error|fail|warning)\b/i.test(toolResponse)
  ) {
    details.has_error = true;
  }

  return details;
}

async function main() {
  let data = "";
  process.stdin.on("data", (chunk) => {
    data += chunk;
  });

  process.stdin.on("end", () => {
    try {
      const input = JSON.parse(data);
      const toolName = input.tool_name || "";
      const toolInput = input.tool_input || {};
      const toolResponse = input.tool_response || "";

      // Only capture mutating operations
      const significantTools = ["Write", "Edit", "Bash"];
      if (!significantTools.includes(toolName)) {
        console.log(data); // Pass through unchanged
        return;
      }

      const category = categorize(toolName, toolInput, toolResponse);
      if (!category) {
        console.log(data);
        return;
      }

      const details = extractKeyDetails(toolInput, toolResponse);

      const entry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        timestamp: new Date().toISOString(),
        tool: toolName,
        category: category.type,
        details: { ...category, ...details },
        project: process.env.CLAUDE_PROJECT_DIR
          ? path.basename(process.env.CLAUDE_PROJECT_DIR)
          : null,
        session: process.env.CLAUDE_SESSION_ID || null,
      };

      append(entry);

      // Prune old entries (keep last 500)
      try {
        const lines = fs
          .readFileSync(STORE_FILE, "utf8")
          .split("\n")
          .filter(Boolean);
        if (lines.length > 500) {
          const kept = lines.slice(-500).join("\n") + "\n";
          fs.writeFileSync(STORE_FILE, kept);
        }
      } catch (_) {
        /* ignore prune errors */
      }
    } catch (err) {
      // Silently fail - never block the main workflow
      console.error(`[AutoMemorize] Error: ${err.message}`);
    }

    console.log(data); // Always pass through
  });
}

main().catch(() => process.exit(0));
