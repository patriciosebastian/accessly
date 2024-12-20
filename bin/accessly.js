#!/usr/bin/env node

import fs from 'fs/promises'
import { Command } from 'commander'
import chalk from 'chalk'
import { annotateHTML, auditHTML } from "../lib/engine.js"
import { loadConfig, validateConfig } from '../lib/config.js'
import { initCommand } from '../lib/init.js'
import { setLogLevel, logError, logDefault, logVerbose } from '../lib/logger.js'

const program = new Command();

program
  .name('accessly')
  .description('Accessly: An accessibility auditing tool')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize Accessly configuration')
  .option('-f, --force', 'Overwrite existing configuration without prompting')
  .option('--environment <env>')
  .option('--api-endpoint <url>')
  .option('--log-level <level>')
  .option('--report-format <format>')
  .option('--ci-mode', 'Enable CI mode')
  .action(async (opts) => {
    await initCommand(opts);
  });

program
  .command('validate')
  .description('Validate the current configuration file')
  .action(async () => {
    try {
      const config = await loadConfig();
      if (!config) {
        logError(chalk.red('No configuration file found Try running `accessly init` first.'));
        process.exit(1);
      }
      validateConfig(config);
      setLogLevel(config.logLevel);
      logDefault(chalk.green('Configuration is valid.'));
      logVerbose(chalk.green(`Loaded configuration: ${JSON.stringify(config, null, 2)}`));
    } catch (error) {
      logError(chalk.red(`Configuration validation failed: ${error.message}`));
      logVerbose(chalk.red('Detailed error:', error));
      console.log(chalk.yellow('Tip: Check the schema or re-run `accessly init` to fix issues.'));
      process.exit(1);
    }
  });

program
  .command('audit <file>')
  .description('Audit an HTML file for accessibility issues')
  .action(async (file) => {
    const config = await loadConfig();

    if (config) {
      try {
        validateConfig(config);
        setLogLevel(config.logLevel);
        logVerbose(chalk.blue(`Loaded configuration: ${JSON.stringify(config, null, 2)}`));
      } catch (error) {
        logError(chalk.red(`Configuration validation failed: ${error.message}`));
        process.exit(1);
      }
    } else {
      logError(chalk.red('No configuration file found. Using defaults.'));
      setLogLevel('default');
    }

    logVerbose(chalk.blue(`Starting audit for file: ${file}`));
    const results = await auditHTML(file, config);
    logVerbose(chalk.blue(`Audit results: ${JSON.stringify(results, null, 2)}`));

    if (results.length) {
      if (config && config.ciMode) {
        results.forEach(issue => logError(`line=${issue.line},message=${issue.message}`));
        process.exit(1);
      } else {
        logDefault(chalk.red('Accessibility issues found:'));
        results.forEach(issue => console.log(`- Line ${issue.line}: ${issue.message}`));
      }
    } else {
      logDefault(chalk.green('No accessibility issues found!'));
    }
  });

program
  .command('annotate <file>')
  .description('Add annotations for accessibility issues directly into the file')
  .action(async (file) => {
    const config = await loadConfig();

    if (config) {
      try {
        validateConfig(config);
        setLogLevel(config.logLevel);
        logVerbose(chalk.blue(`Loaded configuration: ${JSON.stringify(config, null, 2)}`));
      } catch (error) {
        logError(chalk.red(`Configuration validation failed: ${error.message}`));
        process.exit(1);
      }
    } else {
      setLogLevel('default');
      logError(chalk.red('No configuration file found. Using defaults.'));
    }

    logVerbose(chalk.blue(`Starting audit for file: ${file}`));
    const results = await auditHTML(file, config);
    logVerbose(chalk.blue(`Audit results: ${JSON.stringify(results, null, 2)}`));

    if (results.length) {
      const annotatedHTML = await annotateHTML(file, results);
      await fs.writeFile(file, annotatedHTML, 'utf8');
      logDefault(chalk.green(`Annotations written to ${file}`));
      logVerbose(chalk.blue(`Annotated file saved at: ${file}`));
    } else {
      logDefault(chalk.green('No accessibility issues to annotate!'));
    }
  });

program.parse(process.argv);
