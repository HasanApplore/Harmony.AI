import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json({ limit: '250mb' })); // Increased limit for large file uploads
app.use(express.urlencoded({ extended: false, limit: '250mb' })); // Increased limit for large file uploads

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    let errorDetails = undefined;

    // Log the full error for debugging
    console.error('Server error:', err);
    
    // Handle database connection errors specifically
    if (err.message && (err.message.includes('database') || err.message.includes('connection'))) {
      message = "Database connection error";
      errorDetails = "There was a problem connecting to the database. Please try again later.";
      
      // Log additional information for database errors
      console.error('Database connection error details:', {
        message: err.message,
        code: err.code,
        stack: err.stack
      });
    }

    // Send a more user-friendly response
    res.status(status).json({ 
      message, 
      error: errorDetails,
      success: false
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use environment port or find an available port
  // this serves both the API and the client.
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      log(`Port ${port} is already in use, trying port ${port + 1}`);
      server.listen({
        port: port + 1,
        host: "0.0.0.0",
      }, () => {
        log(`serving on port ${port + 1}`);
      });
    } else {
      throw err;
    }
  });
  
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
