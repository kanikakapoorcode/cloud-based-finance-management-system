const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ErrorResponse = require('./errorResponse');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Allowed file types
const allowedFileTypes = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

// Max file size (5MB)
const maxFileSize = 5 * 1024 * 1024;

/**
 * Upload a file to the server
 * @param {Object} file - Multer file object
 * @param {string} subfolder - Subfolder within uploads directory (e.g., 'avatars', 'receipts')
 * @returns {Promise<Object>} - Object containing file information
 */
const uploadFile = (file, subfolder = 'misc') => {
  return new Promise((resolve, reject) => {
    try {
      // Check if file exists
      if (!file) {
        return reject(new ErrorResponse('No file uploaded', 400));
      }

      // Check file type
      const fileType = file.mimetype;
      if (!allowedFileTypes[fileType]) {
        return reject(
          new ErrorResponse(
            `Invalid file type. Allowed types: ${Object.keys(allowedFileTypes).join(', ')}`,
            400
          )
        );
      }

      // Check file size
      if (file.size > maxFileSize) {
        return reject(
          new ErrorResponse(
            `File too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB`,
            400
          )
        );
      }


      // Create subfolder if it doesn't exist
      const subfolderPath = path.join(uploadsDir, subfolder);
      if (!fs.existsSync(subfolderPath)) {
        fs.mkdirSync(subfolderPath, { recursive: true });
      }

      // Generate unique filename
      const fileExt = allowedFileTypes[fileType];
      const filename = `${uuidv4()}.${fileExt}`;
      const filepath = path.join(subfolderPath, filename);

      // Move file to uploads directory
      fs.writeFile(filepath, file.buffer, (err) => {
        if (err) {
          console.error('Error saving file:', err);
          return reject(new ErrorResponse('Error saving file', 500));
        }

        // Return file information
        resolve({
          filename,
          filepath: `/uploads/${subfolder}/${filename}`,
          mimetype: fileType,
          size: file.size,
        });
      });
    } catch (error) {
      console.error('File upload error:', error);
      reject(new ErrorResponse('Error uploading file', 500));
    }
  });
};

/**
 * Delete a file from the server
 * @param {string} filepath - Relative file path from public directory
 * @returns {Promise<boolean>} - True if file was deleted, false if it didn't exist
 */
const deleteFile = (filepath) => {
  return new Promise((resolve) => {
    try {
      const fullPath = path.join(__dirname, '../public', filepath);
      
      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        return resolve(false);
      }

      // Delete file
      fs.unlink(fullPath, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
          return resolve(false);
        }
        resolve(true);
      });
    } catch (error) {
      console.error('File deletion error:', error);
      resolve(false);
    }
  });
};

/**
 * Middleware to handle file uploads
 * @param {string} fieldName - Name of the file field in the form
 * @param {string} subfolder - Subfolder to store the uploaded file
 * @returns {Function} Express middleware function
 */
const handleFileUpload = (fieldName, subfolder = 'misc') => {
  return (req, res, next) => {
    // Check if file exists in the request
    if (!req.file) {
      return next();
    }

    // Upload the file
    uploadFile(req.file, subfolder)
      .then((fileInfo) => {
        // Attach file info to request object
        req.fileInfo = fileInfo;
        next();
      })
      .catch((error) => {
        next(error);
      });
  };
};

module.exports = {
  uploadFile,
  deleteFile,
  handleFileUpload,
  maxFileSize,
  allowedFileTypes,
};
