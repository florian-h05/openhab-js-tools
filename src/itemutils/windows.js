/**
 * Copyright (c) 2021 Florian Hotze
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0
 *
 * SPDX-License-Identifier: EPL-2.0
 */

const { items } = require('openhab');

/**
  * @typedef {Object} roofwindowState representation of roofwindow state / openess level
  * @memberof itemutils
  * @property {String} text textual representation of openess level (in German)
  * @property {Number} int Integer reprentation of openess level: 100 for completely closed, 1 for a little bit opened, 2 for a bit opened & 4 for completely opened (5 on error)
  */

/**
  * Get the level a roofwindow is opened.
  * The roofwindow can either be completely opened or a bit opened (große Lüftung) or a little bit opened (kleine Lüftung) or closed.
  * Item naming scheme is required: `baseItem` + `_zu`, `_klLueftung`, `grLueftung`.
  *
  * @memberof itemutils
  * @param {String} baseItem base of the Items names, e.g. `Florian_Dachfenster`
  * @returns {itemutils.roofwindowState}
  */
const getRoofwindowOpenLevel = (baseItem) => {
  const output = {};
  const stateClosed = items.getItem(baseItem + '_zu').state;
  const stateKlLueftung = items.getItem(baseItem + '_klLueftung').state;
  const stateGrLueftung = items.getItem(baseItem + '_grLueftung').state;
  // checks for the different states.
  if (stateClosed === 'CLOSED' && stateKlLueftung === 'CLOSED' && stateGrLueftung === 'CLOSED') { // geschlossen
    output.text = 'geschlossen';
    output.int = 100;
  } else if (stateClosed === 'OPEN' && stateKlLueftung === 'CLOSED' && stateGrLueftung === 'CLOSED') { // kleine Lüftung
    output.text = 'kleine Lüftung';
    output.int = 1;
  } else if (stateClosed === 'OPEN' && stateKlLueftung === 'OPEN' && stateGrLueftung === 'CLOSED') { // große Lüftung
    output.text = 'große Lüftung';
    output.int = 2;
  } else if (stateClosed === 'OPEN' && stateKlLueftung === 'OPEN' && stateGrLueftung === 'OPEN') { // ganz geöffnet
    output.text = 'ganz geöffnet';
    output.int = 4;
  } else {
    output.text = 'Fehler!';
    output.int = 5;
  }
  return output;
};

module.exports = {
  getRoofwindowOpenLevel
};
