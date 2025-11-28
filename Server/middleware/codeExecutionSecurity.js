const logger = require('../config/logger');
const { AppError } = require('./errorHandler');

// Allowed languages and their versions
const ALLOWED_LANGUAGES = {
  'python': ['3.10.0', '3.9.0'],
  'javascript': ['18.15.0', '18.14.0'],
  'java': ['15.0.2', '11.0.2'],
  'cpp': ['10.2.0', '9.3.0'],
  'c': ['10.2.0', '9.3.0'],
  'go': ['1.20.0', '1.19.0'],
  'rust': ['1.68.0', '1.67.0']
};

// Maximum code size (in characters)
const MAX_CODE_SIZE = 50000; // 50KB

// Maximum execution time (in milliseconds)
const MAX_EXECUTION_TIME = 10000; // 10 seconds

// Maximum memory limit (in bytes) - passed to Piston
const MAX_MEMORY_LIMIT = 128 * 1024 * 1024; // 128MB

// Maximum CPU time (in milliseconds)
const MAX_CPU_TIME = 5000; // 5 seconds

// Dangerous patterns to block
const DANGEROUS_PATTERNS = [
  // File system operations
  /import\s+os|require\(['"]fs['"]\)|require\(['"]path['"]\)/i,
  /open\(|file\(|read\(|write\(|delete\(|remove\(/i,
  /__import__\(['"]os['"]\)|__import__\(['"]sys['"]\)/i,
  
  // Network operations
  /import\s+urllib|import\s+requests|require\(['"]http['"]\)|require\(['"]https['"]\)|require\(['"]net['"]\)/i,
  /socket\.|http\.|https\.|fetch\(|XMLHttpRequest/i,
  
  // Process operations
  /process\.|exec\(|spawn\(|fork\(|child_process/i,
  /subprocess|Popen|system\(|popen\(/i,
  
  // Dangerous eval/exec
  /eval\(|exec\(|compile\(|__builtins__|__import__/i,
  
  // Database operations
  /mongoose|mongodb|mysql|postgres|sqlite/i,
  
  // Environment variables
  /process\.env|os\.environ|getenv\(/i,
  
  // Shell commands
  /shell|bash|sh|cmd|powershell/i
];

// Validate language
const validateLanguage = (language) => {
  if (!language || typeof language !== 'string') {
    throw new AppError('Language is required and must be a string', 400);
  }

  const normalizedLanguage = language.toLowerCase().trim();
  
  if (!ALLOWED_LANGUAGES[normalizedLanguage]) {
    throw new AppError(`Language '${language}' is not allowed. Allowed languages: ${Object.keys(ALLOWED_LANGUAGES).join(', ')}`, 400);
  }

  return normalizedLanguage;
};

// Validate code size
const validateCodeSize = (code) => {
  if (!code || typeof code !== 'string') {
    throw new AppError('Code is required and must be a string', 400);
  }

  if (code.length === 0) {
    throw new AppError('Code cannot be empty', 400);
  }

  if (code.length > MAX_CODE_SIZE) {
    throw new AppError(`Code size exceeds maximum limit of ${MAX_CODE_SIZE} characters`, 400);
  }

  return code;
};

// Check for dangerous patterns
const checkDangerousPatterns = (code, language) => {
  const normalizedCode = code.toLowerCase();
  
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(normalizedCode)) {
      logger.warn('Dangerous pattern detected in code', {
        pattern: pattern.toString(),
        language: language,
        codeLength: code.length
      });
      throw new AppError('Code contains potentially dangerous operations that are not allowed', 400);
    }
  }

  // Language-specific checks
  if (language === 'python') {
    // Block specific Python dangerous imports
    const pythonDangerous = [
      /import\s+subprocess/i,
      /import\s+shutil/i,
      /import\s+pickle/i,
      /import\s+ctypes/i
    ];
    
    for (const pattern of pythonDangerous) {
      if (pattern.test(code)) {
        throw new AppError('Code contains potentially dangerous Python operations', 400);
      }
    }
  }

  if (language === 'javascript' || language === 'node') {
    // Block specific Node.js dangerous modules
    const jsDangerous = [
      /require\(['"]child_process['"]\)/i,
      /require\(['"]cluster['"]\)/i,
      /require\(['"]worker_threads['"]\)/i
    ];
    
    for (const pattern of jsDangerous) {
      if (pattern.test(code)) {
        throw new AppError('Code contains potentially dangerous JavaScript operations', 400);
      }
    }
  }

  return true;
};

// Validate code execution request
const validateCodeExecution = (req, res, next) => {
  try {
    const { language, code, version } = req.body;

    // Validate language
    const validatedLanguage = validateLanguage(language);

    // Validate code
    const validatedCode = validateCodeSize(code);

    // Check for dangerous patterns
    checkDangerousPatterns(validatedCode, validatedLanguage);

    // Validate version if provided
    if (version) {
      const allowedVersions = ALLOWED_LANGUAGES[validatedLanguage];
      if (!allowedVersions.includes(version)) {
        throw new AppError(`Version '${version}' is not allowed for language '${validatedLanguage}'. Allowed versions: ${allowedVersions.join(', ')}`, 400);
      }
    }

    // Store validated values
    req.validatedCode = {
      language: validatedLanguage,
      code: validatedCode,
      version: version || ALLOWED_LANGUAGES[validatedLanguage][0] // Use first allowed version as default
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Get execution limits
const getExecutionLimits = () => {
  return {
    timeout: parseInt(process.env.MAX_EXECUTION_TIME) || MAX_EXECUTION_TIME,
    memory: parseInt(process.env.MAX_MEMORY_LIMIT) || MAX_MEMORY_LIMIT,
    cpu: parseInt(process.env.MAX_CPU_TIME) || MAX_CPU_TIME
  };
};

module.exports = {
  validateCodeExecution,
  getExecutionLimits,
  ALLOWED_LANGUAGES,
  MAX_CODE_SIZE,
  MAX_EXECUTION_TIME,
  MAX_MEMORY_LIMIT,
  MAX_CPU_TIME
};

