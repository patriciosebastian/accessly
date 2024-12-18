#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { annotateHTML, auditHTML } from "../lib/engine.js";

const program = new Command();

program
  .version('1.0.0')
  .description('Accessly: Accessibility CLI Tool');

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
      console.log(chalk.blue("Annotated HTML saved:"));
      console.log(annotatedHTML);

      // Optionally save to file
      await fs.writeFile(file, annotatedHTML, "utf8");
      console.log(chalk.green(`Annotations written to ${file}`));
    } else {
      console.log(chalk.green('No accessibility issues to annotate!'));
    }
  });

program.parse(process.argv); // ?
