import { find, findAll } from 'domutils'
import pkg from 'wcag-contrast'
const { getContrastRatio } = pkg

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
          startIndex: img.startIndex,
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
          startIndex: img.startIndex,
          elementHTML: `<img src="${img.attribs.src || '[no src]'}">`,
          message: 'Decorative images should have an empty alt attribute (alt="") and role="presentation".',
        }));
    },
  },
  {
    name: 'Low contrast text',
    docs: 'https://www.w3.org/WAI/WCAG21/quickref/#contrast-minimum',
    severity: 'warning',
    check: (document) => {
      const elements = findAll(el => el.style?.color, document.children);
      return elements
        .filter(el => getContrastRatio(el.style.color, el.style.backgroundColor) < 4.5)
        .map(el => ({
          startIndex: el.startIndex || 0,
          elementHTML: `<${el.name}>`,
          message: 'Text contrast is too low. Ensure a minimum contrast ratio of 4.5:1.',
        }));
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
        .filter((el) => !el.attribs['aria-label'] && !el.attribs['aria-labelledby'] && !el.children?.some(child => child.type === 'text' && child.data.trim()))
        .map((el) => ({
          startIndex: el.startIndex,
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
            startIndex: htmlElement?.startIndex || 1,
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
          startIndex: iframe.startIndex,
          elementHTML: `<iframe${iframe.attribs.src ? ` src="${iframe.attribs.src}"` : ''}>`,
          message: 'Add a title attribute to <iframe> to describe its content.',
        }));
    },
  },
];

export default rules;
