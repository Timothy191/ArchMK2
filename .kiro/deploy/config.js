#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const PROJ = '/home/timothy/Project/Arch-Mk2';
const ENV_DIR = path.join(PROJ, '.kiro', 'deploy', 'environments');

const ENVIRONMENTS = ['development', 'staging', 'production'];

function loadEnv(name) {
  const file = path.join(ENV_DIR, `${name}.json`);
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return {}; }
}

function currentEnv() {
  return process.env.KIRO_ENV || 'development';
}

const config = {
  get(key) {
    const env = currentEnv();
    const envConfig = loadEnv(env);
    const parts = key.split('.');
    let val = envConfig;
    for (const p of parts) {
      if (val && typeof val === 'object') val = val[p];
      else return null;
    }
    return val ?? null;
  },

  all() {
    const env = currentEnv();
    return { environment: env, ...loadEnv(env) };
  },

  environments() {
    const result = {};
    for (const env of ENVIRONMENTS) {
      result[env] = loadEnv(env);
    }
    return result;
  }
};

if (require.main === module) {
  const cmd = process.argv[2] || 'current';
  switch (cmd) {
    case 'current':
      console.log(JSON.stringify({ env: currentEnv(), ...config.all() }, null, 2));
      break;
    case 'get':
      console.log(JSON.stringify({ value: config.get(process.argv[3] || '') }));
      break;
    case 'list':
      console.log(JSON.stringify(config.environments(), null, 2));
      break;
    default:
      console.log('Usage: deploy-config current|get <key>|list');
  }
}

module.exports = config;
