import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { metrics } from "@opentelemetry/api";
import logger from "./logger";
import { resourceFromAttributes } from "@opentelemetry/resources";

// Configure Prometheus exporter - it automatically creates an HTTP server
const prometheusExporter = new PrometheusExporter(
  {
    port: 9464,
  },
  () => {
    logger.info(
      { port: 9464, endpoint: "/metrics" },
      "Prometheus metrics endpoint initialized",
    );
  },
);

// Initialize OpenTelemetry NodeSDK with Prometheus exporter
const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "scrmpkr-server",
  }),
  metricReader: prometheusExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

// Start the SDK
sdk.start();
logger.info("OpenTelemetry NodeSDK initialized");

// Graceful shutdown
process.on("SIGTERM", () => {
  sdk
    .shutdown()
    .then(() => logger.info("OpenTelemetry SDK shut down successfully"))
    .catch((error) => logger.error({ error }, "Error shutting down SDK"));
});

// Create a meter for poker metrics
const meter = metrics.getMeter("poker-metrics");

// Create observable gauges for room and user counts
const activeRoomsGauge = meter.createObservableGauge("poker.rooms.active", {
  description: "Number of currently active poker rooms",
});

const activeUsersGauge = meter.createObservableGauge("poker.users.active", {
  description: "Number of unique active users across all rooms",
});

// Callback functions that will be set by the RoomManager
let getRoomsCount: () => number = () => 0;
let getUsersCount: () => number = () => 0;

// Register callbacks for the gauges
activeRoomsGauge.addCallback((observableResult) => {
  const count = getRoomsCount();
  observableResult.observe(count);
});

activeUsersGauge.addCallback((observableResult) => {
  const count = getUsersCount();
  observableResult.observe(count);
});

// Export function to set the metric callbacks
export function setMetricCallbacks(
  roomsCountFn: () => number,
  usersCountFn: () => number,
) {
  getRoomsCount = roomsCountFn;
  getUsersCount = usersCountFn;
  logger.info("Metrics callbacks registered");
}

// Export the Prometheus exporter for Express integration
export { prometheusExporter };
