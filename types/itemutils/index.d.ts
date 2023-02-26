declare const _exports: {
    getRoofwindowOpenLevel: (baseItem: string) => any;
    dimmer: (managerID: string, targetItem: string, targetState: number, step: number, time: number, ignoreExternalChange?: boolean, overwrite?: boolean) => void;
    getGroup: (name: string) => {
        jsItem: any;
        readonly members: any[];
        readonly membersNames: any[];
        readonly membersLabelsString: string;
        readonly membersMin: any;
        readonly membersMax: any;
        readonly membersSum: number;
        readonly membersAvg: number;
        readonly descendents: any[];
        readonly descendentsNames: any[];
        readonly descendentsLabelsString: string;
        readonly descendentsMin: any;
        readonly descendentsMax: any;
        readonly descendentsSum: number;
        readonly descendentsAvg: number;
        membersCount(compareFunc: Function): number;
        descendentsCount(compareFunc: Function): number;
    };
};
export = _exports;
//# sourceMappingURL=index.d.ts.map