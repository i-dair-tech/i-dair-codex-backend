import { Request, Response } from "express";
import multer, { diskStorage } from "multer";
import path from "path";

const getPathToSave = () => {
  const isLocalPath = process.env.IS_LOCAL_PATH;
  if (isLocalPath) {
    const basePath = path.resolve(__dirname, "../../../");
    const datasetBasePath = process.env.PATH_TO_SAVE_DATASET || "dataset";
    return `${basePath}/${datasetBasePath}`;
  } else {
    console.log(process.env.PATH_TO_SAVE_DATASET);
    return process.env.PATH_TO_SAVE_DATASET || "dataset";
  }
};
const uploadFile = multer({
  storage: diskStorage({
    destination: (req, file, callBack) => {
      callBack(null, getPathToSave());
    },
    filename: (req, file, callBack) => {
      callBack(
        null,
        file.originalname.split(".")[0] +
          "-" +
          Date.now() +
          path.extname(file.originalname)
      );
    },
  }),
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB in bytes
  },
});
const upload = (req: Request, res: Response, next: any) => {
  return uploadFile.single("file")(req, res, next);
};

export { upload, getPathToSave };
