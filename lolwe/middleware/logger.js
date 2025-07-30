const morgan = require('morgan');

// Custom token for user ID
morgan.token('user-id', (req) => {
  return req.user ? req.user._id : 'anonymous';
});

// Custom token for user role
morgan.token('user-role', (req) => {
  return req.user ? req.user.role : 'guest';
});

// Custom token for response time in ms
morgan.token('response-time-ms', (req, res) => {
  const responseTime = morgan['response-time'](req, res);
  return responseTime ? `${responseTime}ms` : '-';
});

// Development format with colors
const devFormat = ':method :url :status :response-time ms - :res[content-length] bytes - User: :user-id (:user-role)';

// Production format for structured logging
const prodFormat = JSON.stringify({
  timestamp: ':date[iso]',
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time',
  contentLength: ':res[content-length]',
  userAgent: ':user-agent',
  ip: ':remote-addr',
  userId: ':user-id',
  userRole: ':user-role'
});

// Create custom logger middleware
const createLogger = () => {
  if (process.env.NODE_ENV === 'production') {
    return morgan(prodFormat, {
      stream: {
        write: (message) => {
          try {
            const logData = JSON.parse(message.trim());
            console.log(JSON.stringify(logData));
          } catch (error) {
            console.log(message.trim());
          }
        }
      },
      skip: (req, res) => {
        // Skip logging for health checks and static assets
        return req.url === '/health' || 
               req.url.startsWith('/static/') ||
               res.statusCode < 400; // Only log errors in production
      }
    });
  } else {
    return morgan(devFormat, {
      skip: (req, res) => {
        // Skip logging for health checks in development
        return req.url === '/health';
      }
    });
  }
};

// Request details logger for debugging
const detailedLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request details
  console.log(`🔍 ${req.method} ${req.url}`, {
    headers: process.env.NODE_ENV === 'development' ? req.headers : {},
    query: req.query,
    params: req.params,
    body: req.method !== 'GET' ? req.body : undefined,
    user: req.user ? {
      id: req.user._id,
      role: req.user.role,
      email: req.user.email
    } : null,
    timestamp: new Date().toISOString()
  });

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body) {
    const duration = Date.now() - start;
    
    console.log(`📤 ${req.method} ${req.url} - ${res.statusCode}`, {
      duration: `${duration}ms`,
      status: res.statusCode,
      response: process.env.NODE_ENV === 'development' ? body : undefined,
      timestamp: new Date().toISOString()
    });
    
    return originalJson.call(this, body);
  };

  next();
};

// Error logger
const errorLogger = (err, req, res, next) => {
  console.error(`❌ Error in ${req.method} ${req.url}:`, {
    error: {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      user: req.user ? {
        id: req.user._id,
        role: req.user.role
      } : null
    },
    timestamp: new Date().toISOString()
  });

  next(err);
};

// Security logger for failed auth attempts
const securityLogger = (event, details) => {
  console.warn(`🔒 Security Event: ${event}`, {
    ...details,
    timestamp: new Date().toISOString()
  });
};

// Performance logger
const performanceLogger = (req, res, next) => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    if (duration > 1000) { // Log slow requests (> 1 second)
      console.warn(`⏱️  Slow request detected:`, {
        method: req.method,
        url: req.url,
        duration: `${duration.toFixed(2)}ms`,
        status: res.statusCode,
        user: req.user?.email || 'anonymous',
        timestamp: new Date().toISOString()
      });
    }
  });
  
  next();
};

module.exports = {
  createLogger,
  detailedLogger,
  errorLogger,
  securityLogger,
  performanceLogger
};