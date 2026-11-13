const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const envFile = path.join(projectRoot, '.env');

if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const [command, ...args] = process.argv.slice(2);
const commandsWithApiUrl = new Set(['build', 'serve']);
const apiUrl = (process.env.API_URL ?? '/api/auth/login').trim();

if (commandsWithApiUrl.has(command)) {
  if (!apiUrl) {
    console.error('API_URL no puede estar vacío en el archivo .env.');
    process.exit(1);
  }
  args.unshift(`--define=__API_URL__=${JSON.stringify(apiUrl)}`);
}

const angularCli = path.join(projectRoot, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
const child = spawn(process.execPath, [angularCli, command, ...args], {
  cwd: projectRoot,
  stdio: 'inherit',
});

child.on('error', (error) => {
  console.error('No se pudo ejecutar Angular CLI:', error.message);
  process.exitCode = 1;
});

child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
