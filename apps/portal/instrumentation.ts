import * as Sentry from "@sentry/nextjs";
import { H } from "@highlight-run/next/server";

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

  // OpenTelemetry NodeSDK — dynamic import to prevent webpack from bundling native gRPC modules
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  ) {
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const { getNodeAutoInstrumentations } = await import(
      "@opentelemetry/auto-instrumentations-node"
    );
    const { OTLPTraceExporter } = await import(
      "@opentelemetry/exporter-trace-otlp-http"
    );
    const { resourceFromAttributes } = await import("@opentelemetry/resources");
    const { ATTR_SERVICE_NAME } = await import(
      "@opentelemetry/semantic-conventions"
    );

    const traceExporter = new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    });

    const otelSdk = new NodeSDK({
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
