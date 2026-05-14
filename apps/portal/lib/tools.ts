export interface ExternalTool {
  name: string;
  displayName: string;
  url: string;
  description: string;
  icon: string;
  color: string;
}

/**
 * External tool configurations.
 * Override URLs via environment variables:
 *   N8N_URL=http://localhost:5678
 *   FLOWISE_URL=http://localhost:3000
 */
export const EXTERNAL_TOOLS: ExternalTool[] = [
  {
    name: "n8n",
    displayName: "n8n",
    url: process.env.N8N_URL ?? "http://localhost:5678",
    description:
      "Workflow automation and integration platform — build no-code automations with 400+ integrations",
    icon: "Workflow",
    color: "#ff6d5a",
  },
  {
    name: "flowise",
    displayName: "Flowise",
    url: process.env.FLOWISE_URL ?? "http://localhost:3000",
    description:
      "Visual AI workflow builder — drag-and-drop LangChain agents and LLM pipelines",
    icon: "Bot",
    color: "#3ecf8e",
  },
];
