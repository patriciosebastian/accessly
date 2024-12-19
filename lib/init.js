import inquirer from 'inquirer'
import { saveConfig, validateConfig, DEFAULT_CONFIG_PATH } from './config'
import fs from 'fs'

export async function initCommand(options = {}) {
  // Check if config already exists
  if (fs.existsSync(DEFAULT_CONFIG_PATH) && !options.force) {
    const { overwrite } = await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: 'Configuration file already exists. Overwrite?',
      default: false
    }]);

    if (!overwrite) {
      console.log('Initialization aborted.');
      return;
    }
  }

  // Prompt user for initial settings
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'environment',
      message: 'Select environment:',
      choices: ['development', 'staging', 'production'],
      default: 'development'
    },
    {
      type: 'input',
      name: 'apiEndpoint',
      message: 'Enter the API endpoint URL:',
      default: 'https://api.example.com'
    },
    {
      type: 'list',
      name: 'logLevel',
      message: 'Select the default log level:',
      choices: ['error', 'warn', 'info', 'debug'],
      default: 'info'
    }
  ]);

  const config = {
    environment: answers.environment,
    apiEndpoint: answers.apiEndpoint,
    logLevel: answers.logLevel
  };

  // Validate before saving
  try {
    validateConfig(config);
    saveConfig(config);
    console.log(`Configuration saved to ${DEFAULT_CONFIG_PATH}`);
  } catch (err) {
    console.error(`Error saving config: ${err.message}`);
  }
}
