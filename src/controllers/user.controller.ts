import { Request, Response } from "express";
import { errorServerResponse } from "../common/functions";
import { MSG } from "../common/responseMessages";
import { sequelize } from "../config/sequelize";
import appLogger from "../logger/logger";

let logger = appLogger();

const addMember = async (req: Request, res: Response) => {
  const { members, user } = req.body;
  if (!members || !Array.isArray(members) || members.length === 0) {
    return res.status(400).send({ success: false, message: MSG.MISSING_DATA });
  }
  const existingEmails = await sequelize.query(
    "SELECT email FROM user WHERE email IN (:members)",
    {
      replacements: { members },
    }
  );
  const flattenedExistingEmails = existingEmails
    .flat()
    .map((obj: any) => obj.email);

  const existingEmailSet = new Set(flattenedExistingEmails);
  const existingMembers = members.filter((member) =>
    existingEmailSet.has(member.toLowerCase())
  );
  if (existingMembers.length > 0) {
    return res.status(400).send({
      success: false,
      message: MSG.MEMBER_ALREADY_EXIST,
      data: { existingMembers },
    });
  }
  const userData = await sequelize.query(
    "SELECT * FROM user WHERE email=$email",
    { bind: { email: user.email } }
  );
  const addBy = (userData[0][0] as any).id;
  if (
    (userData[0][0] as any).role !== "admin" &&
    (userData[0][0] as any).role !== "super admin"
  ) {
    logger.log({
      message: `You are not allowed to add a member`,
      level: "error",
      meta: { userId: (userData[0][0] as any).id, module: "Add member" },
    });
    return res
      .status(401)
      .send({ success: false, message: MSG.UNAUTHORIZED, data: [] });
  }

  try {
    let newMembers = [];
    for (const member of members) {
      const newMember = await sequelize.query(
        "INSERT INTO user (email, role, is_active) VALUES ($member,'simple user',true)",
        {
          bind: {
            member,
          },
        }
      );
      newMembers.push({ id: newMember[0], email: member, is_active: true });
    }
    logger.log({
      message: `Members were added successfully`,
      level: "info",
      meta: { userId: addBy, module: "Add member" },
    });
    return res.status(200).send({
      success: true,
      message: MSG.MEMBER_ADDED_SUCCESSFULLY,
      data: newMembers,
    });
  } catch (error) {
    logger.log({
      message: `An error occurred when adding members`,
      level: "error",
      meta: { userId: addBy, module: "Add member" },
    });
    return errorServerResponse(res);
  }
};

const getAllUsers = async (req: Request, res: Response) => {
  const { user } = req.body;
  let userData: any;
  userData = await sequelize.query("SELECT * FROM user WHERE email=$email", {
    bind: { email: user.email },
  });
  if (userData[0].length === 0) {
    return res
      .status(400)
      .send({ success: false, message: MSG.USER_NOT_FOUND });
  }
  if (
    (userData[0][0] as any).role !== "admin" &&
    (userData[0][0] as any).role !== "super admin"
  ) {
    return res.status(401).send({ success: false, message: MSG.UNAUTHORIZED });
  }

  logger.log({
    message: `Request get all users`,
    level: "info",
    meta: { userId: (userData[0][0] as any).id, module: "Get all users" },
  });
  try {
    if ((userData[0][0] as any).role === "admin") {
      const query =
        "SELECT id, email, is_active,role FROM user WHERE role NOT IN ('local','admin','super admin')";
      const users = await sequelize.query(query);
      logger.log({
        level: "info",
        message: `List of users returned successfully`,
        meta: { userId: (userData[0][0] as any).id, module: "Get all users" },
      });
      return res.status(200).send({
        success: true,
        data: users[0],
      });
    } else if ((userData[0][0] as any).role === "super admin") {
      const query =
        "SELECT id, email, is_active,role FROM user WHERE role NOT IN ('local','super admin')";
      const users = await sequelize.query(query);
      logger.log({
        level: "info",
        message: `List of users returned successfully`,
        meta: { userId: (userData[0][0] as any).id, module: "Get all users" },
      });
      return res.status(200).send({
        success: true,
        data: users[0],
      });
    }
  } catch (error: any) {
    logger.log({
      level: "error",
      message: `An error occurred when getting the list of users`,
      meta: { userId: (userData[0][0] as any).id, module: "Get all users" },
    });
    return errorServerResponse(res);
  }
};

const changeUserStatus = async (req: Request, res: Response) => {
  const { user, idUserToChange, status } = req.body;
  const userData = await sequelize.query(
    "SELECT * FROM user WHERE email=$email",
    { bind: { email: user.email } }
  );
  if (userData[0].length === 0) {
    return res
      .status(400)
      .send({ success: false, message: MSG.USER_NOT_FOUND });
  }
  if (
    (userData[0][0] as any).role !== "admin" &&
    (userData[0][0] as any).role !== "super admin"
  ) {
    return res.status(401).send({ success: false, message: MSG.UNAUTHORIZED });
  }

  if (!idUserToChange || (!status && status !== false)) {
    return res.status(400).send({ success: false, message: MSG.MISSING_DATA });
  }

  logger.log({
    message: `Request update user status`,
    level: "info",
    meta: { userId: (userData[0][0] as any).id, module: "Update user status" },
  });

  const query = "UPDATE user SET is_active=$status WHERE id = $idUserToChange";
  return sequelize
    .query(query, {
      bind: {
        idUserToChange,
        status,
      },
    })
    .then(() => {
      logger.log({
        level: "info",
        message: `Status of user updated successfully`,
        meta: {
          userId: (userData[0][0] as any).id,
          module: "Update user status",
        },
      });
      return res.status(200).send({
        success: true,
        data: [],
        message: MSG.STATUS_USER_UPDATED,
      });
    })
    .catch((error) => {
      logger.log({
        level: "error",
        message: `An error occurred when updating user status`,
        meta: {
          userId: (userData[0][0] as any).id,
          module: "Update user status",
        },
      });
      return errorServerResponse(res);
    });
};

const changeUserRole = async (req: Request, res: Response) => {
  const { user, idUserToChange, role } = req.body;
  const userData = await sequelize.query(
    "SELECT * FROM user WHERE email=$email",
    { bind: { email: user.email } }
  );
  if (userData[0].length === 0) {
    return res
      .status(400)
      .send({ success: false, message: MSG.USER_NOT_FOUND });
  }
  if ((userData[0][0] as any).role !== "super admin") {
    return res.status(401).send({ success: false, message: MSG.UNAUTHORIZED });
  }

  if (!idUserToChange || !role) {
    return res.status(400).send({ success: false, message: MSG.MISSING_DATA });
  }

  logger.log({
    message: `Request update user role`,
    level: "info",
    meta: { userId: (userData[0][0] as any).id, module: "Update user role" },
  });

  const query = "UPDATE user SET role=$role WHERE id = $idUserToChange";
  return sequelize
    .query(query, {
      bind: {
        idUserToChange,
        role,
      },
    })
    .then(() => {
      logger.log({
        level: "info",
        message: `Role of user updated successfully`,
        meta: {
          userId: (userData[0][0] as any).id,
          module: "Update user role",
        },
      });
      return res.status(200).send({
        success: true,
        data: [],
        message: MSG.ROLE_USER_UPDATED,
      });
    })
    .catch((error) => {
      logger.log({
        level: "error",
        message: `An error occurred when updating user role`,
        meta: {
          userId: (userData[0][0] as any).id,
          module: "Update user role",
        },
      });
      return errorServerResponse(res);
    });
};

export { addMember, getAllUsers, changeUserStatus, changeUserRole };
