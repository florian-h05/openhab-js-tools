export type Item = object;
/**
 * Gets an instance of groupUtils.
 * @memberof itemutils
 * @param {string} groupName the name of the group
 * @returns {GroupUtils} {@link itemutils.GroupUtils}
 */
export function getGroupUtils(groupName: string): GroupUtils;
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
declare class GroupUtils {
    /**
     * Creates an instance of groupUtils. Don't use this constructor, instead call {@link getGroup}.
     * @param {Item} groupItem Item from 'openhab'
     * @hideconstructor
     */
    constructor(groupItem: Item);
    jsItem: any;
    /**
     * Members / children / direct descendents of the current group Item (as returned by 'getMembers()')
     * @type {Item[]}
     */
    get members(): any[];
    /**
     * Names of members / children / direct descendents of the current group Item (as returned by 'getMembers()')
     * @type {string[]}
     */
    get membersNames(): string[];
    /**
     * Labels of members / children / direct descendents of the current group Item (as returned by 'getMembers()') as a concatenated string
     * @type {string}
     */
    get membersLabelsString(): string;
    /**
     * Minimum state item of members / children / direct descendents of the current group Item (as returned by 'getMembers()')
     * Filters for items not {@link isUninitialized}.
     * @type {Item}
     */
    get membersMin(): any;
    /**
     * Maximum state item of members / children / direct descendents of the current group Item (as returned by 'getMembers()')
     * Filters for items not {@link isUninitialized}.
     * @type {Item}
     */
    get membersMax(): any;
    /**
     * Summarized value of members / children / direct descendents of the current group Item (as returned by 'getMembers()')
     * Filters for items of type Number, Dimmer & Rollershutter in calculation and not {@link isUninitialized}.
     * @type {number}
     */
    get membersSum(): number;
    /**
     * Average value of members / children / direct descendents of the current group Item (as returned by 'getMembers()')
     * Filters for items of type Number, Dimmer & Rollershutter in calculation and not {@link isUninitialized}.
     * @type {number}
     */
    get membersAvg(): number;
    /**
     * All descendents of the current group Item (as returned by 'getAllMembers()')
     * @type {Item[]}
     */
    get descendents(): any[];
    /**
     * Names of all descendents of the current group item (as returned by 'getAllMembers()'). Must be a group item.
     * @type {string[]}
     */
    get descendentsNames(): string[];
    /**
     * Labels of all descendents of the current group item (as returned by 'getAllMembers()'). Must be a group item.
     * @type {string}
     */
    get descendentsLabelsString(): string;
    /**
     * Minimum state item of all descendents of the current group Item (as returned by 'getAllMembers()')
     * Filters for items not {@link isUninitialized}.
     * @type {Item}
     */
    get descendentsMin(): any;
    /**
     * Maximum state item of all descendents of the current group Item (as returned by 'getAllMembers()')
     * Filters for items not {@link isUninitialized}.
     * @type {Item}
     */
    get descendentsMax(): any;
    /**
     * Summarized value of all descendents of the current group Item (as returned by 'getAllMembers()')
     * Filters for items of type Number, Dimmer & Rollershutter in calculation and not {@link isUninitialized}.
     * @type {number}
     */
    get descendentsSum(): number;
    /**
     * Average value of all descendents of the current group Item (as returned by 'getAllMembers()')
     * Filters for items of type Number, Dimmer & Rollershutter in calculation and not {@link isUninitialized}.
     * @type {number}
     */
    get descendentsAvg(): number;
    /**
     * Count the number of members / children / direct descendents of the current group Item (as returned by 'getMembers()') matching a comparison
     * @param {function} compareFunc comparison function
     * @returns {number} number of matches
     * @example
     * itemutils.getGroup('group').membersCount(item => item.state === 'ON');
     */
    membersCount(compareFunc: Function): number;
    /**
     * Count the number of all descendents of the current group Item (as returned by 'getAllMembers()') matching a comparison
     * @param {function} compareFunc comparison function
     * @returns {number} number of matches
     * @example
     * itemutils.getGroup('group').descendentsCount(item => item.state === 'ON');
     */
    descendentsCount(compareFunc: Function): number;
}
export {};
//# sourceMappingURL=groups.d.ts.map