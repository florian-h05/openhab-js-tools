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
 * @typedef {object} Item
 * @private
 */

/**
 * Group Utilities
 *
 * Provides a number of utilities for groups.
 * @memberof itemutils
 */
class GroupUtils {
  /**
   * Creates an instance of groupUtils. Don't use this constructor, instead call {@link getGroup}.
   * @param {Item} groupItem Item from 'openhab'
   * @hideconstructor
   */
  constructor (groupItem) {
    if (groupItem.type !== 'GroupItem') throw new Error('Supplied Item must be a group Item!');
    this.jsItem = groupItem;
  }

  /**
   * Members / children / direct descendents of the current group Item (as returned by 'getMembers()')
   * @type {Item[]}
   */
  get members () {
    return this.jsItem.members;
  }

  /**
   * Names of members / children / direct descendents of the current group Item (as returned by 'getMembers()')
   * @type {string[]}
   */
  get membersNames () {
    return this.members.map(item => item.name);
  }

  /**
   * Labels of members / children / direct descendents of the current group Item (as returned by 'getMembers()') as a concatenated string
   * @type {string}
   */
  get membersLabelsString () {
    return this.members.map(item => item.label).join(', ');
  }

  /**
   * Minimum state item of members / children / direct descendents of the current group Item (as returned by 'getMembers()')
   * Filters for items not {@link isUninitialized}.
   * @type {Item}
   */
  get membersMin () {
    return this.members.filter(item => !item.isUninitialized).reduce((min, item) => parseFloat(item.state) < parseFloat(min.state) ? item : min);
  }

  /**
   * Maximum state item of members / children / direct descendents of the current group Item (as returned by 'getMembers()')
   * Filters for items not {@link isUninitialized}.
   * @type {Item}
   */
  get membersMax () {
    return this.members.filter(item => !item.isUninitialized).reduce((min, item) => parseFloat(item.state) > parseFloat(min.state) ? item : min);
  }

  /**
   * Summarized value of members / children / direct descendents of the current group Item (as returned by 'getMembers()')
   * Filters for items of type Number, Dimmer & Rollershutter in calculation and not {@link isUninitialized}.
   * @type {number}
   */
  get membersSum () {
    return this.members.filter(item => (item.type === 'NumberItem' || item.type === 'DimmerItem' || item.type === 'RollershutterItem') && !item.isUninitialized).reduce((sum, item) => sum + parseFloat(item.state), 0);
  }

  /**
   * Average value of members / children / direct descendents of the current group Item (as returned by 'getMembers()')
   * Filters for items of type Number, Dimmer & Rollershutter in calculation and not {@link isUninitialized}.
   * @type {number}
   */
  get membersAvg () {
    const numbers = this.members.filter(item => (item.type === 'NumberItem' || item.type === 'DimmerItem' || item.type === 'RollershutterItem') && !item.isUninitialized);
    return numbers.reduce((avg, item) => { return avg + parseFloat(item.state) / numbers.length; }, 0);
  }

  /**
   * All descendents of the current group Item (as returned by 'getAllMembers()')
   * @type {Item[]}
   */
  get descendents () {
    return this.jsItem.descendents;
  }

  /**
   * Names of all descendents of the current group item (as returned by 'getAllMembers()'). Must be a group item.
   * @type {string[]}
   */
  get descendentsNames () {
    return this.descendents.map(item => item.name);
  }

  /**
   * Labels of all descendents of the current group item (as returned by 'getAllMembers()'). Must be a group item.
   * @type {string}
   */
  get descendentsLabelsString () {
    return this.descendents.map(item => item.label).join(', ');
  }

  /**
   * Minimum state item of all descendents of the current group Item (as returned by 'getAllMembers()')
   * Filters for items not {@link isUninitialized}.
   * @type {Item}
   */
  get descendentsMin () {
    return this.descendents.filter(item => !item.isUninitialized).reduce((min, item) => parseFloat(item.state) < parseFloat(min.state) ? item : min);
  }

  /**
   * Maximum state item of all descendents of the current group Item (as returned by 'getAllMembers()')
   * Filters for items not {@link isUninitialized}.
   * @type {Item}
   */
  get descendentsMax () {
    return this.descendents.filter(item => !item.isUninitialized).reduce((min, item) => parseFloat(item.state) > parseFloat(min.state) ? item : min);
  }

  /**
   * Summarized value of all descendents of the current group Item (as returned by 'getAllMembers()')
   * Filters for items of type Number, Dimmer & Rollershutter in calculation and not {@link isUninitialized}.
   * @type {number}
   */
  get descendentsSum () {
    return this.descendents.filter(item => (item.type === 'NumberItem' || item.type === 'DimmerItem' || item.type === 'RollershutterItem') && !item.isUninitialized).reduce((sum, item) => sum + parseFloat(item.state), 0);
  }

  /**
   * Average value of all descendents of the current group Item (as returned by 'getAllMembers()')
   * Filters for items of type Number, Dimmer & Rollershutter in calculation and not {@link isUninitialized}.
   * @type {number}
   */
  get descendentsAvg () {
    const numbers = this.descendents.filter(item => (item.type === 'NumberItem' || item.type === 'DimmerItem' || item.type === 'RollershutterItem') && !item.isUninitialized);
    return numbers.reduce((avg, item) => { return avg + parseFloat(item.state) / numbers.length; }, 0);
  }

  /**
   * Count the number of members / children / direct descendents of the current group Item (as returned by 'getMembers()') matching a comparison
   * @param {function} compareFunc comparison function
   * @returns {number} number of matches
   * @example
   * itemutils.getGroup('group').membersCount(item => item.state === 'ON');
   */
  membersCount (compareFunc) {
    // @ts-ignore
    return this.members.filter(compareFunc).length;
  }

  /**
   * Count the number of all descendents of the current group Item (as returned by 'getAllMembers()') matching a comparison
   * @param {function} compareFunc comparison function
   * @returns {number} number of matches
   * @example
   * itemutils.getGroup('group').descendentsCount(item => item.state === 'ON');
   */
  descendentsCount (compareFunc) {
    // @ts-ignore
    return this.descendents.filter(compareFunc).length;
  }
}

/**
 * Gets an instance of groupUtils.
 * @memberof itemutils
 * @param {string} groupName the name of the group
 * @returns {GroupUtils} {@link itemutils.GroupUtils}
 */
function getGroupUtils (groupName) {
  return new GroupUtils(items.getItem(groupName));
}

module.exports = {
  getGroupUtils
};
