import pino from "pino";

const options: pino.LoggerOptions =
  process.env.NODE_ENV === "production"
    ? {
        formatters: {
          level: (label: string) => {
            return { level: label };
          },
        },
        redact: {
          paths: ["userName"],
          remove: true,
        },
      }
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      };

const logger = pino({ level: process.env.LOG_LEVEL || "info", ...options });

export default logger;
