import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { Task } from "../models/task.models.js";
import { SubTask } from "../models/subtask.models.js";
import { ProjectNote } from "../models/note.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { Apierror } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";

const getProjects = asyncHandler(async (req, res) => {
  const memberships = await ProjectMember.find({ user: req.user._id })
    .populate({
      path: "project",
      select: "name description createdBy createdAt updatedAt",
      populate: { path: "createdBy", select: "username fullname avatar" },
    })
    .lean();

  const projectIds = memberships.map((membership) => membership.project?._id);
  const memberCounts = projectIds.length
    ? await ProjectMember.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: "$project", count: { $sum: 1 } } },
      ])
    : [];

  const countMap = new Map(
    memberCounts.map((item) => [item._id.toString(), item.count]),
  );

  const projects = memberships
    .filter((membership) => membership.project)
    .map((membership) => ({
      project: {
        ...membership.project,
        members: countMap.get(membership.project._id.toString()) || 0,
      },
      role: membership.role,
    }));

  return res
    .status(200)
    .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

const getProjectById = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findById(projectId).populate(
    "createdBy",
    "username fullname avatar",
  );

  if (!project) {
    throw new Apierror(404, "Project not found");
  }

  const memberCount = await ProjectMember.countDocuments({
    project: projectId,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...project.toObject(),
        members: memberCount,
        currentUserRole: req.projectMember?.role,
      },
      "Project fetched successfully",
    ),
  );
});

const createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const existingProject = await Project.findOne({ name });
  if (existingProject) {
    throw new Apierror(409, "A project with this name already exists");
  }

  const project = await Project.create({
    name,
    description,
    createdBy: req.user._id,
  });

  await ProjectMember.create({
    user: req.user._id,
    project: project._id,
    role: UserRolesEnum.ADMIN,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, project, "Project created successfully"));
});

const updateProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { projectId } = req.params;

  const duplicate = await Project.findOne({
    name,
    _id: { $ne: projectId },
  });
  if (duplicate) {
    throw new Apierror(409, "A project with this name already exists");
  }

  const project = await Project.findByIdAndUpdate(
    projectId,
    { name, description },
    { new: true, runValidators: true },
  );

  if (!project) {
    throw new Apierror(404, "Project not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project updated successfully"));
});

const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findById(projectId);

  if (!project) {
    throw new Apierror(404, "Project not found");
  }

  const tasks = await Task.find({ project: projectId }).select("attachments");
  await Promise.all(
    tasks.flatMap((task) =>
      task.attachments.map(async (attachment) => {
        if (!attachment.localPath) return;
        try {
          const fs = await import("node:fs/promises");
          await fs.unlink(attachment.localPath);
        } catch (_error) {
          // Missing attachment files should not block project deletion.
        }
      }),
    ),
  );

  await Promise.all([
    SubTask.deleteMany({ task: { $in: tasks.map((task) => task._id) } }),
    Task.deleteMany({ project: projectId }),
    ProjectNote.deleteMany({ project: projectId }),
    ProjectMember.deleteMany({ project: projectId }),
    Project.deleteOne({ _id: projectId }),
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project deleted successfully"));
});

const addMembersToProject = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const { projectId } = req.params;

  const user = await User.findOne({ email });
  if (!user) {
    throw new Apierror(404, "User not found");
  }

  if (user._id.equals(req.user._id)) {
    throw new Apierror(409, "You are already the project administrator");
  }

  const existingMember = await ProjectMember.findOne({
    project: projectId,
    user: user._id,
  });
  if (existingMember) {
    throw new Apierror(409, "User is already a member of this project");
  }

  const member = await ProjectMember.create({
    user: user._id,
    project: projectId,
    role,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, member, "Project member added successfully"));
});

const getProjectMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const projectMembers = await ProjectMember.find({ project: projectId })
    .populate("user", "username fullname avatar email")
    .sort({ createdAt: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, projectMembers, "Project members fetched"));
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params;
  const { newRole } = req.body;

  if (!AvailableUserRole.includes(newRole)) {
    throw new Apierror(400, "Invalid role");
  }

  const projectMember = await ProjectMember.findOne({
    project: projectId,
    user: userId,
  });

  if (!projectMember) {
    throw new Apierror(404, "Project member not found");
  }

  if (
    projectMember.role === UserRolesEnum.ADMIN &&
    newRole !== UserRolesEnum.ADMIN
  ) {
    const adminCount = await ProjectMember.countDocuments({
      project: projectId,
      role: UserRolesEnum.ADMIN,
    });
    if (adminCount <= 1) {
      throw new Apierror(409, "A project must have at least one admin");
    }
  }

  projectMember.role = newRole;
  await projectMember.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        projectMember,
        "Project member role updated successfully",
      ),
    );
});

const deleteMember = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params;

  if (String(req.user._id) === String(userId)) {
    throw new Apierror(409, "Project administrators cannot remove themselves");
  }

  const projectMember = await ProjectMember.findOne({
    project: projectId,
    user: userId,
  });

  if (!projectMember) {
    throw new Apierror(404, "Project member not found");
  }

  if (projectMember.role === UserRolesEnum.ADMIN) {
    const adminCount = await ProjectMember.countDocuments({
      project: projectId,
      role: UserRolesEnum.ADMIN,
    });
    if (adminCount <= 1) {
      throw new Apierror(409, "A project must have at least one admin");
    }
  }

  await projectMember.deleteOne();

  await Task.updateMany(
    { project: projectId, assignedTo: userId },
    { $unset: { assignedTo: 1 } },
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        projectMember,
        "Project member deleted successfully",
      ),
    );
});

export {
  addMembersToProject,
  createProject,
  deleteMember,
  getProjects,
  getProjectById,
  getProjectMembers,
  updateProject,
  deleteProject,
  updateMemberRole,
};
