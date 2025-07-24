declare const _exports: {
    AlertManager: typeof import("./alertManager");
    createRainAlarmRule: typeof import("./alerting").createRainAlarmRule;
    createTemperatureAlarmRule: typeof import("./alerting").createTemperatureAlarmRule;
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