const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf } = format;
const path = require("path");

const appLogger = () => {
  const logFolderPath = "../../../log";
  const logFileName = "backend.log";
  const logFilePath = path.join(__dirname, logFolderPath, logFileName);

  const myFormat = printf(({ level, message, timestamp, meta }: any) => {
    // Extract trace_id and span_id from the meta object
    const trace_id = meta.trace_id ? `, "trace_id": "${meta.trace_id}"` : "";
    const span_id = meta.span_id ? `, "span_id": "${meta.span_id}"` : "";

    return `{"timestamp":"${timestamp}","level":"${level}","user_id":"${meta.userId}","module":"${meta.module}"${trace_id}${span_id}, "message": "${message}"}`;
  });

  return createLogger({
    level: "info",
    format: combine(
      format.json(),
      timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      myFormat
    ),
    transports: [
      new transports.Console(),
      new transports.File({
        filename: logFilePath,
      }),
    ],
  });
};

export default appLogger;
