declare const _exports: {
    alerting: typeof import("./alerting");
    getAlarmClock: typeof import("./alarmClock.js").getAlarmClock;
    createAlarmClockItems: typeof import("./alarmClock.js").createAlarmClockItems;
    getSceneEngine: (sceneDefinition: {
        controller: string;
        scenes: any[];
    }) => HostRule;
};
export = _exports;
//# sourceMappingURL=index.d.ts.map