"use strict";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";

const exporterOptions = {
  url:
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    "http://localhost:4318/v1/traces",
};

const traceExporter = new OTLPTraceExporter(exporterOptions);
const enabledInstrumentations = [new HttpInstrumentation()];
const sdk = new NodeSDK({
  traceExporter,
  instrumentations: enabledInstrumentations,
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "ri-codex-backend",
  }),
});

sdk.start();

// gracefully shut down the SDK on process exit
process.on("SIGTERM", () => {
  sdk
    .shutdown()
    .then(() => console.log("Tracing terminated"))
    .catch((error: any) => console.log("Error terminating tracing", error))
    .finally(() => process.exit(0));
});
