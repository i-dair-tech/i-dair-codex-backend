import { Request, Response } from "express";
import fs from "fs";
import { errorServerResponse } from "../common/functions";
import { MSG } from "../common/responseMessages";
import { sequelize } from "../config/sequelize";
import { getPathToSave } from "../middleware/multer";
import appLogger from "../logger/logger";

let logger = appLogger();

const uploadDataset = async (
  req: Request,
  res: Response,
  span: any,
  traceId: string,
  spanId: string
) => {
  let statusCode = null;
  span.setAttribute("http.method", req.method);
  const { country, studyName, user, idGroup } = req.body;
  const file = req.file;

  //check for country and studyName
  if (!country || !studyName || (!idGroup && idGroup !== 0)) {
    statusCode = 400;
    span.setAttribute("http.status_code", statusCode);
    span.setAttribute("error.message", MSG.MISSING_DATA);
    span.end();
    return res.status(400).send({ success: false, message: MSG.MISSING_DATA });
  }

  //check if file exist
  if (!file) {
    statusCode = 400;
    span.setAttribute("http.status_code", statusCode);
    span.setAttribute("error.message", MSG.MISSING_FILE);
    span.end();
    return res.status(400).send({ success: false, message: MSG.MISSING_FILE });
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
    message: `Request Upload Dataset ${file.filename} for country ${country} and study name ${studyName}`,
    level: "info",
    meta: {
      userId: (userData[0][0] as any).id,
      module: "Upload dataset",
      trace_id: traceId,
      span_id: spanId,
    },
  });

  return sequelize
    .query(
      "INSERT INTO dataset (file_name,file_path,country,study_name,test,train,seed,shuffle,id_group,id_user) VALUES ($fileName,$filePath,$country,$studyName,$test,$train,$seed,$shuffle,$idGroup,$idUser) ",
      {
        bind: {
          fileName: file.filename,
          filePath: `/dataset/${file.filename}`,
          country,
          studyName,
          test: 30,
          train: 70,
          seed: 42,
          shuffle: true,
          idGroup,
          idUser: (userData[0][0] as any).id,
        },
      }
    )
    .then((data) => {
      logger.log({
        message: `The dataset ${file.filename} was uploaded successfully`,
        level: "info",
        meta: {
          userId: (userData[0][0] as any).id,
          module: "Upload dataset",
          trace_id: traceId,
          span_id: spanId,
        },
      });
      statusCode = 200;
      span.setAttribute("http.status_code", statusCode);
      span.end();
      return res.status(200).send({
        success: true,
        message: MSG.FILE_UPLOADED_SUCCESSFULLY,
        fileId: data[0],
      });
    })
    .catch((error) => {
      logger.log({
        message: `An error occurred when uploading the dataset ${file.filename}`,
        level: "error",
        meta: {
          userId: (userData[0][0] as any).id,
          module: "Upload dataset",
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

const getAllDataset = async (
  req: Request,
  res: Response,
  span: any,
  traceId: string,
  spanId: string
) => {
  let statusCode = null;
  span.setAttribute("http.method", req.method);
  const { user } = req.body;
  const { idGroup } = req.query;
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
    message: `Request get all dataset`,
    level: "info",
    meta: {
      userId: (userData[0][0] as any).id,
      module: "Get all dataset",
      trace_id: traceId,
      span_id: spanId,
    },
  });

  const query =
    idGroup === "0"
      ? "SELECT d.*, g.name as group_name FROM dataset as d LEFT JOIN `groups` as g ON g.id=d.id_group WHERE d.id_user=$idUser"
      : "SELECT d.*, g.name as group_name FROM dataset as d LEFT JOIN `groups` as g ON g.id=d.id_group WHERE d.id_group=$idGroup";
  return sequelize
    .query(query, {
      bind: { idUser: (userData[0][0] as any).id, idGroup },
    })
    .then((dataset: any) => {
      logger.log({
        level: "info",
        message: `List of dataset returned successfully`,
        meta: {
          userId: (userData[0][0] as any).id,
          module: "Get all dataset",
          trace_id: traceId,
          span_id: spanId,
        },
      });
      statusCode = 200;
      span.setAttribute("http.status_code", statusCode);
      span.end();
      return res.status(200).send({
        success: true,
        data: dataset[0].sort((a: any, b: any) => b.created_at - a.created_at),
      });
    })
    .catch((error) => {
      logger.log({
        level: "error",
        message: `An error occurred when getting the list of dataset`,
        meta: {
          userId: (userData[0][0] as any).id,
          module: "Get all dataset",
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

const downloadFile = async (
  req: Request,
  res: Response,
  span: any,
  traceId: string,
  spanId: string
) => {
  let statusCode = null;
  span.setAttribute("http.method", req.method);
  const { idDataset, user } = req.body;

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
    level: "info",
    message: `Request download dataset`,
    meta: {
      userId: (userData[0][0] as any).id,
      module: "Download dataset",
      trace_id: traceId,
      span_id: spanId,
    },
  });

  return sequelize
    .query("SELECT * FROM dataset where id =:idDataset", {
      replacements: {
        idDataset: idDataset,
      },
    })
    .then((data: any) => {
      if (data[0][0]) {
        const fileName = data[0][0].file_name;
        if (!fs.existsSync(getPathToSave())) {
          statusCode = 400;
          span.setAttribute("http.status_code", statusCode);
          span.setAttribute("error.message", MSG.FILE_NOT_FOUND);
          span.end();
          return res
            .status(400)
            .send({ success: false, message: MSG.FILE_NOT_FOUND });
        } else {
          return fs.readFile(
            `${getPathToSave()}/${fileName}`,
            function (err, fileData) {
              if (err) {
                statusCode = 400;
                span.setAttribute("http.status_code", statusCode);
                span.setAttribute("error.message", MSG.DATA_NOT_FOUND);
                span.end();
                return res
                  .status(400)
                  .send({ success: false, message: MSG.DATA_NOT_FOUND });
              } else {
                logger.log({
                  level: "info",
                  message: `Dataset ${fileName} was downloaded successfully`,
                  meta: {
                    userId: (userData[0][0] as any).id,
                    module: "Download dataset",
                    trace_id: traceId,
                    span_id: spanId,
                  },
                });
                statusCode = 200;
                span.setAttribute("http.status_code", statusCode);
                span.end();
                return res.status(200).send({ success: true, data: fileData });
              }
            }
          );
        }
      } else {
        statusCode = 400;
        span.setAttribute("http.status_code", statusCode);
        span.setAttribute("error.message", MSG.FILE_NOT_FOUND);
        span.end();
        return res
          .status(400)
          .send({ success: false, message: MSG.DATA_NOT_FOUND });
      }
    })
    .catch((error) => {
      logger.log({
        level: "error",
        message: `An error occurred when downloading the dataset`,
        meta: {
          userId: (userData[0][0] as any).id,
          module: "Download dataset",
          trace_id: traceId,
          span_id: spanId,
        },
      });
      statusCode = 500;
      span.setAttribute("http.status_code", statusCode);
      span.recordException(error);
      span.setAttribute("error.message", error);
      span.end();
      return res
        .status(500)
        .send({ success: false, message: MSG.SERVER_ERROR });
    });
};
export { getAllDataset, uploadDataset, downloadFile };
