import React from "react";
import { ArchPlugin } from "../../lib/plugins/types";

// Dynamic Client-side visual card for the dashboard
function PredictiveMaintenanceWidget({ departmentId }: { departmentId: string }) {
  // Mock live telemetry calculation inside the component
  const highRiskMachine = {
    name: "Excavator EXC-094",
    type: "CAT 6060",
    hoursWorked: 248,
    failureProbability: 92.4,
    impact: "Critical",
  };

  return (
    <div className="relative group overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-[#170a0d] to-[#0a0607] p-5 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-red-500/30">
      {/* Visual Ambient Glow */}
      <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-red-500/10 blur-2xl transition-all duration-500 group-hover:bg-red-500/15" />

      <div className="flex items-center justify-between border-b border-red-500/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
          </span>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-red-400">Predictive Alert Engine</h4>
        </div>
        <span className="rounded bg-red-500/15 px-2 py-0.5 text-[9px] font-medium uppercase text-red-400 border border-red-500/20">
          Critical Risk
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] text-[#898989] uppercase tracking-wider">Asset Affected</p>
            <p className="text-sm font-semibold text-[#fafafa] mt-0.5">{highRiskMachine.name}</p>
            <p className="text-[10px] text-[#898989]">{highRiskMachine.type}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#898989] uppercase tracking-wider">Fail Probability</p>
            <p className="text-lg font-bold text-red-500 mt-0.5">{highRiskMachine.failureProbability}%</p>
          </div>
        </div>

        <div className="w-full bg-[#1c1c1c] h-1.5 rounded-full overflow-hidden border border-[#242424]">
          <div 
            className="bg-gradient-to-r from-red-600 to-red-400 h-full rounded-full transition-all duration-500 w-[92%]" 
          />
        </div>

        <p className="text-[11px] text-[#898989] italic mt-2 border-t border-[#1c1c1c] pt-2">
          Recommendation: Trigger immediate L2 servicing before structural seal blowout.
        </p>
      </div>
    </div>
  );
}

const predictiveMaintenancePlugin: ArchPlugin = {
  metadata: {
    id: "predictive-maintenance",
    name: "Predictive Maintenance Engine",
    version: "1.2.0",
    description: "Calculates machinery failure probabilities and highlights critical assets in dashboards.",
    author: "Arch Core AI Group",
    enabled: true,
  },
  engine: {
    execute: async (params?: Record<string, any>) => {
      const hoursWorked = params?.hoursWorked || 0;
      const threshold = 200;
      
      // Basic probability distribution model
      const failureProbability = hoursWorked > threshold 
        ? Math.min(99.9, parseFloat((50 + (hoursWorked - threshold) * 0.5).toFixed(1)))
        : parseFloat((hoursWorked * 0.25).toFixed(1));

      return {
        failureProbability,
        critical: failureProbability > 75,
        servicingIntervalHours: Math.max(0, 300 - hoursWorked),
      };
    }
  },
  hooks: {
    onBreakdownAdded: async (breakdown: any) => {
      console.log(`[Plugin: Predictive Maintenance] Logged breakdown audit event for machine: ${breakdown.machine_id}`);
    }
  },
  widgets: [
    {
      id: "predictive-alert-card",
      gridSpan: "col-span-1",
      component: PredictiveMaintenanceWidget,
    }
  ],
  workflow: {
    canBuildWorkflow: true,
    defaultNode: {
      type: "plugin",
      data: {
        label: "Predictive Maintenance",
        pluginId: "predictive-maintenance",
        config: {
          hoursWorked: 0,
          threshold: 200,
        },
      },
    },
  },
};

export default predictiveMaintenancePlugin;
