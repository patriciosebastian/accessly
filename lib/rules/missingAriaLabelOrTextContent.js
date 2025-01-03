import { findAll } from 'domutils'

const missingAriaLabelOrTextContent = {
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
};

export default missingAriaLabelOrTextContent;