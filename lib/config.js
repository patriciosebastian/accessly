import fs from 'fs/promises'

const DEFAULT_CONFIG = {
  annotations: true,
  ariaSuggestions: true,
  aiSuggestions: false,
  reportingLevel: 'errorsAndWarnings',
};

export async function loadConfig() {
  try {
    const data = await fs.readFile('accessly.config.json', 'utf8');
    return JSON.parse(data);
  } catch {
    return DEFAULT_CONFIG; // Fallback to defaults
  }
}

export async function saveConfig(config) {
  await fs.writeFile('accessly.config.json', JSON.stringify(config, null, 2), 'utf8');
}
