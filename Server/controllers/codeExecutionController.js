const logger = require('../config/logger');
const { AppError } = require('../middleware/errorHandler');
const { getExecutionLimits } = require('../middleware/codeExecutionSecurity');

// Use node-fetch for older Node versions, or native fetch for Node 18+
let fetch;
try {
  fetch = global.fetch || require('node-fetch');
} catch (e) {
  // Fallback to axios if fetch is not available
  const axios = require('axios');
  fetch = async (url, options) => {
    const response = await axios({
      url,
      method: options.method || 'GET',
      headers: options.headers,
      data: options.body,
      timeout: options.signal ? 10000 : undefined,
      validateStatus: () => true
    });
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      json: async () => response.data,
      text: async () => JSON.stringify(response.data)
    };
  };
}

// Piston API base URL
const PISTON_API_URL = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston';

// Execute code via Piston API with security limits
const executeCode = async (req, res) => {
  const startTime = Date.now();
  const { language, code, version } = req.validatedCode;
  const limits = getExecutionLimits();

  try {
    // Create timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      logger.warn('Code execution timeout', {
        language,
        codeLength: code.length,
        timeout: limits.timeout
      });
    }, limits.timeout);

    // Prepare request to Piston API
    const pistonRequest = {
      language: language,
      version: version,
      files: [
        {
          content: code
        }
      ],
      stdin: req.body.stdin || '',
      args: req.body.args || [],
      compile_timeout: Math.min(limits.timeout, 10000), // Compile timeout
      run_timeout: limits.timeout,
      compile_memory_limit: limits.memory,
      run_memory_limit: limits.memory
    };

    logger.info('Executing code', {
      language,
      version,
      codeLength: code.length,
      timeout: limits.timeout
    });

    // Execute code with timeout
    const response = await fetch(`${PISTON_API_URL}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pistonRequest),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Piston API error', {
        status: response.status,
        error: errorText
      });
      throw new AppError('Code execution service unavailable', 503);
    }

    const result = await response.json();
    const executionTime = Date.now() - startTime;

    // Log execution
    logger.info('Code execution completed', {
      language,
      executionTime,
      hasOutput: !!result.run?.output,
      hasError: !!result.run?.stderr
    });

    // Check for execution errors
    if (result.run?.stderr && result.run.stderr.trim()) {
      logger.warn('Code execution produced errors', {
        language,
        stderr: result.run.stderr.substring(0, 200) // Log first 200 chars
      });
    }

    // Check execution time
    if (executionTime > limits.timeout * 0.9) {
      logger.warn('Code execution took close to timeout', {
        language,
        executionTime,
        timeout: limits.timeout
      });
    }

    // Sanitize response
    const sanitizedResult = {
      language: result.language,
      version: result.version,
      run: {
        stdout: result.run?.stdout || '',
        stderr: result.run?.stderr || '',
        output: result.run?.output || '',
        code: result.run?.code || 0,
        signal: result.run?.signal || null
      },
      compile: result.compile ? {
        stdout: result.compile.stdout || '',
        stderr: result.compile.stderr || '',
        output: result.compile.output || '',
        code: result.compile.code || 0,
        signal: result.compile.signal || null
      } : null,
      executionTime: executionTime
    };

    // Remove sensitive information
    delete sanitizedResult.run.signal;
    delete sanitizedResult.compile?.signal;

    res.status(200).json(sanitizedResult);
  } catch (error) {
    const executionTime = Date.now() - startTime;

    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      logger.error('Code execution timeout', {
        language,
        executionTime,
        timeout: limits.timeout
      });
      throw new AppError('Code execution timed out. Please optimize your code.', 408);
    }

    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Code execution error', {
      language,
      error: error.message,
      executionTime
    });

    throw new AppError('Code execution failed. Please try again.', 500);
  }
};

module.exports = {
  executeCode
};

