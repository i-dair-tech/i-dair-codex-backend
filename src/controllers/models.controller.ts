import { Request, Response } from "express";
import { promises as fs } from "fs";
import { errorServerResponse } from "../common/functions";
import { MSG } from "../common/responseMessages";
import { sequelize } from "../config/sequelize";
import { getPathToSave } from "../middleware/multer";
import appLogger from "../logger/logger";

let logger = appLogger();

const getListModelsByType = async (
  req: Request,
  res: Response,
  span: any,
  traceId: string,
  spanId: string
) => {
  let statusCode = null;
  span.setAttribute("http.method", req.method);
  const { idDataset, target } = req.query;
  const { user } = req.body;
  // check for missing data
  if (!idDataset) {
    statusCode = 400;
    span.setAttribute("http.status_code", statusCode);
    span.setAttribute("error.message", MSG.MISSING_DATA);
    span.end();
    return res.status(400).send({ success: false, message: MSG.MISSING_DATA });
  }

  const userData = await sequelize.query(
    "SELECT * FROM user WHERE email=$email",
    { bind: { email: user.email } }
  );
  if (userData[0].length === 0) {
    statusCode = 400;
    span.setAttribute("http.status_code", statusCode);
    span.setAttribute("error.message", MSG.USER_NOT_FOUND);
    span.end();
    return res
      .status(400)
      .send({ success: false, message: MSG.USER_NOT_FOUND });
  }

  logger.log({
    message: `Request get list models for target ${target}`,
    level: "info",
    meta: {
      userId: (userData[0][0] as any).id,
      module: "Get list models",
      trace_id: traceId,
      span_id: spanId,
    },
  });

  // get the path of descriptive statistics's json file
  const dataset = await sequelize.query(
    "SELECT file_name FROM dataset WHERE id=$idDataset",
    { bind: { idDataset } }
  );

  let modelType = "clustering";

  if (target) {
    let pathDataset = `${getPathToSave()}/${(dataset[0][0] as any).file_name}`;
    pathDataset =
      pathDataset.substring(0, pathDataset.lastIndexOf(".")) + ".json";

    try {
      // get descriptive statistics for the dataset
      const descriptiveStatistics = JSON.parse(
        await fs.readFile(pathDataset, "utf8")
      );

      // get the variables from the descriptive statistics
      const variables = Object.keys(descriptiveStatistics.variables);

      // check if the target exists in the variables
      if (!variables.includes(target as string)) {
        statusCode = 400;
        span.setAttribute("http.status_code", statusCode);
        span.setAttribute("error.message", MSG.TARGET_NOT_FOUND);
        span.end();
        return res
          .status(400)
          .send({ success: false, message: MSG.TARGET_NOT_FOUND });
      }

      // get the type of the target
      modelType =
        descriptiveStatistics.variables[target as string].type === "Numeric"
          ? "regression"
          : "classification";
    } catch (error) {
      logger.log({
        message: `An error occurred when reading descriptive statistics`,
        level: "error",
        meta: {
          userId: (userData[0][0] as any).id,
          module: "Get list models",
          trace_id: traceId,
          span_id: spanId,
        },
      });
      statusCode = 400;
      span.setAttribute("http.status_code", statusCode);
      span.setAttribute(
        "error.message",
        MSG.FAIL_READING_DESCRIPTIVE_STATISTICS
      );
      span.end();
      return res.status(400).send({
        success: false,
        message: MSG.FAIL_READING_DESCRIPTIVE_STATISTICS,
      });
    }
  }

  // get the list of models
  return sequelize
    .query("SELECT * FROM models WHERE is_active=1 AND type=$type", {
      bind: {
        type: modelType,
      },
    })
    .then((models: any) => {
      let listModelId: Array<any> = [];
      models[0].map((model: any) => {
        listModelId.push(model.id);
        return true;
      });

      logger.log({
        message: `success get list models `,
        level: "info",
        meta: {
          userId: (userData[0][0] as any).id,
          module: "Get list models",
          trace_id: traceId,
          span_id: spanId,
        },
      });
      statusCode = 200;
      span.setAttribute("http.status_code", statusCode);
      span.end();
      return res.status(200).send({
        success: true,
        data: listModelId,
      });
    })
    .catch((error) => {
      logger.log({
        message: `An error occurred when getting list models`,
        level: "error",
        meta: {
          userId: (userData[0][0] as any).id,
          module: "Get list models",
          trace_id: traceId,
          span_id: spanId,
        },
      });
      statusCode = 500;
      span.setAttribute("http.status_code", statusCode);
      span.recordException(error);
      span.setAttribute("error.message", error);
      span.end();
      return errorServerResponse(res);
    });
};

export { getListModelsByType };
