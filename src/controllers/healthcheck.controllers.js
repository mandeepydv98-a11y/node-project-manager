import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
/** 

const healthCheck = (req, res , next) => {
  try {
    res
      .status(200)
      .json(new ApiResponse(200, { message: "server is running" }));
  } catch (error) {
    next(err)
  }
};

*/

const healthCheck = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, { message: "server is running" }));
});

export { healthCheck };
