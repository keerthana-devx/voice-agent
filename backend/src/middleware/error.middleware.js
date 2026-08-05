export const errorHandler = (err, req, res, next) => {
  // Default to 500 server error
  const statusCode = err.statusCode || 500;

  // Prepare message
  let message = err.message || "Internal Server Error";

  // Mongoose validation error
  if (err.name === "ValidationError") {
    // Collect the first validation message
    const errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join(", ");
  }

  // Mongoose duplicate key error (E11000)
  if (err.code && err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(", ");
    message = `${field} already exists`;
    // Conflict
    return res.status(409).json({ success: false, message });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    message = `Invalid ${err.path}: ${err.value}`;
    return res.status(400).json({ success: false, message });
  }

  // Express-validator style errors (if passed as array)
  if (Array.isArray(err) && err.length) {
    message = err.map((e) => e.msg || e.message).join(", ");
    return res.status(400).json({ success: false, message });
  }

  // For other errors, don't leak stack in production
  if (process.env.NODE_ENV === "production") {
    return res.status(statusCode).json({ success: false, message });
  }

  // In development, include stack for debugging
  return res.status(statusCode).json({ success: false, message, stack: err.stack });
};
