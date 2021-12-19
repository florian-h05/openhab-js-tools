/**
 * @namespace items
 */

// Wrapper for the official JS library
const { items } = require('openhab');
const { getItem, getItemsByTag, Item } = items;

module.exports = {
  getItem,
  getItemsByTag,
  Item
};
