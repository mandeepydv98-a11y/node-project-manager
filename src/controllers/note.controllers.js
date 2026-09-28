import mongoose from "mongoose";
import { ProjectNote } from "../models/note.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { Apierror } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

const getNotes = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const notes = await ProjectNote.find({ project: projectId })
    .populate("createdBy", "username fullname avatar")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, notes, "Project notes fetched successfully"));
});

const createNote = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { content } = req.body;

  const note = await ProjectNote.create({
    project: projectId,
    createdBy: req.user._id,
    content,
  });

  const createdNote = await ProjectNote.findById(note._id).populate(
    "createdBy",
    "username fullname avatar",
  );

  return res
    .status(201)
    .json(new ApiResponse(201, createdNote, "Note created successfully"));
});

const getNoteById = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;

  if (!mongoose.isValidObjectId(noteId)) {
    throw new Apierror(400, "Invalid note id");
  }

  const note = await ProjectNote.findOne({
    _id: noteId,
    project: projectId,
  }).populate("createdBy", "username fullname avatar");

  if (!note) {
    throw new Apierror(404, "Note not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, note, "Note fetched successfully"));
});

const updateNote = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;
  const { content } = req.body;

  const note = await ProjectNote.findOneAndUpdate(
    { _id: noteId, project: projectId },
    { content },
    { new: true, runValidators: true },
  ).populate("createdBy", "username fullname avatar");

  if (!note) {
    throw new Apierror(404, "Note not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, note, "Note updated successfully"));
});

const deleteNote = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;
  const note = await ProjectNote.findOneAndDelete({
    _id: noteId,
    project: projectId,
  });

  if (!note) {
    throw new Apierror(404, "Note not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, note, "Note deleted successfully"));
});

export { getNotes, createNote, getNoteById, updateNote, deleteNote };
