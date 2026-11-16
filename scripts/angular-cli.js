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
const apiBaseUrl = (process.env.API_BASE_URL ?? 'http://localhost:8080').trim().replace(/\/+$/, '');

if (commandsWithApiUrl.has(command)) {
  if (!apiBaseUrl) {
    console.error('API_BASE_URL no puede estar vacío en el archivo .env.');
    process.exit(1);
  }
  args.unshift(`--define=__API_BASE_URL__=${JSON.stringify(apiBaseUrl)}`);
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
