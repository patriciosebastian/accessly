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
  .option('--report-level <level>', 'Set the report level (verbose, default, quiet)')
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
        logError('No configuration file found Try running `accessly init` first.');
        process.exit(1);
      }
      validateConfig(config);
      setLogLevel(config.logLevel);
      logDefault('Configuration is valid.');
      logVerbose(`Loaded configuration: ${JSON.stringify(config, null, 2)}`);
    } catch (error) {
      logError(`Configuration validation failed: ${error.message}`);
      logVerbose('Detailed error:', error);
      console.log(chalk.yellow('Tip: Check the schema or re-run `accessly init` to fix issues.'));
      process.exit(1);
    }
  });

program
  .command('audit <file>')
  .description('Audit an HTML file for accessibility issues')
  .action(async (file) => {
    try {
      const config = await loadConfig();
      
      if (config) {
        validateConfig(config);
        setLogLevel(config.logLevel);
        logVerbose(`Loaded configuration: ${JSON.stringify(config, null, 2)}`);
      } else {
        logError('No configuration found. Using defaults.');
        setLogLevel('default');
      }

      logVerbose(`Starting audit for file: ${file}`);
      const results = await auditHTML(file, config);
      logVerbose(`Audit results: ${JSON.stringify(results, null, 2)}`);

      if (results.length) {
        if (config && config.ciMode) {
          results.forEach(issue => logError(`line=${issue.line},message=${issue.message}`));
          process.exit(1);
        } else {
          logDefault('Accessibility issues found:');
          results.forEach(issue => {
            if (config.reportLevel === 'verbose') {
              console.log(`- Line ${issue.line}: ${issue.message} (See: ${issue.docs})`);
            } else {
              console.log(`- Line ${issue.line}: ${issue.message}`);
            }
          });
        }
      } else {
        logDefault('No accessibility issues found!');
      }
    } catch (error) {
      logError(`Audit failed: ${error.message}`);
      logVerbose(`Detailed error: ${error.stack}`);
      process.exit(1);
    }
  });

program
  .command('annotate <file>')
  .description('Add annotations for accessibility issues directly into the file')
  .action(async (file) => {
    try {
      const config = await loadConfig();
      if (config) {
        validateConfig(config);
        setLogLevel(config.logLevel);
        logVerbose(`Loaded configuration: ${JSON.stringify(config, null, 2)}`);
      } else {
        setLogLevel('default');
        logError('No configuration found. Using defaults.');
      }

      logVerbose(`Starting annotation for file: ${file}`);
      const results = await auditHTML(file, config);
      logVerbose(`Audit results: ${JSON.stringify(results, null, 2)}`);

      if (results.length) {
        const annotatedHTML = await annotateHTML(file, results, config.reportLevel);
        await fs.writeFile(file, annotatedHTML, "utf8");
        logDefault(`Annotations written to ${file}`);
        logVerbose(`Annotated file saved at: ${file}`);
      } else {
        logDefault('No accessibility issues to annotate!');
      }
    } catch (error) {
      logError(`Annotation failed: ${error.message}`);
      logVerbose(`Detailed error: ${error.stack}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
