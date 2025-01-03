import fs from 'fs/promises'
import { parseDocument } from 'htmlparser2'
import rules from './rules.js'
import { logError, logVerbose } from './logger.js'

/**
 * Computes the starting character index for each line in the HTML file.
 * 
 * @param {Array<string>} lines
 * @returns {Array<number>}
 */
function computeLineStartIndices(lines) {
  const lineStartIndices = [0];
  let currentIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    currentIndex += lines[i].length + 1;
    lineStartIndices.push(currentIndex);
  }

  return lineStartIndices;
}

/**
 * Determines the line number for a given character index using binary search.
 * 
 * @param {number} startIndex
 * @param {Array<number>} lineStartIndices
 * @returns {number}
 */
function getLineNumber(startIndex, lineStartIndices) {
  let low = 0;
  let high = lineStartIndices.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);

    if (lineStartIndices[mid] <= startIndex && (mid === lineStartIndices.length - 1 || lineStartIndices[mid + 1] > startIndex)) {
      return mid + 1; // Line numbers are 1-based
    } else if (lineStartIndices[mid] > startIndex) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  // Default to line 1 if not found
  return 1;
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
    'add an alt attribute to <img> to describe the image for screen readers.': 'error',
    'decorative images should have an empty alt attribute (alt="") and role="presentation".': 'warning',
    'text contrast is too low. ensure a minimum contrast ratio of 4.5:1.': 'warning',
    'add an aria label or text content to <button> for better accessibility.': 'error',
    'add an aria label or text content to <a> for better accessibility.': 'error',
    'add an aria label or text content to <input> for better accessibility.': 'error',
    'add a lang attribute to <html> to specify the document’s language.': 'error',
    'add a title attribute to <iframe> to describe its content.': 'error',
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
    const lineStartIndices = computeLineStartIndices(lines);
    const document = parseDocument(html, { withStartIndices: true, withEndIndices: true });

    // Process rules
    const results = [];
    for (const rule of rules) {
      // Check if the rule's check function is asynchronous
      const isAsync = rule.check.constructor.name === 'AsyncFunction';
      const issues = isAsync ? await rule.check(document, filePath) : rule.check(document);

      issues.forEach((issue) => {
        let estimatedLine = 1; // Default line number

        if (issue.startIndex != null) {
          // Special case: for <html> annotations (set to doctypeLine +1)
          if (issue.elementHTML.toLowerCase() === '<html>') {
            const doctypeLine = lines.findIndex((l) => l.trim().toLowerCase().startsWith('<!doctype')) + 1;
            estimatedLine = doctypeLine ? doctypeLine + 1 : 2; // Place after DOCTYPE, default to line 2
          } else {
            estimatedLine = getLineNumber(issue.startIndex, lineStartIndices);
          }
        } else {
          // Fallback: attempt to find elementHTML in lines (less accurate)
          estimatedLine = lines.findIndex((line) => line.trim().includes(issue.elementHTML.trim())) + 1;
          if (estimatedLine === 0) {
            const tagName = issue.elementHTML.split(' ')[0].slice(1, -1);
            estimatedLine = lines.findIndex((line) => line.trim().startsWith(`<${tagName}`)) + 1;
            if (estimatedLine === 0) {
              estimatedLine = 1; // Fallback to line 1
            }
          }
        }

        logVerbose(`Issue detected at index ${issue.startIndex} mapped to line ${estimatedLine}`);

        results.push({
          ...issue,
          line: estimatedLine,
          docs: rule.docs,
          severity: rule.severity || 'error',
        });
      });
    }

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
    const lineStartIndices = computeLineStartIndices(lines);

    const filteredIssues = filterIssues(results, reportLevel);
    logVerbose(`Filtered issues based on report level (${reportLevel}): ${filteredIssues.length} issues`);

    // Sort issues by line number in descending order
    filteredIssues.sort((a, b) => b.line - a.line);

    filteredIssues.forEach(issue => {
      let line = 1; // Default line number

      if (issue.startIndex != null) {
        if (issue.elementHTML.toLowerCase() === '<html>') {
          const doctypeLine = lines.findIndex(l => l.trim().toLowerCase().startsWith('<!doctype')) + 1;
          line = doctypeLine ? doctypeLine + 1 : 2;
        } else {
          line = getLineNumber(issue.startIndex, lineStartIndices);
        }
      } else {
        // Fallback: Attempt to find the elementHTML in lines (less accurate)
        line = lines.findIndex(l => l.includes(issue.elementHTML.trim())) + 1;
        if (line === 0) {
          const tagName = issue.elementHTML.split(' ')[0].slice(1, -1);
          line = lines.findIndex(l => l.trim().startsWith(`<${tagName}`)) + 1;
          if (line === 0) {
            line = 1; // Fallback to line 1
          }
        }
      }

      // Special case: for <iframe> annotations (place right before <iframe>)
      if (issue.elementHTML.toLowerCase().startsWith('<iframe')) {
        line = lines.findIndex(l => l.trim().toLowerCase().startsWith('<iframe')) + 1 || lines.length;
      }

      const comment = `<!-- ${issue.message}\n(See: ${issue.docs}) -->`;

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