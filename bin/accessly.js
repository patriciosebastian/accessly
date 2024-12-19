#!/usr/bin/env node

import fs from 'fs/promises'
import { Command } from 'commander'
import chalk from 'chalk'
import { annotateHTML, auditHTML } from "../lib/engine.js"
import { loadConfig, validateConfig } from '../lib/config.js'
import { initCommand } from '../lib/init.js'

const program = new Command();

program
  .name('accessly')
  .description('Accessly: An accessibility auditing tool')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize Accessly configuration')
  .option('-f, --force', 'Overwrite existing configuration without prompting')
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
        console.log(chalk.red('No configuration file found.'));
        process.exit(1);
      }
      validateConfig(config);
      console.log(chalk.green('Configuration is valid.'));
    } catch (error) {
      console.error(`${chalk.red('Configuration validation failed:')} ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('audit <file>')
  .description('Audit an HTML file for accessibility issues')
  .action(async (file) => {
    const results = await auditHTML(file);
    if (results.length) {
      console.log(chalk.red('Accessibility issues found:'));
      results.forEach(issue => console.log(`- Line ${issue.line}: ${issue.message}`));
    } else {
      console.log(chalk.green('No accessibility issues found!'));
    }
  });

program
  .command('annotate <file>')
  .description('Add annotations for accessibility issues directly into the file')
  .action(async (file) => {
    const results = await auditHTML(file);
    if (results.length) {
      const annotatedHTML = await annotateHTML(file, results);

      await fs.writeFile(file, annotatedHTML, "utf8");
      console.log(chalk.green(`Annotations written to ${file}`));
    } else {
      console.log(chalk.green('No accessibility issues to annotate!'));
    }
  });

program.parse(process.argv);
