import { find } from 'domutils'

const missingLangAttribute = {
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
};

export default missingLangAttribute;