import { readFile, writeFile, stat } from 'fs/promises'
import path from 'path'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const DEFAULT_CONFIG_PATH = path.join(process.cwd(), 'accessly.config.json');

const schema = {
  type: 'object',
  properties: {
    environment: { type: 'string', enum: ['development', 'staging', 'production'] },
    apiEndpoint: { type: 'string', format: 'uri' },
    logLevel: { type: 'string', enum: ['debug', 'info', 'warn', 'error'] },
    rulesDir: { type: 'string' },
    reportFormat: { type: 'string', enum: ['json', 'html', 'text'], default: 'json' },
    ciMode: { type: 'boolean', default: false },
    annotations: { type: 'boolean', default: true },
    ariaSuggestions: { type: 'boolean', default: true },
    aiSuggestions: { type: 'boolean', default: false },
    reportingLevel: { type: 'string', enum: ['errorsOnly', 'errorsAndWarnings'], default: 'errorsAndWarnings' }
  },
  required: ['environment', 'apiEndpoint'],
  additionalProperties: false
};

const DEFAULT_CONFIG = {
  environment: 'development',
  apiEndpoint: 'https://api.example.com',
  logLevel: 'info',
  rulesDir: './rules',
  reportFormat: 'json',
  ciMode: false,
  annotations: true,
  ariaSuggestions: true,
  aiSuggestions: false,
  reportingLevel: 'errorsAndWarnings',
};

async function configExists(configPath) {
  try {
    await stat(configPath);
    return true;
  } catch {
    return false;
  }
}

export async function loadConfig(configPath = DEFAULT_CONFIG_PATH) {
  const exists = await configExists(configPath);

  if (!exists) {
    return null;
  }

  try {
    const data = await readFile(configPath, 'utf8');
    const config = JSON.parse(data);

    return config;
  } catch (err) {
    console.warn(`Failed to readparse config. Using defaults. Error: ${err.message}`);
    return DEFAULT_CONFIG;
  }
}

export function validateConfig(config) {
  const ajv = new Ajv({ useDefaults: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const valid = validate(config);

  if (!valid) {
    const errors = validate.errors.map(e => `${e.instancePath} ${e.message}`).join(', ');
    throw new Error(`Configuration validation failed: ${errors}`);
  }
}

export async function saveConfig(config, configPath = DEFAULT_CONFIG_PATH) {
  const jsonContent = JSON.stringify(config, null, 2);
  await writeFile(configPath, jsonContent, 'utf8');
}
