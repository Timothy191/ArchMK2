"use client";

import { useState } from "react";
import { GlassCard } from "@repo/ui/GlassCard";
import { PrecisionInput } from "@/components/ui/PrecisionInput";
import { Activity, RotateCcw } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";

export function MachineControl() {
  const [rpm, setRpm] = useState<number | null>(1250);
  const [power, setPower] = useState<number | null>(85);
  const [pressure, setPressure] = useState<number | null>(420);

  return (
    <GlassCard className="mt-8">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-[#3ecf8e]" />
        <h3 className="text-[var(--text-heading)] font-medium">Live Operational Controls</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <PrecisionInput
            label="Target Rotation Speed"
            suffix="RPM"
            value={rpm}
            onChange={(_, val) => setRpm(val)}
            min={0}
            max={5000}
            step={50}
          />
          <p className="text-[10px] text-[#4a4a4a] leading-tight">
            Safety limit: 4,800 RPM. Overdrive requires authorization.
          </p>
        </div>

        <div className="space-y-4">
          <PrecisionInput
            label="Power Allocation"
            suffix="%"
            value={power}
            onChange={(_, val) => setPower(val)}
            min={0}
            max={100}
            step={1}
          />
          <p className="text-[10px] text-[#4a4a4a] leading-tight">
            Current site load: 68%. Grid stable.
          </p>
        </div>

        <div className="space-y-4">
          <PrecisionInput
            label="Hydraulic Pressure"
            suffix="PSI"
            value={pressure}
            onChange={(_, val) => setPressure(val)}
            min={0}
            max={1000}
            step={5}
          />
          <p className="text-[10px] text-[#4a4a4a] leading-tight">
            Optimal range: 380 - 450 PSI. Check seals if below 300.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-[var(--border-emphasis)]">
        <Button variant="outline" className="border-[var(--border-emphasis)] text-[var(--text-secondary)] hover:text-[var(--text-heading)]">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset Defaults
        </Button>
        <Button className="bg-[#3ecf8e] text-[var(--text-heading)] hover:bg-[#35b87d] font-medium">
          Apply Configuration
        </Button>
      </div>
    </GlassCard>
  );
}
