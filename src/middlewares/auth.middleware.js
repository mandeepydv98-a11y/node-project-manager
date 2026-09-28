import { User } from "../models/user.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { Apierror } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export const verifyJWT = asyncHandler(async (req, _res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    throw new Apierror(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken -emailVerificationToken -emailVerificationExpiry -forgotPasswordToken -forgotPasswordExpiry",
    );

    if (!user) {
      throw new Apierror(401, "Invalid access token");
    }

    req.user = user;
    next();
  } catch (_error) {
    throw new Apierror(401, "Invalid access token");
  }
});

export const validateProjectPermission = (roles = []) => {
  return asyncHandler(async (req, _res, next) => {
    const { projectId } = req.params;

    if (!mongoose.isValidObjectId(projectId)) {
      throw new Apierror(400, "Invalid project id");
    }

    const projectMember = await ProjectMember.findOne({
      project: projectId,
      user: req.user._id,
    });

    if (!projectMember) {
      throw new Apierror(403, "You are not a member of this project");
    }

    if (roles.length > 0 && !roles.includes(projectMember.role)) {
      throw new Apierror(
        403,
        "You do not have permission to perform this action",
      );
    }

    req.projectMember = projectMember;
    next();
  });
};
