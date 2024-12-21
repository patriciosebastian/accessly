import fs from 'fs/promises'
import { parseDocument } from 'htmlparser2'
import rules from './rules.js'
import { logError, logVerbose } from './logger.js'

/**
 * Audits an HTML file for accessibility issues based on defined rules.
 * 
 * @param {string} filePath 
 * @param {object} config 
 * @returns {Array}
 */
export async function auditHTML(filePath, config) {
  try {
    logVerbose(`Reading file: ${filePath}`);
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
          severity: rule.severity || 'error', // Assume error if not defined
        });
      });
    });
  
    logVerbose(`Audit completed with ${results.length} issues`);
    return results;
  } catch (error) {
    logError(`Failed to audit file: ${error.message}`);
    logVerbose(`Detailed error: ${error.stack}`);
    throw error;
  }
}

/**
 * Annotates an HTML file with accessibility issues.
 * 
 * @param {string} filePath 
 * @param {Array} results 
 * @param {string} reportLevel 
 * @returns {string}
 */
export async function annotateHTML(filePath, results, reportLevel) {
  try {
    logVerbose(`Annotating file: ${filePath}`);
    const html = await fs.readFile(filePath, 'utf8');
    const lines = html.split('\n');
  
    const filteredIssues = filterIssues(results, reportLevel);
    logVerbose(`Filtered issues based on report level (${reportLevel}): ${filteredIssues.length} issues`);
  
    filteredIssues.forEach(issue => {
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
  
    logVerbose('Annotations Completed.');
    return lines.join('\n');
  } catch (error) {
    logError(`Failed to annotate file: ${error.message}`);
    logVerbose(`Detailed error: ${error.stack}`);
    throw error;
  }
}

/**
 * Filters issues based on the report level.
 * 
 * @param {Array} issues 
 * @param {string} reportLevel 
 * @returns {Array}
 */
function filterIssues(issues, reportLevel) {
  const severityMap = {
    'missing alt attribute on img tag': 'error',
    'decorative image missing empty alt attribute': 'warning',
    'low contrast text': 'warning',
    'missing ARIA label or text content': 'error',
    'missing lang attribute on html tag': 'error',
    'missing title attribute on iframe tag': 'error',
  };

  return issues.filter(issue => {
    const severity = severityMap[issue.message.toLowerCase()] || 'error';
    
    if (reportLevel === 'verbose') {
      return true; // Show all issues
    } else if (reportLevel === 'default') {
      return severity === 'error'; // Show only errors
    } else if (reportLevel === 'quiet') {
      // Define what 'quiet' means.
      return severity === 'error';
    }

    return true; // Fallback to show all issues
  });
}
