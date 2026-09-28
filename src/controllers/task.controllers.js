import fs from "node:fs/promises";
import mongoose from "mongoose";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { Task } from "../models/task.models.js";
import { SubTask } from "../models/subtask.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { Apierror } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AvailableTaskStatus, UserRolesEnum } from "../utils/constants.js";

const getPublicBaseUrl = (req) =>
  process.env.API_PUBLIC_URL || `${req.protocol}://${req.get("host")}`;

const getAttachmentData = (req) => {
  const files = req.files || [];
  return files.map((file) => ({
    url: `${getPublicBaseUrl(req)}/images/${file.filename}`,
    localPath: file.path,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  }));
};

const ensureProjectExists = async (projectId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Apierror(400, "Invalid project id");
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new Apierror(404, "Project not found");
  }
  return project;
};

const ensureAssigneeIsMember = async (projectId, assignedTo) => {
  if (!assignedTo) return null;
  if (!mongoose.isValidObjectId(assignedTo)) {
    throw new Apierror(400, "Invalid assignee id");
  }

  const member = await ProjectMember.findOne({
    project: projectId,
    user: assignedTo,
  }).populate("user", "username fullname avatar email");

  if (!member) {
    throw new Apierror(400, "Assigned user is not a member of this project");
  }

  return member.user;
};

const deleteAttachmentFiles = async (attachments = []) => {
  await Promise.all(
    attachments.map(async (attachment) => {
      if (!attachment.localPath) return;
      try {
        await fs.unlink(attachment.localPath);
      } catch (_error) {
        // The database record can still be removed if the file is already missing.
      }
    }),
  );
};

const getTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  await ensureProjectExists(projectId);

  const tasks = await Task.find({ project: projectId })
    .populate("assignedTo", "username fullname avatar email")
    .populate("assignedBy", "username fullname avatar")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

const createTask = asyncHandler(async (req, res) => {
  const { title, description, assignedTo, status } = req.body;
  const { projectId } = req.params;

  await ensureProjectExists(projectId);
  await ensureAssigneeIsMember(projectId, assignedTo);

  if (status && !AvailableTaskStatus.includes(status)) {
    throw new Apierror(400, "Invalid task status");
  }

  const task = await Task.create({
    title,
    description,
    project: projectId,
    assignedTo: assignedTo || undefined,
    status: status || undefined,
    assignedBy: req.user._id,
    attachments: getAttachmentData(req),
  });

  const createdTask = await Task.findById(task._id)
    .populate("assignedTo", "username fullname avatar email")
    .populate("assignedBy", "username fullname avatar");

  return res
    .status(201)
    .json(new ApiResponse(201, createdTask, "Task created successfully"));
});

const getTaskById = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  await ensureProjectExists(projectId);

  if (!mongoose.isValidObjectId(taskId)) {
    throw new Apierror(400, "Invalid task id");
  }

  const task = await Task.findOne({ _id: taskId, project: projectId })
    .populate("assignedTo", "username fullname avatar email")
    .populate("assignedBy", "username fullname avatar");

  if (!task) {
    throw new Apierror(404, "Task not found");
  }

  const subtasks = await SubTask.find({ task: task._id })
    .populate("createdBy", "username fullname avatar")
    .sort({ createdAt: 1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { ...task.toObject(), subtasks },
        "Task fetched successfully",
      ),
    );
});

const updateTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  await ensureProjectExists(projectId);

  const task = await Task.findOne({ _id: taskId, project: projectId });
  if (!task) {
    throw new Apierror(404, "Task not found");
  }

  const { title, description, assignedTo, status } = req.body;

  if (status !== undefined && !AvailableTaskStatus.includes(status)) {
    throw new Apierror(400, "Invalid task status");
  }

  if (assignedTo !== undefined && assignedTo !== null && assignedTo !== "") {
    await ensureAssigneeIsMember(projectId, assignedTo);
    task.assignedTo = assignedTo;
  } else if (assignedTo !== undefined) {
    task.assignedTo = undefined;
  }

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (status !== undefined) task.status = status;

  const newAttachments = getAttachmentData(req);
  if (newAttachments.length) {
    task.attachments.push(...newAttachments);
  }

  await task.save();

  const updatedTask = await Task.findById(task._id)
    .populate("assignedTo", "username fullname avatar email")
    .populate("assignedBy", "username fullname avatar");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTask, "Task updated successfully"));
});

const deleteTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  const task = await Task.findOne({ _id: taskId, project: projectId });

  if (!task) {
    throw new Apierror(404, "Task not found");
  }

  await deleteAttachmentFiles(task.attachments);
  await Promise.all([
    SubTask.deleteMany({ task: task._id }),
    Task.deleteOne({ _id: task._id }),
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task deleted successfully"));
});

const createSubTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  const { title } = req.body;

  const task = await Task.findOne({ _id: taskId, project: projectId });
  if (!task) {
    throw new Apierror(404, "Task not found");
  }

  const subTask = await SubTask.create({
    title,
    task: task._id,
    createdBy: req.user._id,
  });

  const createdSubTask = await SubTask.findById(subTask._id).populate(
    "createdBy",
    "username fullname avatar",
  );

  return res
    .status(201)
    .json(new ApiResponse(201, createdSubTask, "Subtask created successfully"));
});

const updateSubTask = asyncHandler(async (req, res) => {
  const { projectId, subTaskId } = req.params;
  const { title, isCompleted } = req.body;

  const subTask = await SubTask.findById(subTaskId);
  if (!subTask) {
    throw new Apierror(404, "Subtask not found");
  }

  const task = await Task.findOne({ _id: subTask.task, project: projectId });
  if (!task) {
    throw new Apierror(404, "Subtask does not belong to this project");
  }

  const role = req.projectMember?.role;
  const isAdmin =
    role === UserRolesEnum.ADMIN || role === UserRolesEnum.PROJECT_ADMIN;

  if (!isAdmin && (title !== undefined || isCompleted === undefined)) {
    throw new Apierror(
      403,
      "Members can only update the completion status of a subtask",
    );
  }

  if (title !== undefined) subTask.title = title;
  if (isCompleted !== undefined) {
    if (typeof isCompleted !== "boolean") {
      throw new Apierror(400, "isCompleted must be a boolean");
    }
    subTask.isCompleted = isCompleted;
  }

  await subTask.save();

  const updatedSubTask = await SubTask.findById(subTask._id).populate(
    "createdBy",
    "username fullname avatar",
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedSubTask, "Subtask updated successfully"));
});

const deleteSubTask = asyncHandler(async (req, res) => {
  const { projectId, subTaskId } = req.params;

  const subTask = await SubTask.findById(subTaskId);
  if (!subTask) {
    throw new Apierror(404, "Subtask not found");
  }

  const task = await Task.findOne({ _id: subTask.task, project: projectId });
  if (!task) {
    throw new Apierror(404, "Subtask does not belong to this project");
  }

  await subTask.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, subTask, "Subtask deleted successfully"));
});

export {
  createSubTask,
  deleteSubTask,
  updateSubTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  createTask,
};
