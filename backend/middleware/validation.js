const { celebrate, Joi, Segments, isCelebrateError } = require('celebrate');
const { ErrorResponse } = require('../utils/errorResponse');
const logger = require('../utils/logger');
const { Types } = require('mongoose');

// Common validation patterns
const patterns = {
  objectId: /^[0-9a-fA-F]{24}$/,
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  phone: /^\+?[1-9]\d{1,14}$/,
  currency: /^\d+(\.\d{1,2})?$/,
  date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/,
  time: /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/,
  hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/,
  ipAddress: /^(\d{1,3}\.){3}\d{1,3}$/,
  zipCode: /^\d{5}(-\d{4})?$/
};

// Custom validation methods
const customValidators = {
  isObjectId: (value, helpers) => {
    if (!Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  },
  isStrongPassword: (value, helpers) => {
    if (!patterns.password.test(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  },
  isFutureDate: (value, helpers) => {
    const inputDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate > today ? helpers.error('date.future') : value;
  }
};

// Extend Joi with custom validators
const extendedJoi = Joi.extend((joi) => ({
  type: 'string',
  base: joi.string(),
  messages: {
    'string.objectId': '{{#label}} must be a valid MongoDB ObjectId',
    'string.strongPassword': '{{#label}} must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character',
    'date.future': '{{#label}} cannot be in the future'
  },
  rules: {
    objectId: {
      validate(value, helpers) {
        return customValidators.isObjectId(value, helpers) || value;
      }
    },
    strongPassword: {
      validate(value, helpers) {
        return customValidators.isStrongPassword(value, helpers) || value;
      }
    }
  }
}));

// Common validation schemas
const schemas = {
  // Transaction validation schema
  transaction: extendedJoi.object({
    amount: extendedJoi.number()
      .positive()
      .precision(2)
      .required()
      .messages({
        'number.base': 'Amount must be a number',
        'number.positive': 'Amount must be greater than 0',
        'number.precision': 'Amount can have up to 2 decimal places',
        'any.required': 'Amount is required'
      }),

    type: extendedJoi.string()
      .valid('income', 'expense')
      .required()
      .messages({
        'string.base': 'Type must be a string',
        'any.only': 'Type must be either income or expense',
        'any.required': 'Type is required'
      }),

    category: extendedJoi.string()
      .trim()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.base': 'Category must be a string',
        'string.empty': 'Category is required',
        'string.min': 'Category must be at least 2 characters long',
        'string.max': 'Category cannot be longer than 50 characters',
        'any.required': 'Category is required'
      }),

    description: extendedJoi.string()
      .trim()
      .min(3)
      .max(500)
      .required()
      .messages({
        'string.base': 'Description must be a string',
        'string.empty': 'Description is required',
        'string.min': 'Description must be at least 3 characters long',
        'string.max': 'Description cannot be longer than 500 characters',
        'any.required': 'Description is required'
      }),

    date: extendedJoi.date()
      .iso()
      .max('now')
      .required()
      .messages({
        'date.base': 'Invalid date format',
        'date.format': 'Date must be in ISO 8601 format (YYYY-MM-DD)',
        'date.max': 'Date cannot be in the future',
        'any.required': 'Date is required'
      })
  }),

  // User validation schema
  user: extendedJoi.object({
    name: extendedJoi.string()
      .trim()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.base': 'Name must be a string',
        'string.empty': 'Name is required',
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot be longer than 100 characters',
        'any.required': 'Name is required'
      }),

    email: extendedJoi.string()
      .email()
      .required()
      .messages({
        'string.base': 'Email must be a string',
        'string.email': 'Please include a valid email',
        'string.empty': 'Email is required',
        'any.required': 'Email is required'
      }),

    password: extendedJoi.string()
      .min(8)
      .max(100)
      .strongPassword()
      .required()
      .messages({
        'string.base': 'Password must be a string',
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password cannot be longer than 100 characters',
        'any.required': 'Password is required',
        'string.strongPassword': 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'
      }),

    confirmPassword: extendedJoi.string()
      .valid(extendedJoi.ref('password'))
      .required()
      .messages({
        'any.only': 'Passwords do not match',
        'any.required': 'Please confirm your password'
      })
      .strip(),

    role: extendedJoi.string()
      .valid('user', 'admin')
      .default('user')
      .messages({
        'any.only': 'Role must be either user or admin'
      }),

    phone: extendedJoi.string()
      .pattern(patterns.phone)
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),

    address: extendedJoi.object({
      street: extendedJoi.string().trim().max(100),
      city: extendedJoi.string().trim().max(50),
      state: extendedJoi.string().trim().max(50),
      country: extendedJoi.string().trim().max(50),
      zipCode: extendedJoi.string().pattern(patterns.zipCode)
    }).optional()
  }),

  // Authentication schema
  auth: extendedJoi.object({
    email: extendedJoi.string()
      .email()
      .required()
      .messages({
        'string.base': 'Email must be a string',
        'string.email': 'Please include a valid email',
        'string.empty': 'Email is required',
        'any.required': 'Email is required'
      }),

    password: extendedJoi.string()
      .required()
      .messages({
        'string.base': 'Password must be a string',
        'string.empty': 'Password is required',
        'any.required': 'Password is required'
      })
  }),

  // ID parameter schema
  idParam: extendedJoi.object({
    id: extendedJoi.string()
      .pattern(patterns.objectId)
      .required()
      .messages({
        'string.pattern.base': 'Invalid ID format',
        'any.required': 'ID is required'
      })
  }),

  // ID parameter schema
  idParam: extendedJoi.object({
    id: extendedJoi.string()
      .pattern(patterns.objectId)
      .required()
      .messages({
        'string.pattern.base': 'Invalid ID format',
        'any.required': 'ID is required'
      })
  }),

  // Pagination query schema
  pagination: extendedJoi.object({
    page: extendedJoi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
      }),

    limit: extendedJoi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      }),

    sort: extendedJoi.string()
      .pattern(/^[a-zA-Z0-9_,. ]+$/)
      .optional()
      .messages({
        'string.pattern.base': 'Invalid sort format'
      }),

    search: extendedJoi.string()
      .trim()
      .max(100)
      .optional()
  }),

  // Category schema
  category: extendedJoi.object({
    name: extendedJoi.string()
      .trim()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.base': 'Name must be a string',
        'string.empty': 'Name is required',
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot be longer than 50 characters',
        'any.required': 'Name is required'
      }),
    
    type: extendedJoi.string()
      .valid('income', 'expense')
      .required()
      .messages({
        'string.base': 'Type must be a string',
        'any.only': 'Type must be either income or expense',
        'any.required': 'Type is required'
      }),
      
    icon: extendedJoi.string()
      .trim()
      .max(50)
      .optional()
      .messages({
        'string.base': 'Icon must be a string',
        'string.max': 'Icon cannot be longer than 50 characters'
      }),
      
    color: extendedJoi.string()
      .pattern(patterns.hexColor)
      .optional()
      .messages({
        'string.pattern.base': 'Color must be a valid hex color code'
      }),
      
    isDefault: extendedJoi.boolean()
      .default(false)
  })
};

