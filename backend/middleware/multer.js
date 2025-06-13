const multer = require('multer');
const { allowedFileTypes, maxFileSize } = require('../utils/fileUpload');
const ErrorResponse = require('../utils/errorResponse');

// Configure multer memory storage (files will be in memory as buffers)
const storage = multer.memoryStorage();

// File filter to only allow specific file types
const fileFilter = (req, file, cb) => {
  if (allowedFileTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(
      new ErrorResponse(
        `Invalid file type. Allowed types: ${Object.keys(allowedFileTypes).join(', ')}`,
        400
      ),
      false
    );
  }
};

// Configure multer with file size limits and filter
const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSize,
  },
  fileFilter,
});

// Middleware factory to handle single file uploads
const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);
    
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new ErrorResponse(
              `File too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB`,
              400
            )
          );
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new ErrorResponse(`Unexpected field: ${err.field}`, 400));
        }
        return next(err);
      }
      next();
    });
  };
};

// Middleware factory to handle multiple file uploads
const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.array(fieldName, maxCount);
    
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new ErrorResponse(
              `One or more files exceed the size limit of ${maxFileSize / (1024 * 1024)}MB`,
              400
            )
          );
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new ErrorResponse(`Unexpected field: ${err.field}`, 400));
        } else if (err.code === 'LIMIT_FILE_COUNT') {
          return next(
            new ErrorResponse(`Maximum ${maxCount} files allowed per upload`, 400)
          );
        }
        return next(err);
      }
      next();
    });
  };
};

// Middleware factory to handle fields with file uploads
const uploadFields = (fields) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.fields(fields);
    
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new ErrorResponse(
              `One or more files exceed the size limit of ${maxFileSize / (1024 * 1024)}MB`,
              400
            )
          );
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new ErrorResponse(`Unexpected field: ${err.field}`, 400));
        } else if (err.code === 'LIMIT_FIELD_KEY') {
          return next(new ErrorResponse('Field name too long', 400));
        } else if (err.code === 'LIMIT_FIELD_VALUE') {
          return next(new ErrorResponse('Field value too long', 400));
        } else if (err.code === 'LIMIT_FIELD_COUNT') {
          return next(new ErrorResponse('Too many fields', 400));
        } else if (err.code === 'LIMIT_PART_COUNT') {
          return next(new ErrorResponse('Too many parts', 400));
        }
        return next(err);
      }
      next();
    });
  };
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFields,
};
