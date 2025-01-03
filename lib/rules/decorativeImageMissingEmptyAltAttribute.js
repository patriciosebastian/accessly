import { findAll } from 'domutils'

const decorativeImageMissingEmptyAltAttribute = {
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
};

export default decorativeImageMissingEmptyAltAttribute;