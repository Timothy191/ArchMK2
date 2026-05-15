import { SatelliteMonitoringDashboard } from "@/features/departments/components/satellite/SatelliteMonitoringDashboard";
import { notFound } from "next/navigation";

const VALID_TABS = ["sar", "hyperspectral", "highres"] as const;

export default async function SatelliteTabPage({
  params,
}: {
  params: Promise<{ satelliteTab: string }>;
}) {
  const { satelliteTab } = await params;
  const tab = satelliteTab;
  if (!VALID_TABS.includes(tab as (typeof VALID_TABS)[number])) {
    notFound();
  }
  return (
    <SatelliteMonitoringDashboard
      defaultTab={tab as (typeof VALID_TABS)[number]}
    />
  );
}
