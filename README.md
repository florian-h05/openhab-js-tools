# openHAB JS Automation Tools

This library provides some utilites for the openHAB JS Scripting Add-On.

The JavaScript Add-On is using the NodeJS version found in [openhab/openhab-addons/bundles/org.openhab.automation.jsscripting/pom.xml](https://github.com/openhab/openhab-addons/blob/main/bundles/org.openhab.automation.jsscripting/pom.xml#L53) (currently v16.17.1).

Please note that it depends on the [openHAB JavaScript Library](https://github.com/openhab/openhab-js), which is included in the JS Scripting Add-On by default.
Therefore, it is only listed in the devDependencies of this package.

[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg)](https://github.com/standard/semistandard)
[![npm version](https://badge.fury.io/js/@hotzware%2Fopenhab-tools.svg)](https://badge.fury.io/js/@hotzware%2Fopenhab-tools)

## Installation

- Requires the openHAB [JavaScript binding](https://www.openhab.org/addons/automation/jsscripting/) which comes with a version of the [openHAB
library](https://www.npmjs.com/package/openhab).
- Go to the javascript user scripts directory: `cd $OPENHAB_CONF/automation/js`
- Run `npm install @hotzware/openhab-tools` (you may need to install npm)

## Compatibility

This library depends on `openhab` >= 3.1.0 (which is included since openHAB 3.4.x) and `openhab_rules_tools` >= 2.0.1.

## Scene Engine

Call scene by sending a command to the `sceneItem`.

When a member of the scene changes it's state, the rule will check whether a 
defined scene is matching the current states and which scene.

It creates a full rule with triggers and actions out of your scene definition.

### The `sceneItem`
Must be a Number item.
You can assign a scene to every positive integer value, 
except to 0.

0 is the value the Item gets when no match with a scene is found on members change.

### Scene definition
Scene defintion works with an array of objects.

```javascript
const sceneDefinition = {
  controller: 'scene call item name',
  scenes: [ // For each numeric state of the controller Item one object.
    { // Object for the value 1 of the controller Item.
      value: 1,
      targets: [ // Target states of items in the scene. Parameters explained later.
        { item: 'Florian_Licht', value: 'ON', required: true, conditionFn: function() { return parseFloat(items.getItem('Helligkeit').state) >= 10000; } },
        { item: 'Florian_LED_Stripes', value: 'OFF', required: false }
      ] 
    },
    { // Object for the value 15 of the controller Item.
      value: 15,
      targets: [ // Target states of items in the scene. Parameters explained later.
        { item: 'Florian_LED_Stripes', value: 'ON', required: true }
      ]
    }
  ]
};
```

See [JSDoc: getSceneEngine()](https://florian-h05.github.io/openhab-js-tools/rulesx.html#.getSceneEngine) for full API documentation.

### Scene rule

```javascript
rulesx.getSceneEngine(sceneDefinition);
```

## Alarm Clock

Provides an alarm clock that is configured via Items.

Under the hood, two rules are created. The first rule, so called manager rule, watches for configuration changes and updates the cron trigger of the second rule, the alarm clock itself.
It also disables and enables the alarm clock rule based on the _switchItem_.

### Required Items

Configuration Items must follow a specific naming scheme, _switchItem_ can be anything.

| Itemname-Suffix       | Purpose                            |
|-----------------------|------------------------------------|
| _switchItem_          | Enable/disable alarm               |
| _switchItem_``_H``    | Hour                               |
| _switchItem_``_M``    | Minute                             |
| _switchItem_``_MON``  | Monday                             |
| _switchItem_``_TUE``  | Tuesday                            |
| _switchItem_``_WED``  | Wednesday                          |
| _switchItem_``_THU``  | Thursday                           |
| _switchItem_``_FRI``  | Friday                             |
| _switchItem_``_SAT``  | Saturday                           |
| _switchItem_``_SUN``  | Sunday                             |
| _switchItem_``_Time`` | Displays the alarm time as String. |

### Alarm Rule
```javascript
rulesx.getAlarmClock(switchItem, data => { console.log('Successfully tested alarm clock.'); });
```

See [JSDoc: getAlarmClock()](https://florian-h05.github.io/openhab-js-tools/rulesx.html#.getAlarmClock) for full API documentation.

***
## Group Utilities

The Group Utilities provide a number of functions on groups, e.g. arithmetic operations like min/max and count operations.

### Examples
```javascript
const { itemutils } = require('@hotzware/openhab-tools');
// The name of the member with the maximum state.
itemutils.getGroup(group).membersMax.name;
// The sum of states.
itemutils.getGroup(group).membersSum;
// Count how many members are on.
itemutils.getGroup(group).membersCount(item => item.state === 'ON');
```

See [JSDoc: GroupUtils](https://florian-h05.github.io/openhab-js-tools/itemutils.GroupUtils.html) for full API documentation.

## Item Dimmer

The Item Dimmer allows you to dim a given item step-by-step to a target state.
Dimming step size and time between steps are configurable.

The dimmer uses the cache to avoid that multiple dimmers are running on the same Item at same time.
Therefore, it is recommended to use the same `managerID` in UI based scripts.

Only for file based scripts: To avoid that the dimmer manager crashes due to file reload during dimming process, use the [`scriptUnloaded`](https://github.com/openhab/openhab-js#scriptunloaded) function to clear the cache. 
You may use multiple `managerID`s to not cancel all dimmers when one script reloads.

```javascript
var MANAGER_KEY = 'managerID';
itemutils.dimmer(MANAGER_KEY, targetItem, targetState, step, time, ignoreExternalChange);

// Only for file based scripts:
scriptUnloaded = function () {
  cache.remove(MANAGER_KEY);
};
```

See [JSDoc: dimmer()](https://florian-h05.github.io/openhab-js-tools/itemutils.html#.dimmer) for full API documentation.

### Example
```javascript
itemutils.dimmer('sampleManager', 'Kitchen_Lights', 100, 1, 1000);
```
This dims the kitchen light to 100% with steps of 1% each second.

## music_led_strip_control REST client

The `thingsx.MlscRestClientClass` enables openHAB to control effect and color of a RGB stripe connected to [music_led_strip_control](https://github.com/TobKra96/music_led_strip_control).

See [JSDoc: MlscRestClient](https://florian-h05.github.io/openhab-js-tools/thingsx.MlscRestClient.html) for full API documentation.
