const { app } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

const logsPath = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsPath)) {
  fs.mkdirSync(logsPath, { recursive: true });
}

const LOG_FILE_PATH = path.join(logsPath, "log.txt");

const COLORS = {
  INFO: "\x1b[34m", // Blue
  DEBUG: "\x1b[36m", // Cyan
  ERROR: "\x1b[31m", // Red
  RESET: "\x1b[0m", // Reset color
};

console.log("Log Path:", logsPath);

const logger = {
  getCrashLogFilePath: () =>
    path.join(
      logsPath,
      `crash-${new Date().toISOString().replace(/[:.]/g, "-")}.log`
    ),

  log: (level, message, metadata = {}) => {
    try {
      const timestamp = new Date().toISOString();
      const formattedTime = new Date().toLocaleString(); 
      
      const logEntry = `[${level}] ${formattedTime} - ${message}\n`;

      // Save regular logs to log.txt
      fs.appendFileSync(LOG_FILE_PATH, logEntry);

      // Print colored output in the console
      console.log(
        `${COLORS[level] || COLORS.RESET}[${level}] ${formattedTime}: ${message}${COLORS.RESET}`
      );
    } catch (error) {
      console.error("Failed to write log:", error);
    }
  },

  error: (message, error) => {
    const timestamp = new Date().toISOString();
    const formattedTime = new Date().toLocaleString();

    const simpleLogEntry = `[ERROR] ${formattedTime} - ${message}\n`;
    fs.appendFileSync(LOG_FILE_PATH, simpleLogEntry);

    const crashLogEntry =
      JSON.stringify({
        timestamp,
        level: "ERROR",
        message,
        metadata: error
          ? {
              error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
                code: error.code,
              },
            }
          : {},
        userInfo: {
          platform: process.platform,
          arch: process.arch,
          osVersion: os.release(),
          appVersion: app.getVersion(),
          userId: "anonymous",
        },
      }) + "\n";

    fs.appendFileSync(logger.getCrashLogFilePath(), crashLogEntry);

    // Console output
    console.log(`${COLORS.ERROR}[ERROR] ${formattedTime}: ${message}${COLORS.RESET}`);
  },

  info: (message) => {
    logger.log("INFO", message);
  },

  debug: (message) => {
    logger.log("DEBUG", message);
  },
};

module.exports = logger;
