/**
 * Copyright (c) 2021 Florian Hotze
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0
 *
 * SPDX-License-Identifier: EPL-2.0
 */

const { items, rules, triggers } = require('openhab');
const logger = require('openhab').log('org.openhab.automation.js.openhab-tools.rulesx.SceneEngine');

/**
 * Scene Engine
 *
 * Call scenes using a selectorItem and update the selectorItem to the matching scene on scene members' change.
 * @memberof rulesx
 */
class SceneEngine {
  /**
   * Constructor to create an instance. Do not call directly, instead call {@link getSceneEngine}.
   * @param {*} sceneDefiniton definition of scenes following a special scheme
   * @param {String} engineId id of this instance
   * @hideconstructor
   */
  constructor (sceneDefinition) {
    if (typeof sceneDefinition.selectorItem !== 'string') {
      throw Error('selectorItem is not supplied or is not string!')
    }
    if (typeof sceneDefinition.selectorState !== 'object') {
      throw Error('selectorValues is not an Array!')
    }
    this.scenes = sceneDefinition;
  }

  /**
   * Gets all required triggers for the scene rule.
   * For selectorItems command triggers, for scene members change triggers.
   * Scene members that are not required are excluded from the triggers.
   * @private
   * @returns {triggers[]} rule triggers
   */
  getTriggers () {
    const ruleTriggers = [];
    const updateTriggers = [];
    logger.debug('Adding ItemCommandTrigger for [{}].', this.scenes.selectorItem);
    ruleTriggers.push(triggers.ItemCommandTrigger(this.scenes.selectorItem));
    // For each selectorState.
    for (let j = 0; j < this.scenes.selectorStates.length; j++) {
       const currentState = this.scenes.selectorStates[j];
      // For for each sceneTarget, the member items that are required (default is required).
      for (let k = 0; k < currentState.sceneTargets.length; k++) {
        const target = currentState.sceneTargets[k];
        if (target.required !== false && updateTriggers.indexOf(target.item) === -1) {
          updateTriggers.push(target.item);
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
   * Calls the scene. Sets the scene members to the given target state.
   * @private
   * @param {Number} sceneNumber value of selectorState / number of scene to call
   */
  callScene (sceneNumber) {
    // Get the correct selectorState.
    for (let curState = 0; curState < this.scenes.selectorStates.length; curState++) {
      // Get the correct sceneTargets.
      if (this.scenes.selectorStates[curState].selectorValue === sceneNumber) {
        logger.info('Call scene: Found selectorState [{}] of sceneSelector [{}].', this.scenes.selectorStates[curState].selectorValue, this.scenes.selectorItem);
        const targets = this.scenes.selectorStates[curState].sceneTargets;
        // Send commands to member items.
        for (let curTarget = 0; curTarget < targets.length; curTarget++) {
          items.getItem(targets[curTarget].item).sendCommand(targets[curTarget].value);
        }
      }
    }
  }

  /**
   * When a scene member changes, check whether a scene and which scene matches all required targets.
   * @private
   */
  checkScene () {
    let selectorValueMatching = 0; // The selector value of the matching scene.
    let sceneFound = false;
    // Check each selectorState. The first one matching is used.
    for (let curState = 0; curState < this.scenes.selectorStates.length && sceneFound === false; curState++) {
      let statesMatchingValue = true;
      // Checks whether sceneTargets are matching. As soon as one is not matching it's target value, the next selector state is checked.
      for (let curTarget = 0; curTarget < this.scenes.selectorStates[curState].sceneTargets.length && statesMatchingValue === true; curTarget++) {
        const target = this.scenes.selectorStates[curState].sceneTargets[curTarget];
        if (!(target.required === false)) {
          const itemState = items.getItem(target.item).state.toString();
          logger.debug('Check scene (selectorState [{}] of sceneSelector [{}]): Checking scene member [{}] with state [{}].', this.scenes.selectorStates[curState].selectorValue, this.scenes.selectorItem, target.item, itemState);
          // Check whether the current item states does not match the target state.
          if (!(
            (itemState === target.value) ||
             (itemState === '0' && target.value.toString().toUpperCase() === 'OFF') ||
             (itemState === '100' && target.value.toString().toUpperCase() === 'ON') ||
             (itemState === '0' && target.value.toString().toUpperCase() === 'UP') ||
             (itemState === '100' && target.value.toString().toUpperCase() === 'DOWN')
          )) {
            statesMatchingValue = false;
            logger.debug('Check scene (selectorState [{}] of sceneSelector [{}]): Scene member [{}] with state [{}] does not match [{}].', this.scenes.selectorStates[curState].selectorValue, this.scenes.selectorItem, target.item, itemState, target.value);
          }
        }
      }
      // When all members match the target value
      if (statesMatchingValue === true) {
        logger.info('Check scene: Found matching selectorValue [{}] of sceneSelector [{}].', this.scenes.selectorStates[curState].selectorValue, this.scenes.selectorItem);
        // Store the current selectorValue, that is matching all required targets.
        selectorValueMatching = this.scenes.selectorStates[curState].selectorValue;
        sceneFound = true;
      }
      // Update sceneSelector.
      items.getItem(this.scenes.selectorItem).postUpdate(selectorValueMatching);
    }
  }

  /**
   * The JSRule to run the scene engine.
   * @private
   * @returns {HostRule} openHAB Rule
   */
  getRule () {
    return rules.JSRule({
      name: 'SceneEngine for selectorItem' + this.scenes.selectorItem,
      description: 'Rule to run the SceneEngine.',
      triggers: this.getTriggers(),
      execute: event => {
        if (event.triggerType === 'ItemCommandTrigger') {
          logger.info('Call scene: Event [{}] of [{}].', event.triggerType, event.itemName);
          this.callScene(event.itemName);
        } else if (event.triggerType === 'ItemStateChangeTrigger') {
          logger.info('Check scene: Event [{}] of [{}].', event.triggerType, event.itemName);
          this.checkScene();
        }
      }
    });
  }
}

/**
 * Provides the {@link rulesx.SceneEngine}.
 * @memberof rulesx
 * @param {*} scenes scenes definiton, have a look at the README
 * @returns {HostRule} SceneEngine rule
 *
 * @example
 * rulesx.getSceneEngine(scenes, engineId);
 */
const getSceneEngine = (scenes) => {
  return new SceneEngine(scenes).getRule();
};

module.exports = {
  getSceneEngine
};
