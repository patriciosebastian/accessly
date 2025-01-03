import { findAll } from 'domutils'

const missingAltAttribute = {
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
};

export default missingAltAttribute;