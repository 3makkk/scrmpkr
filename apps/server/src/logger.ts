import pino from "pino";

const options: pino.LoggerOptions = {
  formatters: {
    level: (label: string) => {
      return { level: label };
    },
  },
  redact: {
    paths: ["userName"],
    remove: true,
  },
};

const logger = pino({ level: process.env.LOG_LEVEL || "info", ...options });

export default logger;
