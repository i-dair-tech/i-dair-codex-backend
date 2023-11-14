import { Router } from "express";
import { Paths } from "../common/paths";
import {
  uploadDataset,
  getAllDataset,
  downloadFile,
} from "../controllers/dataset.controller";
import { getListModelsByType } from "../controllers/models.controller";
import { upload } from "../middleware/multer";
import { getUser } from "../middleware/authentication";
import {
  addMember,
  changeUserRole,
  changeUserStatus,
  getAllUsers,
} from "../controllers/user.controller";
import { traceFunction } from "../common/functions";
const riCodexRoutes = Router();

riCodexRoutes.post(Paths.UPLOAD_DATASET, upload, getUser, async (req, res) => {
  await traceFunction("Upload dataset", uploadDataset, req, res);
});
riCodexRoutes.get(Paths.GET_ALL_DATASET, getUser, async (req, res) => {
  await traceFunction("Get all dataset", getAllDataset, req, res);
});
riCodexRoutes.post(Paths.DOWNLOAD_FILE, getUser, async (req, res) => {
  await traceFunction("Download file", downloadFile, req, res);
});
riCodexRoutes.get(Paths.GET_LIST_MODELS_BY_TYPE, getUser, async (req, res) => {
  await traceFunction("Get list models by type", getListModelsByType, req, res);
});
riCodexRoutes.post(Paths.ADD_MEMBER, getUser, addMember);
riCodexRoutes.get(Paths.GET_ALL_USERS, getUser, getAllUsers);
riCodexRoutes.post(Paths.CHANGE_USER_STATUS, getUser, changeUserStatus);
riCodexRoutes.post(Paths.CHANGE_USER_ROLE, getUser, changeUserRole);
export default riCodexRoutes;
