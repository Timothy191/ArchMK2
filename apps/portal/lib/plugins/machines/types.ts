import { ActorRefFrom } from "xstate";
import { ArchPlugin } from "../types";

// =============================================================================
// Plugin Machine Types
// =============================================================================

export interface PluginContext {
  pluginName: string;
  plugin?: ArchPlugin;
  error?: string;
  retryCount: number;
  maxRetries: number;
  lastLoadedAt?: number;
}

export type PluginEvent =
  | { type: "LOAD" }
  | { type: "RETRY" }
  | { type: "DISABLE" }
  | { type: "ENABLE" }
  | { type: "UNLOAD" }
  | { type: "plugin.loaded"; plugin: ArchPlugin }
  | { type: "plugin.failed"; error: string }
  | { type: "plugin.validated" }
  | { type: "plugin.invalid"; error: string };

export type PluginState =
  | { value: "idle"; context: PluginContext }
  | { value: "loading"; context: PluginContext }
  | { value: "validating"; context: PluginContext }
  | { value: "active"; context: PluginContext }
  | { value: "failed"; context: PluginContext }
  | { value: "retrying"; context: PluginContext }
  | { value: "disabled"; context: PluginContext };

// =============================================================================
// Orchestrator Machine Types
// =============================================================================

export interface OrchestratorContext {
  plugins: Map<string, ActorRefFrom<any>>;
  pluginConfigs: string[];
  isInitialized: boolean;
  healthReport: HealthReport;
}

export interface HealthReport {
  activeCount: number;
  failedCount: number;
  disabledCount: number;
  loadingCount: number;
  activePlugins: string[];
  failedPlugins: Array<{ name: string; error: string; at: string }>;
}

export type OrchestratorEvent =
  | { type: "INITIALIZE" }
  | { type: "LOAD_PLUGINS" }
  | { type: "RETRY_PLUGIN"; pluginName: string }
  | { type: "DISABLE_PLUGIN"; pluginName: string }
  | { type: "ENABLE_PLUGIN"; pluginName: string }
  | { type: "UNLOAD_ALL" }
  | { type: "HEALTH_CHECK" }
  | { type: "plugin.spawned"; name: string; ref: ActorRefFrom<any> }
  | { type: "plugin.stateChanged"; name: string; state: string }
  | { type: "system.error"; error: string };

export type OrchestratorState =
  | { value: "idle"; context: OrchestratorContext }
  | { value: "initializing"; context: OrchestratorContext }
  | { value: "loadingPlugins"; context: OrchestratorContext }
  | { value: "active"; context: OrchestratorContext }
  | { value: "error"; context: OrchestratorContext };

// =============================================================================
// Type Guards
// =============================================================================

export function isPluginLoadedEvent(event: PluginEvent): event is { type: "plugin.loaded"; plugin: ArchPlugin } {
  return event.type === "plugin.loaded";
}

export function isPluginFailedEvent(event: PluginEvent): event is { type: "plugin.failed"; error: string } {
  return event.type === "plugin.failed";
}

export function isRetryableError(error: string): boolean {
  const retryablePatterns = [
    "network",
    "timeout",
    "ECONNREFUSED",
    "ENOTFOUND",
    "rate limit",
    "temporarily unavailable",
  ];
  return retryablePatterns.some((pattern) => error.toLowerCase().includes(pattern));
}

// =============================================================================
// Actor Types
// =============================================================================

export type PluginActor = ActorRefFrom<any>;
export type OrchestratorActor = ActorRefFrom<any>;
