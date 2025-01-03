import { findAll } from 'domutils'
import colorContrast from 'color-contrast'
import { getEffectiveBackgroundColor, getEffectiveColor, hasVisibleText, parseClassStyles } from '../helpers'

const lowContrastText = {
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
};

export default lowContrastText;