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

module.exports = class SoundOption {
  static lowerBound = 0;
  static upperBound = 12;

  _index = 0;
  get index() {
    return this._index;
  }
  set index(value) {
    if (this.isValid({ index: value })) this._index = value;
  }

  constructor({ index = null } = {}) {
    this.index = index;
  }

  isValid({ index = undefined } = {}) {
    if (typeof index === 'undefined')
      throw new SyntaxError('function expects at least one parameter');
    return (
      typeof index === 'number' &&
      Number.isSafeInteger(index) &&
      index >= SoundOption.lowerBound &&
      index <= SoundOption.upperBound
    );
  }
};
