import { ArchPlugin } from "../../lib/plugins/types";

console.warn("BuggyPlugin: Simulating execution crash...");

// Deliberately throw an exception at loading/import time to test the sandboxed orchestrator
throw new Error("CRITICAL_SYNTAX_COMPILATION_ERROR: Failed to allocate hardware heaps on sandbox plugin core.");

const buggyPlugin: ArchPlugin = {
  metadata: {
    id: "buggy-plugin",
    name: "Broken Industrial Adapter",
    version: "0.0.1-alpha",
    description: "Simulates buggy third-party codes to verify high-availability sandbox protections.",
    author: "Third-party Malfunctional Ltd.",
    enabled: true,
  },
  engine: {
    execute: async () => {
      throw new Error("Core execution overflow exception.");
    }
  }
};

export default buggyPlugin;
