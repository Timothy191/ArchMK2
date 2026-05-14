import { SatelliteMonitoringDashboard } from "@/features/departments/components/satellite/SatelliteMonitoringDashboard";
import { notFound } from "next/navigation";

const VALID_TABS = ["sar", "hyperspectral", "highres"] as const;

export default function SatelliteTabPage({
  params,
}: {
  params: { satelliteTab: string };
}) {
  const tab = params.satelliteTab;
  if (!VALID_TABS.includes(tab as (typeof VALID_TABS)[number])) {
    notFound();
  }
  return (
    <SatelliteMonitoringDashboard
      defaultTab={tab as (typeof VALID_TABS)[number]}
    />
  );
}
