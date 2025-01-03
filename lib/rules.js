import { find, findAll } from 'domutils'
import colorContrast from 'color-contrast'
import { getEffectiveBackgroundColor, getEffectiveColor, hasVisibleText, parseClassStyles } from './helper.js'

const rules = [
  {
    name: 'Missing alt attribute',
    docs: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-alt',
    severity: 'error',
    check: (document) => {
      const images = findAll(el => el.name === 'img', document.children);

      return images
        .filter((img) => !img.attribs?.alt && img.attribs?.['role'] !== 'presentation') // Exclude decorative images
        .map((img) => ({
          startIndex: img.startIndex || 0,
          elementHTML: `<img src="${img.attribs?.src || '[no src]'}">`,
          message: 'Add an alt attribute to <img> to describe the image for screen readers.',
        }));
    },
  },
  {
    name: 'Decorative image missing empty alt attribute',
    docs: 'https://www.w3.org/WAI/tutorials/images/decorative/',
    severity: 'warning',
    check: (document) => {
      const images = findAll((el) => el.name === 'img', document.children);

      return images
        .filter((img) => img.attribs?.['role'] === 'presentation' && img.attribs?.alt !== '')
        .map((img) => ({
          startIndex: img.startIndex || 0,
          elementHTML: `<img src="${img.attribs?.src || '[no src]'}">`,
          message: 'Decorative images should have an empty alt attribute (alt="") and role="presentation".',
        }));
    },
  },
  {
    name: 'Low contrast text',
    docs: 'https://www.w3.org/WAI/WCAG21/quickref/#contrast-minimum',
    severity: 'warning',
    check: async (document, filePath) => {
      // Step 1: Extract class-based styles from <style> tags
      const styleElements = findAll((el) => el.name === 'style', document.children);
      let classStyles = {}; // Map of className -> { color, background-color }

      styleElements.forEach((styleEl) => {
        const cssContent = styleEl.children?.[0]?.data || '';
        const parsedStyles = parseClassStyles(cssContent);
        classStyles = { ...classStyles, ...parsedStyles };
        // console.log(`Parsed styles from <style>: ${Object.keys(parsedStyles).length} classes found.`);
      });

      // Step 2: Extract and parse external CSS files
      const linkElements = findAll(
        (el) => el.name === 'link' && el.attribs?.rel === 'stylesheet',
        document.children
      );

      const externalCSSPromises = linkElements.map(async (linkEl) => {
        const href = linkEl.attribs.href;
        if (href) {
          // Resolve the path relative to the HTML file's directory
          const cssFilePath = path.resolve(path.dirname(filePath), href);
          try {
            const cssContent = await fs.readFile(cssFilePath, 'utf8');
            const parsedStyles = parseClassStyles(cssContent);
            classStyles = { ...classStyles, ...parsedStyles };
            // console.log(`Parsed external CSS from ${cssFilePath}: ${Object.keys(parsedStyles).length} classes found.`);
          } catch (error) {
            logError(`Failed to read external CSS file at ${cssFilePath}: ${error.message}`);
          }
        }
      });

      await Promise.all(externalCSSPromises);

      // Step 3: Find all elements that contain visible text
      const allElements = findAll(() => true, document.children);
      const textElements = allElements.filter((el) => hasVisibleText(el));

      // console.log(`Total text-containing elements found: ${textElements.length}`);

      const issues = [];

      textElements.forEach((el) => {
        const color = getEffectiveColor(el, classStyles);
        const backgroundColor = getEffectiveBackgroundColor(el, classStyles);

        // console.log(`Element: <${el.name}> at index ${el.startIndex}`);
        // console.log(`Effective Color: ${color}`);
        // console.log(`Effective Background-Color: ${backgroundColor}`);

        try {
          const contrastRatio = colorContrast(color, backgroundColor);
          // console.log(`Contrast Ratio between ${color} and ${backgroundColor}: ${contrastRatio}`);

          if (contrastRatio < 4.5) {
            issues.push({
              startIndex: el.startIndex || 0,
              elementHTML: `<${el.name}>`,
              message: `Text contrast is too low (contrast ratio: ${contrastRatio.toFixed(2)}:1). Ensure a minimum contrast ratio of 4.5:1.`,
            });
            // console.log(`Low contrast detected for <${el.name}> at index ${el.startIndex} with contrast ratio ${contrastRatio.toFixed(2)}:1.`);
          }
        } catch (error) {
          logError(`Error calculating contrast ratio for colors: ${color} and ${backgroundColor} at index ${el.startIndex}: ${error.message}`);
        }
      });

      // console.log(`Total low contrast issues detected: ${issues.length}`);
      return issues;
    },
  },
  {
    name: 'Missing ARIA label or text content',
    docs: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-label',
    severity: 'error',
    check: (document) => {
      const interactiveElements = findAll(
        (el) => ['button', 'a', 'input'].includes(el.name),
        document.children
      );

      return interactiveElements
        .filter((el) => {
          const hasAriaLabel = el.attribs?.['aria-label'] || el.attribs?.['aria-labelledby'];
          const hasVisibleText = el.children?.some(child => child.type === 'text' && child.data.trim());
          return !hasAriaLabel && !hasVisibleText;
        })
        .map((el) => ({
          startIndex: el.startIndex || 0,
          elementHTML: `<${el.name}>`,
          message: `Add an ARIA label or text content to <${el.name}> for better accessibility.`,
        }));
    },
  },
  {
    name: 'Missing lang attribute on <html>',
    docs: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang',
    severity: 'error',
    check: (document) => {
      const htmlElement = find((el) => el.name === 'html', document.children);

      if (!htmlElement?.attribs?.lang) {
        return [
          {
            startIndex: htmlElement?.startIndex || 0,
            elementHTML: '<html>',
            message: 'Add a lang attribute to <html> to specify the document’s language.',
          },
        ];
      }
  
      return [];
    },
  },
  {
    name: 'Missing title on <iframe>',
    docs: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-title',
    severity: 'error',
    check: (document) => {
      const iframes = findAll((el) => el.name === 'iframe', document.children);

      return iframes
        .filter((iframe) => !iframe.attribs?.title)
        .map((iframe) => ({
          startIndex: iframe.startIndex || 0,
          elementHTML: `<iframe${iframe.attribs?.src ? ` src="${iframe.attribs.src}"` : ''}>`,
          message: 'Add a title attribute to <iframe> to describe its content.',
        }));
    },
  },
];

export default rules;
