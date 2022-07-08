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
export function getSceneEngine(sceneDefinition: {
    controller: string;
    scenes: Array<any>;
}): HostRule;
//# sourceMappingURL=sceneEngine.d.ts.map