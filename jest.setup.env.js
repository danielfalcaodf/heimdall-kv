// jest.setup.env.js — carrega .env.test para desenvolvimento local (sem dependências externas)
// Em CI, as variáveis são injetadas via secrets/vars do GitHub Actions.
const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '.env.test');
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  }
}
