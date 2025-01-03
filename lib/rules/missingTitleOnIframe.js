import { findAll } from 'domutils'

const missingTitleOnIframe = {
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
};

export default missingTitleOnIframe;