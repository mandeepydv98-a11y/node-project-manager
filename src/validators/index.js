import { body } from "express-validator";
import { AvailableTaskStatus, AvailableUserRole } from "../utils/constants.js";

const userRegisterValidator = () => [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email is invalid")
    .normalizeEmail(),
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLowercase()
    .withMessage("Username must be in lowercase")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters"),
  body("password")
    .isString()
    .isLength({ min: 6, max: 72 })
    .withMessage("Password must be between 6 and 72 characters"),
  body("fullname").optional().trim().isLength({ max: 100 }),
  body("fullName").optional().trim().isLength({ max: 100 }),
];

const userLoginValidator = () => [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email is invalid")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const userChangeCurrentPasswordValidator = () => [
  body("oldPassword").notEmpty().withMessage("Old password is required"),
  body("newPassword")
    .isLength({ min: 6, max: 72 })
    .withMessage("New password must be between 6 and 72 characters"),
];

const userForgotPasswordValidator = () => [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email is invalid")
    .normalizeEmail(),
];

const userResetForgotPasswordValidator = () => [
  body("newPassword")
    .isLength({ min: 6, max: 72 })
    .withMessage("Password must be between 6 and 72 characters"),
];

const createProjectValidator = () => [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 120 })
    .withMessage("Name cannot exceed 120 characters"),
  body("description").optional().trim().isLength({ max: 5000 }),
];

const addMemberToProjectValidator = () => [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email is invalid")
    .normalizeEmail(),
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(AvailableUserRole)
    .withMessage("Role is invalid"),
];

const updateMemberRoleValidator = () => [
  body("newRole")
    .notEmpty()
    .withMessage("newRole is required")
    .isIn(AvailableUserRole)
    .withMessage("Role is invalid"),
];

const createTaskValidator = () => [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Task title is required")
    .isLength({ max: 200 })
    .withMessage("Task title cannot exceed 200 characters"),
  body("description").optional().trim().isLength({ max: 5000 }),
  body("assignedTo")
    .optional({ nullable: true })
    .custom((value) => value === "" || /^[0-9a-fA-F]{24}$/.test(value))
    .withMessage("Invalid assignee id"),
  body("status")
    .optional()
    .isIn(AvailableTaskStatus)
    .withMessage("Task status is invalid"),
];

const updateTaskValidator = () => [
  body("title").optional().trim().isLength({ min: 1, max: 200 }),
  body("description").optional().trim().isLength({ max: 5000 }),
  body("assignedTo")
    .optional({ nullable: true })
    .custom((value) => value === "" || /^[0-9a-fA-F]{24}$/.test(value))
    .withMessage("Invalid assignee id"),
  body("status")
    .optional()
    .isIn(AvailableTaskStatus)
    .withMessage("Task status is invalid"),
];

const createSubTaskValidator = () => [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Subtask title is required")
    .isLength({ max: 200 })
    .withMessage("Subtask title cannot exceed 200 characters"),
];

const updateSubTaskValidator = () => [
  body("title").optional().trim().isLength({ min: 1, max: 200 }),
  body("isCompleted")
    .optional()
    .isBoolean()
    .withMessage("isCompleted must be a boolean")
    .toBoolean(),
];

const noteValidator = () => [
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Note content is required")
    .isLength({ max: 10000 })
    .withMessage("Note cannot exceed 10000 characters"),
];

export {
  userRegisterValidator,
  userLoginValidator,
  userChangeCurrentPasswordValidator,
  userForgotPasswordValidator,
  userResetForgotPasswordValidator,
  createProjectValidator,
  addMemberToProjectValidator,
  updateMemberRoleValidator,
  createTaskValidator,
  updateTaskValidator,
  createSubTaskValidator,
  updateSubTaskValidator,
  noteValidator,
};
