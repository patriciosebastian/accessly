import fs from 'fs/promises'
import { parseDocument } from 'htmlparser2'
import rules from './rules.js'

export async function auditHTML(filePath) {
  const html = await fs.readFile(filePath, 'utf8');
  const document = parseDocument(html);

  // Process rules
  const results = [];
  rules.forEach(rule => {
    results.push(...rule.check(document).map(issue => ({
      ...issue,
      docs: rule.docs, // Attach documentation link
    })));
  });

  return results;
}

// Add annotations directly into the HTML file
export async function annotateHTML(filePath, results) {
  const html = await fs.readFile(filePath, 'utf8');
  const lines = html.split('\n');

  results.forEach(issue => {
    const comment = `<!-- ${issue.message} (See: ${issue.docs}) -->`;
    lines.splice(issue.line - 1, 0, comment);
  });

  return lines.join('\n');
}
