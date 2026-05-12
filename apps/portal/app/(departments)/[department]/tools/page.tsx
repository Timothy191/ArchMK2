import { DEPARTMENTS } from "~/lib/departments";
import { notFound } from 'next/navigation';
import { GlassCard } from '@repo/ui/GlassCard';

interface ToolConfig {
  name: string;
  url: string;
  description: string;
}

const TOOLS: ToolConfig[] = [
  {
    name: 'n8n',
    url: 'http://localhost:5678',
    description: 'Workflow automation and integration platform',
  },
  {
    name: 'Flowise',
    url: 'http://localhost:3001',
    description: 'LangChain flow builder for AI orchestration',
  },
];

export default async function ToolsPage({
  params,
}: {
  params: { department: string };
}) {
  const dept = DEPARTMENTS.find(d => d.name === params.department);
  if (!dept) notFound();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white">Tools</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TOOLS.map(tool => (
          <GlassCard key={tool.name} className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{tool.name}</h3>
                <p className="text-white/50 text-sm">{tool.description}</p>
              </div>
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 text-sm font-medium hover:bg-blue-600/30 transition-colors"
              >
                Open
              </a>
            </div>
            <div className="flex-1 min-h-[400px] rounded-lg border border-white/10 overflow-hidden bg-black/20">
              <iframe
                src={tool.url}
                title={tool.name}
                className="w-full h-full min-h-[400px]"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                loading="lazy"
              />
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
