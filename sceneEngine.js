/*
Only works with the JS Scripting Add-On/GraalJS.
Dependents on: the official openHAB JS library 'openhab', which is pre-installed in the JS Scripting Add-On.

Copyright (c) 2021 Florian Hotze under MIT License
*/

const { items, rules, triggers } = require('openhab');
const logger = require('openhab').log('SceneEngine');

/**
 * @namespace sceneEngine
 *
 */

/**
 * Scene engine.
 * Call scenes using a selectorItem and update the selectorItem to the matching scene on scene members' change.
 * Provides a JSRule from package 'openhab'.
 * @memberOf sceneEngine
 */
class SceneEngine {
  /**
   * Constructor to create an instance. Do not call directly, instead call {@link getEngine}.
   * @param {*} sceneDefiniton definition of scenes following a special scheme
   * @param {String} engineId id of this instance
   * @hideconstructor
   */
  constructor (sceneDefinition, engineId) {
    if (typeof sceneDefinition === 'undefined') {
      logger.error('Supplied scenes are undefined');
    }
    this.scenes = sceneDefinition;
    this.engineId = engineId;
  }

  /**
   * Required triggers for the scene rule.
   * For selectorItems command triggers, for scene members change triggers.
   * @returns {*} rule triggers in openhab-js syntax
   */
  get triggers () {
    let ruleTriggers = [];
    let updateTriggers = [];
    // For each sceneSelector the selectorItem.
    for (let i = 0; i < this.scenes.length; i++) {
      const currentSelector = this.scenes[i];
      logger.debug('Adding ItemCommandTrigger for [{}].', currentSelector.selectorItem);
      ruleTriggers.push(triggers.ItemCommandTrigger(currentSelector.selectorItem));
      // For each selectorState.
      for (let j = 0; j < currentSelector.selectorStates.length; j++) {
        const currentState = currentSelector.selectorStates[j];
        // For for each sceneTarget, the member items.
        for (let k = 0; k < currentState.sceneTargets.length; k++) {
          const targetItem = currentState.sceneTargets[k].item;
          if (updateTriggers.indexOf(targetItem) === -1) {
            updateTriggers.push(targetItem);
          }
        }
      }
    }
    for (let i = 0; i < updateTriggers.length; i++) {
      logger.debug('Adding ItemStateChangeTrigger for [{}].', updateTriggers[i]);
      ruleTriggers.push(triggers.ItemStateChangeTrigger(updateTriggers[i]));
    }
    return ruleTriggers;
  }

  /**
   * Call scene.
   * @param {String} triggerItem name of scene selector that received command
   */
  callScene (triggerItem) {
    // Get the correct sceneSelector.
    for (let i = 0; i < this.scenes.length; i++) {
      const currentSelector = this.scenes[i];
      if (currentSelector.selectorItem === triggerItem) {
        // Get the correct selectorState.
        for (let j = 0; j < currentSelector.selectorStates.length; j++) {
          // Get the correct sceneTargets.
          const currentState = currentSelector.selectorStates[j];
          if (currentState.selectorValue === parseInt(items.getItem(triggerItem).state)) {
            logger.info('Call scene: Found selectorState [{}] of sceneSelector [{}].', currentState.selectorValue, currentSelector.selectorItem);
            const currentTargets = currentState.sceneTargets;
            // Send commands to member items.
            for (let k = 0; k < currentTargets.length; k++) {
              items.getItem(currentTargets[k].item).sendCommand(currentTargets[k].value);
            }
          }
        }
      }
    }
  }

  /**
   * When a scene member changes, check whether a scene and which scene matches all required targets.
   * @param {String} triggerItem name of scene member that changed
   */
  checkScene (triggerItem) {
    // Check each sceneSelector.
    for (let i = 0; i < this.scenes.length; i++) {
      let selectorValueMatching = 0;
      let updateSelectorValue = false;
      const currentSelector = this.scenes[i];
      // Check each selectorState.
      for (let j = 0; j < currentSelector.selectorStates.length; j++) {
        // Check for each sceneTarget.
        const currentState = currentSelector.selectorStates[j];
        for (let k = 0; k < currentState.sceneTargets.length; k++) {
          // Find the triggeringItem.
          if (currentState.sceneTargets[k].item === triggerItem) {
            // logger.debug('Check scene: Found triggeringItem [{}] in selectorState [{}] of sceneSelector [{}].', triggerItem, currentState.selectorValue, currentSelector.selectorItem);
            updateSelectorValue = true;
            // Check whether all required items in the selectorValue's sceneTargets match.
            let statesMatchingValue = true;
            for (let l = 0; l < currentState.sceneTargets.length; l++) {
              const target = currentState.sceneTargets[l];
              if (!(target.required === false)) {
                const itemState = items.getItem(target.item).state.toString();
                // logger.debug('Check scene: Checking scene member [{}] with state [{}].', target.item, itemState);
                // Check whether the current item states does not match the target state.
                if (!(
                  (itemState === target.value) ||
                  (itemState === '0' && target.value.toString().toUpperCase() === 'OFF') ||
                  (itemState === '100' && target.value.toString().toUpperCase() === 'ON') ||
                  (itemState === '0' && target.value.toString().toUpperCase() === 'UP') ||
                  (itemState === '100' && target.value.toString().toUpperCase() === 'DOWN')
                )) {
                  statesMatchingValue = false;
                  // logger.debug('Check scene: Scene member [{}] with state [{}] does not match [{}].', target.item, itemState, target.value);
                }
              }
            }
            if (statesMatchingValue === true) {
              logger.info('Check scene: Found matching selectorValue [{}] of sceneSelector [{}].', currentState.selectorValue, currentSelector.selectorItem);
              // Store the current selectorValue, that is matching all required targets.
              selectorValueMatching = currentState.selectorValue;
            }
          }
        }
      }
      // Update sceneSelector with the selectorValue matching all sceneTargets.
      if (updateSelectorValue) { items.getItem(currentSelector.selectorItem).postUpdate(selectorValueMatching); }
    }
  }

  /**
   * The JSRule to run the scene engine.
   * @returns {*} JSRule from openhab-js
   */
  get rule () {
    return rules.JSRule({
      name: 'SceneEngine with id: ' + this.engineId,
      description: 'Rule to run the SceneEngine.',
      triggers: this.triggers,
      execute: event => {
        if (event.triggerType === 'ItemCommandTrigger') {
          logger.info('Call scene: Event [{}] of [{}].', event.triggerType, event.itemName);
          this.callScene(event.itemName);
        } else if (event.triggerType === 'ItemStateChangeTrigger') {
          logger.info('Check scene: Event [{}] of [{}].', event.triggerType, event.itemName);
          this.checkScene(event.itemName);
        }
      }
    });
  }
}

/**
 * Creates an instance of SceneEngine and builds the rule
 * @memberOf sceneEngine
 * @param {*} scenes scenes definiton, have a look at the README
 * @param {String} engineId instance name
 * @returns {*} JSRule from openhab-js
 *
 * @example
 * require('florianh-openhab-tools').sceneEngine.getJSRule(scenes, engineId);
 */
const getJSRule = (scenes, engineId) => {
  return new SceneEngine(scenes, engineId).rule;
};

module.exports = {
  getJSRule
};