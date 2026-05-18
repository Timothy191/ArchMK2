"use client";

import { useState, useEffect } from "react";
import { Button } from "@repo/ui/components/ui/button";
import { Card } from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";
import { RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface WebhookDeliveryLog {
  id: string;
  webhook_endpoint_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  delivered_at: string | null;
  retry_count: number;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

interface WebhookDeliveryLogsProps {
  webhookId: string;
}

export function WebhookDeliveryLogs({ webhookId }: WebhookDeliveryLogsProps) {
  const [logs, setLogs] = useState<WebhookDeliveryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<WebhookDeliveryLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [webhookId]);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/webhooks/${webhookId}/logs`);
      const data = await response.json();
      if (response.ok) {
        setLogs(data.logs);
      } else {
        toast.error("Failed to fetch delivery logs");
      }
    } catch (error) {
      toast.error("Failed to fetch delivery logs");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-heading">Delivery Logs</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {logs.length === 0 ? (
        <Card className="p-8 text-center border-default">
          <p className="text-muted">No delivery logs yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card
              key={log.id}
              className="p-4 border-default cursor-pointer hover:border-accent-emerald transition-colors"
              onClick={() => setSelectedLog(log)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {log.event_type}
                    </Badge>
                    {log.success ? (
                      <Badge variant="default" className="bg-accent-emerald">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Delivered
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <XCircle className="w-3 h-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                    {log.retry_count > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        Retry {log.retry_count}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted">
                    {log.delivered_at ? formatDate(log.delivered_at) : formatDate(log.created_at)}
                  </div>
                  {log.error_message && (
                    <div className="text-sm text-red mt-1">{log.error_message}</div>
                  )}
                </div>
                <div className="ml-4">
                  {log.response_status && (
                    <Badge
                      variant={log.response_status >= 200 && log.response_status < 300 ? "default" : "outline"}
                    >
                      {log.response_status}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedLog && (
        <Card className="p-6 border-default">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-heading">Log Details</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedLog(null)}
            >
              Close
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-body">Event Type</label>
              <div className="mt-1">{selectedLog.event_type}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-body">Created At</label>
              <div className="mt-1">{formatDate(selectedLog.created_at)}</div>
            </div>
            {selectedLog.delivered_at && (
              <div>
                <label className="text-sm font-medium text-body">Delivered At</label>
                <div className="mt-1">{formatDate(selectedLog.delivered_at)}</div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-body">Status</label>
              <div className="mt-1">
                {selectedLog.success ? "Success" : "Failed"}
              </div>
            </div>
            {selectedLog.response_status && (
              <div>
                <label className="text-sm font-medium text-body">Response Status</label>
                <div className="mt-1">{selectedLog.response_status}</div>
              </div>
            )}
            {selectedLog.retry_count > 0 && (
              <div>
                <label className="text-sm font-medium text-body">Retry Count</label>
                <div className="mt-1">{selectedLog.retry_count}</div>
              </div>
            )}
            {selectedLog.error_message && (
              <div>
                <label className="text-sm font-medium text-body">Error Message</label>
                <div className="mt-1 text-red">{selectedLog.error_message}</div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-body">Payload</label>
              <pre className="mt-1 p-3 bg-bg-secondary rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(selectedLog.payload, null, 2)}
              </pre>
            </div>
            {selectedLog.response_body && (
              <div>
                <label className="text-sm font-medium text-body">Response Body</label>
                <pre className="mt-1 p-3 bg-bg-secondary rounded text-xs overflow-auto max-h-40">
                  {selectedLog.response_body}
                </pre>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
