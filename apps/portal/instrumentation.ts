import * as Sentry from "@sentry/nextjs";
import { H } from "@highlight-run/next/server";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

let otelSdk: NodeSDK | null = null;

export async function register() {
  // Highlight server-side init
  if (process.env.HIGHLIGHT_PROJECT_ID) {
    H.init({
      projectID: process.env.HIGHLIGHT_PROJECT_ID,
      serviceName: process.env.OTEL_SERVICE_NAME || "arch-portal",
      environment:
        process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    });
  }

  // OpenTelemetry NodeSDK
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  ) {
    const traceExporter = new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    });

    otelSdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || "arch-portal",
      }),
      traceExporter,
      instrumentations: [getNodeAutoInstrumentations()],
    });

    otelSdk.start();
  }

  // Sentry (existing)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment:
        process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment:
        process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
