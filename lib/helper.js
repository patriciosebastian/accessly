import { getParent } from 'domutils'
import colorContrast from 'color-contrast'
import css from 'css'

// ******** LOW CONTRAST TEXT HELPERS ********

/**
 * Parses CSS content and extracts class-based styles.
 * 
 * @param {string} cssContent
 * @returns {Object}
 */
export function parseClassStyles(cssContent) {
  const classStyles = {};

  if (cssContent) {
    const parsedCSS = css.parse(cssContent);
    parsedCSS.stylesheet.rules.forEach((rule) => {
      if (rule.type === 'rule') {
        rule.selectors.forEach((selector) => {
          // Only handle class selectors
          if (selector.startsWith('.')) {
            // Handle simple class selectors
            const className = selector.slice(1).split(/[\s>.#:[]/)[0];
            if (!classStyles[className]) {
              classStyles[className] = {};
            }
            rule.declarations.forEach((decl) => {
              if (decl.type === 'declaration') {
                const property = decl.property;
                const value = decl.value;
                if (property && value) {
                  classStyles[className][property] = value.toLowerCase();
                }
              }
            });
          }
        });
      }
    });
  }

  return classStyles;
}

/**
 * Determines the effective color of an element by traversing up the DOM.
 * 
 * @param {object} el
 * @param {object} classStyles
 * @returns {string|null}
 */
export function getEffectiveColor(el, classStyles) {
  let color = null;
  let currentElement = el;

  while (currentElement) {
    // Check inline styles
    if (currentElement.attribs?.style) {
      const styleObj = {};
      currentElement.attribs.style.split(';').forEach((decl) => {
        const [property, value] = decl.split(':').map((s) => s.trim().toLowerCase());
        if (property && value) {
          styleObj[property] = value;
        }
      });
      if (styleObj['color']) {
        color = styleObj['color'];
        break;
      }
    }

    // Check class-based styles
    if (currentElement.attribs?.class) {
      const classes = currentElement.attribs.class.split(' ').map((cls) => cls.trim()).filter((cls) => cls);
      for (const cls of classes) {
        if (classStyles[cls] && classStyles[cls]['color']) {
          color = classStyles[cls]['color'];
          break;
        }
      }
      if (color) break;
    }

    // Move to parent
    currentElement = getParent(currentElement);
  }

  return color;
}

/**
 * Determines the effective background-color of an element by traversing up the DOM.
 * 
 * @param {object} el
 * @param {object} classStyles
 * @returns {string}
 */
export function getEffectiveBackgroundColor(el, classStyles) {
  let backgroundColor = null;
  let currentElement = el;

  while (currentElement) {
    // Check inline styles
    if (currentElement.attribs?.style) {
      const styleObj = {};
      currentElement.attribs.style.split(';').forEach((decl) => {
        const [property, value] = decl.split(':').map((s) => s.trim().toLowerCase());
        if (property && value) {
          styleObj[property] = value;
        }
      });
      if (styleObj['background-color']) {
        backgroundColor = styleObj['background-color'];
        break;
      }
    }

    // Check class-based styles
    if (currentElement.attribs?.class) {
      const classes = currentElement.attribs.class.split(' ').map((cls) => cls.trim()).filter((cls) => cls);
      for (const cls of classes) {
        if (classStyles[cls] && classStyles[cls]['background-color']) {
          backgroundColor = classStyles[cls]['background-color'];
          break;
        }
      }
      if (backgroundColor) break;
    }

    // Move to parent
    currentElement = getParent(currentElement);
  }

  return backgroundColor || '#ffffff'; // Default to white if not found
}

/**
 * Determine if an element contains visible text.
 * 
 * @param {object} el
 * @returns {boolean}
 */
export function hasVisibleText(el) {
  // Check if the element has any non-empty text nodes
  if (el.children) {
    return el.children.some(
      (child) => child.type === 'text' && child.data.trim().length > 0
    );
  }

  return false;
}
