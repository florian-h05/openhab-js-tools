/**
 * Provides the {@link rulesx.SceneEngine}.
 * @memberof rulesx
 * @param {object} sceneDefinition scenes definition
 * @param {string} sceneDefinition.controller name of Item that calls the scenes
 * @param {object[]} sceneDefinition.scenes Array of scenes
 * @param {number} sceneDefinition.scenes[].value integer identifying the scene
 * @param {object[]} sceneDefinition.scenes[].targets Array of scene members
 * @param {string} sceneDefinition.scenes[].targets[].item name of Item
 * @param {string} sceneDefinition.scenes[].targets[].value target state of Item
 * @param {boolean} [sceneDefinition.scenes[].targets[].required=true] whether the Item's state must match the target state when the engine gets the current scene on change of a member
 * @param {function} [sceneDefinition.scenes[].targets[].conditionFn] the Item is only commanded and required for scene checks if the evaluation of this function returns true
 * @returns {HostRule} SceneEngine rule
 */
export function getSceneEngine(sceneDefinition: {
    controller: string;
    scenes: {
        value: number;
        targets: {
            item: string;
            value: string;
            required?: boolean;
            conditionFn?: Function;
        };
    };
}): HostRule;
//# sourceMappingURL=sceneEngine.d.ts.map