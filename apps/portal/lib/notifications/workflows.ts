import {
  triggerBreakdownNotification,
  triggerSafetyNotification,
  triggerReportReadyNotification,
} from "@repo/utils/novu";

export async function notifyBreakdown(
  fleetId: string,
  reason: string,
  departmentId: string,
) {
  return triggerBreakdownNotification(fleetId, reason, departmentId);
}

export async function notifySafetyIncident(
  incidentType: string,
  location: string,
  departmentId: string,
) {
  return triggerSafetyNotification(incidentType, location, departmentId);
}

export async function notifyReportReady(
  reportId: string,
  departmentId: string,
) {
  return triggerReportReadyNotification(reportId, departmentId);
}

export async function notifyDailyLogReminder(_departmentId: string) {
  // Placeholder for daily log reminder workflow
  // Future: implement via Novu digest or scheduled workflow
  return Promise.resolve();
}
