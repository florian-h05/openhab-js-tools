/**
 * Only works with the JS Scripting Add-On/GraalJS.
 * Dependents on: the official openHAB JS library 'openhab', which is pre-installed in the JS Scripting Add-On.
 *
 * Copyright (c) 2021 Florian Hotze under MIT License
 */

const { itemRegistry } = require('@runtime');
const { items } = require('openhab'); 

/**
 * @namespace items
 */
 
/**
 * Group utilities.
 * Provides a number of utilities for groups.
 *
 * @memberOf items
 */
class groupUtils {
  /**
   * Creates an instance of groupUtils. Don't use this constructor, instead call {@link getGroupUtils}.
   * @param {Item} jsItem Item from 'openhab'
   * @hideconstructor
   */
  constructor (jsItem) {
    if (typeof jsItem === 'undefinded') {
      console.error('Supplied item is undefined.');
    }
    this.jsItem = jsItem;
  }
  
  /**
   * Whether this item is initialized.
   * @type {Boolean}
   * @returns true if the item has not been initialized
   */
  get isUninitialized () {
    return this.jsItem.isUninitialized;
  }
  
  /**
   * Members / children / direct descendents of the current group item (as returned by 'getMembers()'). Must be a group item.
   * @returns {Item[]} member items
   */
  get members () {
    return this.jsItem.members;
  }
  
  /**
   * Names of members / children / direct descendents of the current group item (as returned by 'getMembers()'). Must be a group item.
   * @returns {Array} names of member items
   */
  get membersNames() {
    return this.members.map(item => item.name);
  }

  /**
   * Labels of members / children / direct descendents of the current group item (as returned by 'getMembers()') as a concatenated string. Must be a group item.
   * @returns {String} states of member items as concatenated string
   */
  get membersLabelsString() {
    return this.members.map(item => item.label).join(', ');
  }

  /**
   * Minimum state item of members / children / direct descendents of the current group item (as returned by 'getMembers()'). Must be a group item.
   * Filters for items not {@link isUninitialized}.
   * @returns {Item} item with the minimum state
   */
  get membersMin() {
    return this.members.filter(item => !item.isUninitialized).reduce((min, item) => parseFloat(item.state) < parseFloat(min.state) ? item : min);
  }

  /**
   * Maximum state item of members / children / direct descendents of the current group item (as returned by 'getMembers()'). Must be a group item.
   * Filters for items not {@link isUninitialized}.
   * @returns {Item} item with the maximum state
   */
  get membersMax() {
    return this.members.filter(item => !item.isUninitialized).reduce((min, item) => parseFloat(item.state) > parseFloat(min.state) ? item : min);
  }

  /**
   * Summarized value of members / children / direct descendents of the current group item (as returned by 'getMembers()'). Must be a group item.
   * Filters for items of type Number, Dimmer & Rollershutter in calculation and not {@link isUninitialized}.
   * @returns {Number} sum of states
   */
  get membersSum() {
    return this.members.filter(item => (item.type === 'NumberItem' || item.type === 'DimmerItem' || item.type === 'RollershutterItem') && !item.isUninitialized).reduce((sum, item) => sum + parseFloat(item.state), 0);
  }

  /**
   * Average value of members / children / direct descendents of the current group item (as returned by 'getMembers()'). Must be a group item.
   * Filters for items of type Number, Dimmer & Rollershutter in calculation and not {@link isUninitialized}.
   * @returns {Number} average of states
   */
  get membersAvg() {
    const numbers = this.members.filter(item => (item.type === 'NumberItem' || item.type === 'DimmerItem' || item.type === 'RollershutterItem') && !item.isUninitialized);
    return numbers.reduce((avg, item) => { return avg + parseFloat(item.state)/numbers.length; }, 0);
  }
  
  /**
   * All descendents of the current group item (as returned by 'getAllMembers()'). Must be a group item.
   * @returns {Item[]} all descendent items
   */
  get descendents() {
    return this.jsItem.descendents;
  }

  /**
   * Names of all descendents of the current group item (as returned by 'getAllMembers()'). Must be a group item.
   * @returns {Array} names of descendent items
   */
  get descendentsNames() {
    return this.descendents.map(item => item.name);
  }

  /**
   * Labels of all descendents of the current group item (as returned by 'getAllMembers()'). Must be a group item.
   * @returns {String} states of descendent items as concatenated string
   */
  get descendentsLabelsString() {
    return this.descendents.map(item => item.label).join(', ');
  }

  /**
   * Minimum state item of all descendents of the current group item (as returned by 'getAllMembers()'). Must be a group item.
   * Filters for items not {@link isUninitialized}.
   * @returns {Item} item with the minimum state
   */
  get descendentsMin() {
    return this.descendents.filter(item => !item.isUninitialized).reduce((min, item) => parseFloat(item.state) < parseFloat(min.state) ? item : min);
  }

  /**
   * Maximum state item of all descendents of the current group item (as returned by 'getAllMembers()'). Must be a group item.
   * Filters for items not {@link isUninitialized}.
   * @returns {Item} item with the maximum state
   */
  get descendentsMax() {
    return this.descendents.filter(item => !item.isUninitialized).reduce((min, item) => parseFloat(item.state) > parseFloat(min.state) ? item : min);
  }

  /**
   * Summarized value of all descendents of the current group item (as returned by 'getAllMembers()'). Must be a group item.
   * Filters for items of type Number, Dimmer & Rollershutter in calculation and not {@link isUninitialized}.
   * @returns {Number} sum of states
   */
  get descendentsSum() {
    return this.descendents.filter(item => (item.type === 'NumberItem' || item.type === 'DimmerItem' || item.type === 'RollershutterItem') && !item.isUninitialized).reduce((sum, item) => sum + parseFloat(item.state), 0);
  }

  /**
   * Average value of all descendents of the current group item (as returned by 'getAllMembers()'). Must be a group item.
   * Filters for items of type Number, Dimmer & Rollershutter in calculation and not {@link isUninitialized}.
   * @returns {Number} average of states
   */
  get descendentsAvg() {
    const numbers = this.descendents.filter(item => (item.type === 'NumberItem' || item.type === 'DimmerItem' || item.type === 'RollershutterItem') && !item.isUninitialized);
    return numbers.reduce((avg, item) => { return avg + parseFloat(item.state)/numbers.length; }, 0);
  }
  
  /**
   * Count the number of members / children / direct descendents of the current group item (as returned by 'getMembers()') matching a comparison. Must be a group item.
   * @param {String} compareFunc comparison function
   * @returns {Number} number of matches
   * @example
   * items.getItem('group').membersCount(item => item.state === 'ON');
   */
  membersCount(compareFunc) {
    return this.members.filter(compareFunc).length;
  }

  /**
   * Count the number of all descendents of the current group item (as returned by 'getAllMembers()') matching a comparison. Must be a group item.
   * @param {String} compareFunc comparison function
   * @returns {Number} number of matches
   * @example
   * items.getItem('group').descendentsCount(item => item.state === 'ON');
   */
  descendentsCount(compareFunc) {
    return this.descendents.filter(compareFunc).length;
  }
}

/**
 * Gets a instance of groupUtils.
 * @memberOf items
 * @param {String} name the name of the item
 * @returns {items.groupUtils} the grouputils
 */
const getGroup = (name) => {
  return new groupUtils(items.getItem(name));
};

module.exports = {
  getGroup,
  groupUtils
};