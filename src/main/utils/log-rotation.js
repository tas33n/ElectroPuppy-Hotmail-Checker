const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const MAX_LOG_FILES = 10;
const LOGS_DIR = path.join(app.getAppPath(), "logs");

function rotateLogs() {
  fs.readdir(LOGS_DIR, (err, files) => {
    if (err) return;

    if (files.length > MAX_LOG_FILES) {
      files
        .sort(
          (a, b) =>
            fs.statSync(path.join(LOGS_DIR, a)).birthtimeMs -
            fs.statSync(path.join(LOGS_DIR, b)).birthtimeMs
        )
        .slice(0, files.length - MAX_LOG_FILES)
        .forEach((file) => fs.unlinkSync(path.join(LOGS_DIR, file)));
    }
  });
}

module.exports = rotateLogs;
