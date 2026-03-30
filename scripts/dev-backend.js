const { spawn } = require('child_process');
const path = require('path');

const backendDir = path.join(__dirname, '..', 'backend');
const python = process.platform === 'win32'
  ? path.join(backendDir, 'venv', 'Scripts', 'python')
  : path.join(backendDir, 'venv', 'bin', 'python');

const proc = spawn(python, ['-m', 'flask', '--app', 'app.main', 'run', '--reload'], {
  stdio: 'inherit',
  cwd: backendDir,
});

proc.on('exit', (code) => process.exit(code ?? 0));
