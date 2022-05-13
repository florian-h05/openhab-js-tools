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

/**
 * Scene Engine
 *
 * Call scenes using an Item as controller and update the Item's state to the matching scene number on scene members' change.
 * @memberof rulesx
 */
class SceneEngine {
  /**
   * Constructor to create an instance. Do not call directly, instead call {@link getSceneEngine}.
   * @param {*} sceneDefiniton definition of scenes following a special scheme (see {@link getSceneEngine})
   * @hideconstructor
   */
  constructor (sceneDefinition) {
    if (typeof sceneDefinition.controller !== 'string') {
      throw Error('controller is not supplied or is not string!');
    }
    if (typeof sceneDefinition.scenes !== 'object') {
      throw Error('scenes is not an Array!');
    }
    this.controller = sceneDefinition.controller;
    this.scenes = sceneDefinition.scenes;
  }

  /**
   * Gets all required triggers for the scene rule.
   * For the controller a command trigger, for scene members change triggers.
   * Scene members that are not required are excluded from the triggers.
   * @private
   * @returns {triggers[]} rule triggers
   */
  getTriggers () {
    const ruleTriggers = [];
    const updateTriggers = [];
    console.debug(`Adding ItemCommandTrigger for [${this.controller}].`);
    ruleTriggers.push(triggers.ItemCommandTrigger(this.controller));
    // For each selectorState.
    for (let j = 0; j < this.scenes.length; j++) {
      const currentScene = this.scenes[j];
      // For for each sceneTarget, the member items that are required (default is required).
      for (let k = 0; k < currentScene.targets.length; k++) {
        const target = currentScene.targets[k];
        if (target.required !== false && updateTriggers.indexOf(target.item) === -1) {
          updateTriggers.push(target.item);
        }
      }
    }
    for (let i = 0; i < updateTriggers.length; i++) {
      console.debug(`Adding ItemStateChangeTrigger for [${updateTriggers[i]}].`);
      ruleTriggers.push(triggers.ItemStateChangeTrigger(updateTriggers[i]));
    }
    return ruleTriggers;
  }

  /**
   * Calls the scene. Sets the scene members to the given target state.
   * @private
   * @param {Number} sceneNumber value of controller / number of scene to call
   */
  callScene (sceneNumber) {
    sceneNumber = parseInt(sceneNumber);
    // Get the correct scene value.
    for (let j = 0; j < this.scenes.length; j++) {
      // Get the correct scene targets.
      if (this.scenes[j].value === sceneNumber) {
        console.info(`Call scene: Found value [${this.scenes[j].value}] of controller [${this.controller}].`);
        const targets = this.scenes[j].targets;
        // Send commands to member items.
        for (let curTarget = 0; curTarget < targets.length; curTarget++) {
          if (typeof targets[curTarget].conditionFn === 'function') {
            const result = targets[curTarget].conditionFn();
            if (result === true) {
              console.info(`Call scene: Commanding ${targets[curTarget].item} to ${targets[curTarget].value} as condition is met (conditionFn returned ${result}).`);
              items.getItem(targets[curTarget].item).sendCommand(targets[curTarget].value);
            } else {
              console.info(`Call scene: Not commanding ${targets[curTarget].item} to ${targets[curTarget].value} as condition is not met (conditionFn returned ${result}).`);
            }
          } else {
            console.info(`Call scene: Commanding ${targets[curTarget].item} to ${targets[curTarget].value}.`);
            items.getItem(targets[curTarget].item).sendCommand(targets[curTarget].value);
          }
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
    // Check each scene. The first one matching is used.
    for (let curState = 0; curState < this.scenes.length && sceneFound === false; curState++) {
      let statesMatchingValue = true;
      // Checks whether scene's targets are matching. As soon as one is not matching it's target value, the next selector state is checked.
      for (let curTarget = 0; curTarget < this.scenes[curState].targets.length && statesMatchingValue === true; curTarget++) {
        const target = this.scenes[curState].targets[curTarget];
        if (!(target.required === false)) {
          const itemState = items.getItem(target.item).state.toString();
          console.debug(`Check scene (value [${this.scenes[curState].value}] of controller [${this.controller}]): Checking scene member [${target.item}] with state [${itemState}].`);
          let result = true;
          if (typeof target.conditionFn === 'function') {
            if (target.conditionFn() !== true) {
              console.debug(`Check scene (value [${this.scenes[curState].value}] of controller [${this.controller}]): Scene member [${target.item}] with state [${itemState}] is not required to match as conditionFn did not return true.`);
              result = false;
            }
          }
          if (result === true) {
          // Check whether the current Item state does not match the target state.
            if (!(
              (itemState === target.value) ||
             (itemState === '0' && target.value.toString().toUpperCase() === 'OFF') ||
             (itemState === '100' && target.value.toString().toUpperCase() === 'ON') ||
             (itemState === '0' && target.value.toString().toUpperCase() === 'UP') ||
             (itemState === '100' && target.value.toString().toUpperCase() === 'DOWN')
            )) {
              statesMatchingValue = false;
              console.debug(`Check scene (value [${this.scenes[curState].value}] of controller [${this.controller}]): Scene member [${target.item}] with state [${itemState}] does not match [${target.value}] or is not required to match.`);
            }
          }
        }
      }
      // When all members match the target value
      if (statesMatchingValue === true) {
        console.info(`Check scene: Found matching value [${this.scenes[curState].value}] of controller [${this.controller}].`);
        // Store the current value that is matching all required targets.
        selectorValueMatching = this.scenes[curState].value;
        sceneFound = true;
      }
      // Update controller.
      items.getItem(this.controller).postUpdate(selectorValueMatching);
    }
  }

  /**
   * The JSRule to run the scene engine.
   * @private
   * @returns {HostRule} openHAB Rule
   */
  getRule () {
    return rules.JSRule({
      name: `SceneEngine for controller ${this.controller}`,
      description: 'Rule to run the SceneEngine.',
      triggers: this.getTriggers(),
      execute: event => {
        if (event.triggerType === 'ItemCommandTrigger') {
          console.info(`Call scene: Event [${event.triggerType}] of [${event.itemName}].`);
          this.callScene(event.receivedCommand);
        } else if (event.triggerType === 'ItemStateChangeTrigger') {
          console.info(`Check scene: Event [${event.triggerType}] of [${event.itemName}].`);
          this.checkScene();
        }
      }
    });
  }
}

/**
 * Provides the {@link rulesx.SceneEngine}.
 * @memberof rulesx
 * @param {Object} sceneDefinition scenes definiton
 * @param {String} sceneDefinition.controller name of Item that calls the scenes
 * @param {Array<Object>} sceneDefinition.scenes Array of scenes
 * @param {Number} sceneDefinition.scenes[].value integer identifying the scene
 * @param {Array<Object>} sceneDefinition.scenes[].targets Array of scene members
 * @param {String} sceneDefinition.scenes[].targets[].item name of Item
 * @param {String} sceneDefinition.scenes[].targets[].value target state of Item
 * @param {Boolean} [sceneDefinition.scenes[].targets[].required=true] whether the Item's state must match the target state when the engine gets the current scene on change of a member
 * @param {Function} [sceneDefinition.scenes[].targets[].conditionFn] the Item is only commanded and required for scene checks if the evaluation of this function returns true
 * @returns {HostRule} SceneEngine rule
 */
const getSceneEngine = (sceneDefinition) => {
  return new SceneEngine(sceneDefinition).getRule();
};

module.exports = {
  getSceneEngine
};
