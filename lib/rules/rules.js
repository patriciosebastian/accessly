import decorativeImageMissingEmptyAltAttribute from "./decorativeImageMissingEmptyAltAttribute"
import lowContrastText from "./lowContrastText"
import missingAltAttribute from "./missingAltAttribute"
import missingAriaLabelOrTextContent from "./missingAriaLabelOrTextContent"
import missingLangAttribute from "./missingLangAttribute"
import missingTitleOnIframe from "./missingTitleOnIframe"

const rules = [
  missingAltAttribute,
  decorativeImageMissingEmptyAltAttribute,
  lowContrastText,
  missingAriaLabelOrTextContent,
  missingLangAttribute,
  missingTitleOnIframe,
];

export default rules;