// Validation middleware for different routes
const validate = {
  // Transaction validation
  createTransaction: celebrate({
    [Segments.BODY]: schemas.transaction
  }, { 
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  }),

  updateTransaction: celebrate({
    [Segments.PARAMS]: schemas.idParam,
    [Segments.BODY]: schemas.transaction
  }, { 
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  }),

  getTransaction: celebrate({
    [Segments.PARAMS]: schemas.idParam
  }),

  deleteTransaction: celebrate({
    [Segments.PARAMS]: schemas.idParam
  }),

  // User validation
  createUser: celebrate({
    [Segments.BODY]: Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      role: Joi.string().valid('user', 'admin').default('user')
    })
  }, { 
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  }),

  updateUser: celebrate({
    [Segments.BODY]: Joi.object({
      name: Joi.string(),
      email: Joi.string().email()
    }).min(1)
  }),



  // Auth validation
  login: celebrate({
    [Segments.BODY]: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    })
  }, { 
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  }),

  // Password reset validation
  forgotPassword: celebrate({
    [Segments.BODY]: Joi.object({
      email: Joi.string().email().required()
    })
  }),

  resetPassword: celebrate({
    [Segments.PARAMS]: Joi.object({
      resettoken: Joi.string().required()
    }),
    [Segments.BODY]: Joi.object({
      password: Joi.string().min(8).required(),
      confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    })
  }),

  updatePassword: celebrate({
    [Segments.BODY]: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(8).required(),
      confirmNewPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    })
  }),

  // Pagination
  list: celebrate({
    [Segments.QUERY]: schemas.pagination
  }),
  
  // Category validations
  createCategory: celebrate({
    [Segments.BODY]: schemas.category
  }),
  
  updateCategory: celebrate({
    [Segments.PARAMS]: schemas.idParam,
    [Segments.BODY]: schemas.category.keys({
      name: schemas.category.extract('name').optional(),
      type: schemas.category.extract('type').optional(),
      icon: schemas.category.extract('icon').optional(),
      color: schemas.category.extract('color').optional(),
      isDefault: schemas.category.extract('isDefault').optional()
    }).min(1) // At least one field must be provided for update
  }),
  
  getCategory: celebrate({
    [Segments.PARAMS]: schemas.idParam
  }),
  
  deleteCategory: celebrate({
    [Segments.PARAMS]: schemas.idParam
  }),
  
  getCategoriesByType: celebrate({
    [Segments.PARAMS]: extendedJoi.object({
      type: extendedJoi.string().valid('income', 'expense').required()
    })
  })
};

// Enhanced error formatter for celebrate
const errorFormatter = (error, req, res, next) => {
  if (!isCelebrateError(error)) {
    return next(error);
  }

  const errors = {};
  
  // Process all validation errors
  for (const [segment, joiError] of error.details.entries()) {
    if (!errors[segment]) {
      errors[segment] = [];
    }
    
    joiError.details.forEach(detail => {
      const field = detail.path.join('.');
      const message = detail.message.replace(/['"]/g, '');
      
      // Log validation errors for monitoring
      logger.warn('Validation error', {
        field,
        message,
        value: detail.context?.value,
        path: detail.path,
        type: detail.type,
        timestamp: new Date().toISOString(),
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip
      });

      errors[segment].push({ field, message });
    });
  }

  return next(new ErrorResponse(
    'Validation failed. Please check your input and try again.',
    400,
    { errors },
    'VALIDATION_ERROR'
  ));
};

// Sanitize middleware to prevent XSS and NoSQL injection
const sanitizeInput = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Basic XSS prevention
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/\bon\w+=([\"']).*?\1/gi, '');
      }
    });
  }

  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/\bon\w+=([\"']).*?\1/gi, '');
      }
    });
  }

  next();
};

module.exports = {
  validate,
  schemas,
  errorFormatter,
  sanitizeInput,
  patterns
};