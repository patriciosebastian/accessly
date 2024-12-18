import { find } from 'domutils'
import { getContrastRatio } from 'wcag-contrast'

const rules = [
  {
    name: 'Missing alt attribute',
    docs: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-alt',
    check: (document) => {
      const images = find(el => el.name === 'img', document.children);
      return images
        .filter(img => !img.attribs.alt)
        .map(img => ({
          line: img.startIndex,
          message: 'Add an alt attribute to <img> to describe the image for screen readers.',
        }));
    },
  },
  {
    name: 'Low contrast text',
    docs: 'https://www.w3.org/WAI/WCAG21/quickref/#contrast-minimum',
    check: (document) => {
      const elements = find(el => el.style && el.style.color, document.children);
      return elements
        .filter(el => getContrastRatio(el.style.color, el.style.backgroundColor) < 4.5)
        .map(el => ({
          line: el.startIndex,
          message: 'Text contrast is too low. Ensure a minimum contrast ratio of 4.5:1.',
        }));
    },
  },
];

// where does this go? Here or in accessly.js? And is it correct?
// Command to open links
// const open = require('open');
// open(rule.docs);

export default rules;
