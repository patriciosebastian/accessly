import fs from 'fs/promises'

const testPath = '../index.html';
fs.readFile(testPath, 'utf8').then(html => console.log('testPath:', html)).catch(console.error);

const testpath2 = 'index.html';
fs.readFile(testpath2, 'utf8').then(html => console.log('testPath2:', html)).catch(console.error);

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
