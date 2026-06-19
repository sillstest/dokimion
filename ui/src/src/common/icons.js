// FontAwesome v6 renamed several icons. These shims restore the original icon
// names so existing XPath selectors in automation tests continue to work.
// e.g. data-icon='pencil-alt', data-icon='minus-circle'
import {
  faPencilAlt as _faPencilAlt,
  faMinusCircle as _faMinusCircle,
  faSave as _faSave,
} from "@fortawesome/free-solid-svg-icons";

export const faPencilAlt = { ..._faPencilAlt, iconName: "pencil-alt" };
export const faMinusCircle = { ..._faMinusCircle, iconName: "minus-circle" };
export const faSave = { ..._faSave, iconName: "save" };
