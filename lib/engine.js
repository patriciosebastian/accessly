import fs from 'fs/promises'
import { parseDocument } from 'htmlparser2'
import rules from './rules.js'

export async function auditHTML(filePath) {
  const html = await fs.readFile(filePath, 'utf8');
  const lines = html.split('\n');
  const document = parseDocument(html);

  // Process rules
  const results = [];
  rules.forEach(rule => {
    const issues = rule.check(document);
    issues.forEach(issue => {
      let estimatedLine;

      // Step 1: Find exact match for `elementHTML`, trimmed
      estimatedLine = lines.findIndex(line => line.trim().includes(issue.elementHTML.trim())) + 1;

      // Step 2: Fallback to match by tag name
      if (!estimatedLine) {
        const tagName = issue.elementHTML.split(' ')[0].slice(1);
        estimatedLine = lines.findIndex(line => line.trim().startsWith(`<${tagName}`)) + 1;
      }

      // Step 3: Use `startIndex` for precise line estimation
      if (!estimatedLine && issue.startIndex != null) {
        let charCount = 0;
        estimatedLine = lines.findIndex(line => {
          charCount += line.length + 1;
          return charCount > issue.startIndex;
        }) + 1;
      }

      // Step 4: Final fallback to line 1
      if (!estimatedLine) estimatedLine = 1;

      results.push({
        ...issue,
        line: estimatedLine,
        docs: rule.docs,
      });
    });
  });

  return results;
}

// Add annotations directly into the HTML file
export async function annotateHTML(filePath, results) {
  const html = await fs.readFile(filePath, 'utf8');
  const lines = html.split('\n');

  results.forEach(issue => {
    let line;

    line =
      lines.findIndex(line => line.includes(issue.elementHTML.trim())) + 1 ||
      lines.findIndex(line => line.includes(`<${issue.elementHTML.split(' ')[0].slice(1)}`)) + 1 ||
      1; // Fallback to line 1 if not found

      // Special case: for <html> annotations (place right after <!DOCTYPE>)
    if (issue.elementHTML === '<html>') {
      line = lines.findIndex(line => line.includes('<html')) + 1 || 2;
    }

    // Special case: for <iframe> annotations (place right before <iframe>)
    if (issue.elementHTML === '<iframe>') {
      line = lines.findIndex(line => line.includes('<iframe')) + 1 || lines.length;
    }

    const comment = `<!-- ${issue.message}
    (See: ${issue.docs}) -->`;

    lines.splice(line - 1, 0, comment);
  });

  return lines.join('\n');
}
