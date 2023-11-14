import jwt_decode from "jwt-decode";
import { Request, Response } from "express";
import { betweenMarkers, errorServerResponse } from "../common/functions";
import { MSG } from "../common/responseMessages";

const getUser = (req: Request, res: Response, next: any) => {
  const isLocal = process.env.IS_LOCAL === "True";
  try {
    if (isLocal) {
      req.body.user = { email: "user@local.com", groupName: "local" };
      next();
    } else {
      if (!req.headers.authorization) {
        return res
          .status(401)
          .send({ success: false, message: MSG.UNAUTHORIZED });
      }
      const token = req.headers.authorization.split(" ")[1];
      const decodedToken: any = jwt_decode(token);
      const { email } = decodedToken;
      const groupName = betweenMarkers(email, "@", ".");
      req.body.user = { email, groupName };
      next();
    }
  } catch (error) {
    console.log("error", error);
    return errorServerResponse(res);
  }
};

export { getUser };
