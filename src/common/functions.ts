import { MSG } from "./responseMessages";
import fs from "fs";
import { Request, Response } from "express";
import { trace, context, TraceFlags } from "@opentelemetry/api";
import { sequelize } from "../config/sequelize";
import appLogger from "../logger/logger";
let logger = appLogger();
export const errorServerResponse = (res: Response) => {
  return res.status(500).send({
    success: false,
    message: MSG.SERVER_ERROR,
  });
};

export const deleteFile = (filePath: string) => {
  fs.unlink(filePath, function (err) {
    if (err) {
      console.log(err);
      return false;
    } else {
      return true;
    }
  });
};

export const betweenMarkers = (text: string, begin: string, end: string) => {
  const firstChar = text.indexOf(begin) + begin.length;
  const lastChar = text.lastIndexOf(end);
  return text.substring(firstChar, lastChar);
};

export const traceFunction = async (
  name: string,
  func: any,
  req: Request,
  res: Response
) => {
  const tracer = trace.getTracer(__filename);
  const traceId = req.headers["trace-id"] as string;
  const spanId = req.headers["span-id"] as string;
  let customContext;
  if (spanId && traceId) {
    const spanContext = {
      traceId: traceId,
      spanId: spanId,
      traceFlags: TraceFlags.SAMPLED,
      isRemote: true,
    };
    customContext = trace.setSpanContext(context.active(), spanContext);
  }
  const span = tracer.startSpan(name, undefined, customContext);
  try {
    await func(req, res, span, traceId, spanId);
  } catch (error: any) {
    span.setAttribute("http.status_code", 500);
    span.recordException(error);
    span.setAttribute("error.message", error);
  } finally {
    span.end();
  }
};

export const createSuperAdmin = async () => {
  let userData;
  try {
    userData = await sequelize.query(
      "SELECT * FROM user WHERE role = 'super admin' AND is_active = true "
    );
    if (userData[0].length === 0) {
      await sequelize.query(
        "INSERT INTO user (email, role, is_active) VALUES (:email, 'super admin', true)",
        { replacements: { email: process.env.SUPER_ADMIN_EMAIL } }
      );
    }
  } catch (error) {
    logger.log({
      level: "error",
      message: `An error occurred when creating the super admin`,
      meta: { userId: null, module: "create the super admin" },
    });
  }
};
