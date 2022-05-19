/**
 * Symbol Art Editor
 *
 * @author malulleybovo (since 2021)
 * @license GNU General Public License v3.0
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2021  Arthur Malulley B. de O.
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */
const Size = require('./Size');

module.exports = class SymbolArtType {
  static symbolArt = new Size({ width: 193, height: 128 });
  static allianceFlag = new Size({ width: 64, height: 64 });

  static valid({ rawValue }) {
    switch (rawValue) {
      case SymbolArtType.symbolArt:
      case SymbolArtType.allianceFlag:
        return true;
      default:
        return false;
    }
  }

  static from({ width }) {
    if (!Number.isSafeInteger(width)) return null;
    switch (width) {
      case 192: // Legacy
      case 193:
        return SymbolArtType.symbolArt;
      case 64:
        return SymbolArtType.allianceFlag;
      default:
        return null;
    }
  }
};
