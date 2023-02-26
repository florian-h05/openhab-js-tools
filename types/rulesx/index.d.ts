declare const _exports: {
    alerting: typeof import("./alerting");
    getAlarmClock: typeof import("./alarmClock.js").getAlarmClock;
    createAlarmClockItems: typeof import("./alarmClock.js").createAlarmClockItems;
    getSceneEngine: (sceneDefinition: {
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
    }) => object;
};
export = _exports;
//# sourceMappingURL=index.d.ts.map