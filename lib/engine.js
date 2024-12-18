import fs from 'fs'
import { parseDocument } from 'htmlparser2'
import rules from './rules'

export async function auditHTML(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const document = parseDocument(html);

  // Process rules
  const results = [];
  rules.forEach(rule => {
    results.push(...rule.check(document));
  });

  return results;
}

// Add annotations directly into the HTML file
export async function annotateHTML(filePath, issues) {
  const html = fs.readFileSync(filePath, 'utf8');
  const lines = html.split('\n');

  issues.forEach(issue => {
    lines.splice(issue.line - 1, 0, `<!-- ${issue.message} -->`);
  });

  return lines.join('\n');
}