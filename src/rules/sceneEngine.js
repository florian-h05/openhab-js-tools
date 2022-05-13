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
   * @param {*} sceneDefiniton definition of scenes following a special scheme (see README.md)
   * @hideconstructor
   */
  constructor (sceneDefinition) {
    if (typeof sceneDefinition.controller !== 'string') {
      throw Error('selectorItem is not supplied or is not string!');
    }
    if (typeof sceneDefinition.scenes !== 'object') {
      throw Error('selectorValues is not an Array!');
    }
    this.controller = sceneDefinition.controller;
    this.scenes = sceneDefinition.scenes;
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
   * @param {Number} sceneNumber value of selectorState / number of scene to call
   */
  callScene (sceneNumber) {
    sceneNumber = parseInt(sceneNumber);
    // Get the correct selectorState.
    for (let j = 0; j < this.scenes.length; j++) {
      // Get the correct sceneTargets.
      if (this.scenes[j].value === sceneNumber) {
        console.info(`Call scene: Found selectorState [${this.scenes[j].value}] of sceneSelector [${this.controller}].`);
        const targets = this.scenes[j].targets;
        // Send commands to member items.
        for (let curTarget = 0; curTarget < targets.length; curTarget++) {
          console.info(`Call scene: Commanding ${targets[curTarget].item} to ${targets[curTarget].value}.`);
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
    for (let curState = 0; curState < this.scenes.length && sceneFound === false; curState++) {
      let statesMatchingValue = true;
      // Checks whether sceneTargets are matching. As soon as one is not matching it's target value, the next selector state is checked.
      for (let curTarget = 0; curTarget < this.scenes[curState].targets.length && statesMatchingValue === true; curTarget++) {
        const target = this.scenes[curState].targets[curTarget];
        if (!(target.required === false)) {
          const itemState = items.getItem(target.item).state.toString();
          console.debug(`Check scene (selectorState [${this.scenes[curState].value}] of sceneSelector [${this.controller}]): Checking scene member [${target.item}] with state [${itemState}].`);
          // Check whether the current item states does not match the target state.
          if (!(
            (itemState === target.value) ||
             (itemState === '0' && target.value.toString().toUpperCase() === 'OFF') ||
             (itemState === '100' && target.value.toString().toUpperCase() === 'ON') ||
             (itemState === '0' && target.value.toString().toUpperCase() === 'UP') ||
             (itemState === '100' && target.value.toString().toUpperCase() === 'DOWN')
          )) {
            statesMatchingValue = false;
            console.debug(`Check scene (selectorState [${this.scenes[curState].value}] of sceneSelector [${this.controller}]): Scene member [${target.item}] with state [${itemState}] does not match [${target.value}].`);
          }
        }
      }
      // When all members match the target value
      if (statesMatchingValue === true) {
        console.info(`Check scene: Found matching selectorValue [${this.scenes[curState].value}] of sceneSelector [${this.controller}].`);
        // Store the current selectorValue, that is matching all required targets.
        selectorValueMatching = this.scenes[curState].value;
        sceneFound = true;
      }
      // Update sceneSelector.
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
