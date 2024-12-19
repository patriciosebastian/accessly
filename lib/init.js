import inquirer from 'inquirer'
import { loadConfig, saveConfig, validateConfig, DEFAULT_CONFIG_PATH } from './config.js'
import { stat } from 'fs/promises'
import chalk from 'chalk'

async function configExists() {
  try {
    await stat(DEFAULT_CONFIG_PATH);
    return true;
  } catch (error) {
    return false;
  }
}

export async function initCommand(options = {}) {
  const exists = await configExists();

  if (exists && !options.force) {
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

  let config = {};

  // if non-interactive flags provided, skip prompts
  if (options.environment || options.apiEndpoint || options.logLevel || options.reportFormat || options.ciMode !== undefined) {
    config.environment = options.environment || 'development';
    config.apiEndpoint = options.apiEndpoint || 'https://api.example.com';
    config.logLevel = options.logLevel || 'info';
    config.rulesDir = options.rulesDir || './rules';
    config.reportFormat = options.reportFormat || 'json';
    config.ciMode = !!options.ciMode;
    config.annotations = options.annotations !== undefined ? !!options.annotations : true;
    config.ariaSuggestions = options.ariaSuggestions !== undefined ? !!options.ariaSuggestions : true;
    config.aiSuggestions = options.aiSuggestions !== undefined ? !!options.aiSuggestions : false;
    config.reportingLevel = options.reportingLevel || 'errorsAndWarnings';
  } else {
    // Interactive mode
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
        choices: ['debug', 'info', 'warn', 'error'],
        default: 'info'
      },
      {
        type: 'input',
        name: 'rulesDir',
        message: 'Path to rules directory:',
        default: './rules'
      },
      {
        type: 'list',
        name: 'reportFormat',
        message: 'Select the default report format:',
        choices: ['json', 'html', 'text'],
        default: 'json'
      },
      {
        type: 'confirm',
        name: 'ciMode',
        message: 'Enable CI mode (true/false)?',
        default: false
      }
    ]);

    config = {
      environment: answers.environment,
      apiEndpoint: answers.apiEndpoint,
      logLevel: answers.logLevel,
      rulesDir: answers.rulesDir,
      reportFormat: answers.reportFormat,
      ciMode: answers.ciMode,
      annotations: true,
      ariaSuggestions: true,
      aiSuggestions: false,
      reportingLevel: 'errorsAndWarnings'
    };
  }

  // Validate before saving
  try {
    validateConfig(config);
    saveConfig(config);
    console.log(chalk.green(`Configuration saved to ${DEFAULT_CONFIG_PATH}`));
  } catch (err) {
    console.error(chalk.red(`Configuration validation failed: ${err.message}`));
  }
}
