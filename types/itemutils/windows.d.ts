/**
 * representation of roofwindow state / openess level
 */
export type roofwindowState = any;
/**
  * @typedef {Object} roofwindowState representation of roofwindow state / openess level
  * @memberof itemutils
  * @property {String} text textual representation of openess level (in German)
  * @property {Number} int Integer reprentation of openess level: 100 for completely closed, 1 for a little bit opened, 2 for a bit opened & 4 for completely opened (5 on error)
  */
/**
  * Get the level a roofwindow is opened.
  * The roofwindow can either be completely opened or a bit opened (große Lüftung) or a little bit opened (kleine Lüftung) or closed.
  * Item naming scheme is required:
  *  - baseitemname + `_zu`
  *  - baseitemname + `_klLueftung`
  *  - baseitemname + `_grLueftung`
  *
  * @memberof itemutils
  * @param {String} baseItem base of the Items names, e.g. `Florian_Dachfenster`
  * @returns {itemutils.roofwindowState} {@link roofwindowState}
  */
export function getRoofwindowOpenLevel(baseItem: string): itemutils.roofwindowState;
//# sourceMappingURL=windows.d.ts.map