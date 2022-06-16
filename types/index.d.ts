/**
 * Native Java openHAB State (instance of {@link https ://www.openhab.org/javadoc/latest/org/openhab/core/types/state org.openhab.core.types.State})
 */
export type HostState = any;
/**
 * Native Java openHAB Item (instance of {@link https ://www.openhab.org/javadoc/latest/org/openhab/core/items/item org.openhab.core.items.Item})
 */
export type HostItem = any;
/**
 * Native Java Class Object (instance of java.lang.Class)
 */
export type HostClass = any;
/**
 * Native Jave openHAB Rule (instance of {@link https ://www.openhab.org/javadoc/latest/org/openhab/core/automation/rule org.openhab.core.automation.Rule})
 */
export type HostRule = any;
/**
 * Native Jave openHAB Trigger (instance of {@link https ://www.openhab.org/javadoc/latest/org/openhab/core/automation/trigger org.openhab.core.automation.Trigger})
 */
export type HostTrigger = any;
/**
 * Native Java openHAB Thing (instance of {@link https ://www.openhab.org/javadoc/latest/org/openhab/core/thing/thing org.openhab.core.thing.Thing})
 */
export type HostThing = any;
declare const rulesx: {
    alerting: typeof import("./rulesx/alerting");
    getAlarmClock: typeof import("./rulesx/alarmClock").getAlarmClock;
    createAlarmClockItems: typeof import("./rulesx/alarmClock").createAlarmClockItems;
    getSceneEngine: (sceneDefinition: {
        controller: string;
        scenes: any[];
    }) => HostRule;
};
declare const itemutils: {
    getRoofwindowOpenLevel: (baseItem: string) => itemutils.roofwindowState;
    dimmer: (managerID: string, targetItem: string, targetState: number, step: number, time: number, ignoreExternalChange?: boolean, overwrite?: boolean) => void;
    getGroup: (name: string) => itemutils.GroupUtils;
};
export {};
//# sourceMappingURL=index.d.ts.map