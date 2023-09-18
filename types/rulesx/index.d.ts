declare const _exports: {
    alerting: typeof import("./alerting");
    createAlarmClock: typeof import("./alarmClock.js").createAlarmClock;
    createAlarmClockItems: typeof import("./alarmClock.js").createAlarmClockItems;
    createSceneEngine: (sceneDefinition: {
        controller: string;
        scenes: {
            value: number;
            targets: {
                item: string;
                value: string;
                required?: boolean;
                conditionFn?: Function;
            }[];
        }[];
    }) => void;
};
export = _exports;
//# sourceMappingURL=index.d.ts.map