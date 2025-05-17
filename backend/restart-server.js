const { spawn, exec } = require('child_process');
const process = require('process');

console.log('Finding running Node.js server processes...');

// Find running server process
exec('ps aux | grep node | grep server.js | grep -v grep', (error, stdout, stderr) => {
  if (error) {
    console.log('No running server process found, starting a new one...');
    startServer();
    return;
  }

  // Parse output to get the process ID
  const lines = stdout.trim().split('\n');
  if (lines.length === 0) {
    console.log('No running server process found, starting a new one...');
    startServer();
    return;
  }

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 2) {
      const pid = parts[1];
      console.log(`Found server process with PID ${pid}, killing it...`);
      
      // Kill the process
      exec(`kill -9 ${pid}`, (killError) => {
        if (killError) {
          console.error(`Failed to kill process ${pid}:`, killError);
        } else {
          console.log(`Process ${pid} killed successfully.`);
        }
        
        // Wait a moment before starting the new server
        setTimeout(() => {
          startServer();
        }, 1000);
      });
      
      return;
    }
  }
  
  console.log('No running server process found, starting a new one...');
  startServer();
});

function startServer() {
  console.log('Starting server...');
  
  // Using spawn to keep the new process running
  const serverProcess = spawn('node', ['server.js'], {
    detached: true,
    stdio: 'inherit'
  });
  
  serverProcess.on('error', (error) => {
    console.error('Failed to start server:', error);
  });
  
  // Let the child process run independently from the parent
  serverProcess.unref();
  
  console.log('Server started. You may need to wait a moment for it to initialize.');
} 