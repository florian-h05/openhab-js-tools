# openHAB JS Automation Tools

This library provides some utilites for the openHAB JS Scripting Add-On.

The JavaScript Add-On is using the NodeJS version found in [openhab/openhab-addons/bundles/org.openhab.automation.jsscripting/pom.xml](https://github.com/openhab/openhab-addons/blob/main/bundles/org.openhab.automation.jsscripting/pom.xml#L53) (currently v12.16.1).

Please note that it depends on the [openHAB JavaScript Library](https://github.com/openhab/openhab-js), which is included in the JS Scripting Add-On by default.
Therefore it is only listed in the devDependencies of this package.

[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg)](https://github.com/standard/semistandard)
[![npm version](https://badge.fury.io/js/@hotzware%2Fopenhab-tools.svg)](https://badge.fury.io/js/@hotzware%2Fopenhab-tools)

## Table of Contents
- [Table of Contents](#table-of-contents)
- [Installation](#installation)
- [Scene Engine](#scene-engine)
  - [The `sceneItem`](#the-sceneitem)
  - [Scene definition](#scene-definition)
  - [Scene rule](#scene-rule)
- [Alarm Clock](#alarm-clock)
  - [Required Items](#required-items)
  - [Alarm Rule](#alarm-rule)
- [Group Utilities](#group-utilities)
  - [Examples](#examples)
- [Item Dimmer](#item-dimmer)
  - [Example](#example)

***
## Installation

- Requires the openHAB [JavaScript binding](https://www.openhab.org/addons/automation/jsscripting/) which comes with a version of the [openHAB
library](https://www.npmjs.com/package/openhab).
- Go to the javascript user scripts directory: `cd $OPENHAB_CONF/automation/js`
- Run `npm install @hotzware/openhab-tools` (you may need to install npm)

***
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
const scenes = [ // For each sceneItem one object.
  { // Object of the first sceneItem.
    selectorItem: 'scene call item name',
    selectorStates: [ // For each numeric state of the sceneItem one object.
      { // Object for the value 1 of the sceneItem.
        selectorValue: 1,
        sceneTargets: [ // Target states of items in the scene. Parameters explained later.
          { item: 'Florian_Licht', value: 'ON', required: true },
          { item: 'Florian_LED_Stripes', value: 'OFF', required: false }
        ] 
      },
      { // Object for the value 15 of the sceneItem.
        selectorValue: 15,
        sceneTargets: [ // Target states of items in the scene. Parameters explained later.
          { item: 'Florian_LED_Stripes', value: 'ON', required: true }
        ]
      }
    ]
  }
];
```
__sceneTargets__' parameters
Identifier | Purpose | Type | Required
-|-|-|-
`item` | Name of a scene member. | String | yes
`value` | Target state of that member. | String | yes
`required` | Whether that member must match the target state when the scene is checked. | Boolean | no, defaults to true

### Scene rule
```javascript
require('@hotzware/openhab-tools').rulesx.getSceneEngine(scenes, engineId);
```
Parameter | Purpose | required
-|-|-
scenes | The scene definition array of objects. | yes
engineId | The id of the scene engine, used in description. | yes

***
## Alarm Clock
Provides an alarm clock that is configured via Items.

Under the hood, two rules are created. The first rule, so called manager rule, watches for configuration changes and updates the cron trigger of the second rule, the alarm clock itself.
It also disable and enables the alarm clock rule based on the _switchItem_.

### Required Items
Configuration Items must follow a specific naming scheme, _switchItem_ can be anything.
Itemname-Suffix | Purpose
-|-
_switchItem_ | Enable/disable alarm
_switchItem_``_H`` | Hour
_switchItem_``_M`` | Minute
_switchItem_``_MON`` | Monday
_switchItem_``_TUE`` | Tuesday
_switchItem_``_WED`` | Wednesday
_switchItem_``_THU`` | Thursday
_switchItem_``_FRI`` | Friday
_switchItem_``_SAT`` | Saturday
_switchItem_``_SUN`` | Sunday
_switchItem_``_Time`` | Displays the alarm time as String.

### Alarm Rule
```javascript
require('@hotzware/openhab-tools').rulesx.getAlarmClock(switchItem, data => { console.log('Successfully tested alarm clock.'); });
```

***
## Group Utilities
The Group Utilities provide a number of functions on groups, e.g. arithmetic operations like min/max and count operations.

For supported methods look at the [GroupUtils JSDoc](https://florian-h05.github.io/openhab-js-tools/itemutils.GroupUtils.html).

These are a GraalJS compatible fork of the my original `groupUtils` from [rkoshak/openhab-rules-tools](https://github.com/rkoshak/openhab-rules-tools/tree/main/group_utils).

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

***
## Item Dimmer
The Item Dimmer allows you to dim a given item step-by-step to a target state.
Dimming step size and time between steps are configurable.

The dimmer uses the cache to avoid that multiple dimmers are running on the same Item at same time.
Therefore it is recommended to use the same `managerID` in UI based scripts.

Only for file based scripts: To avoid that the dimmer manager crashes due to file reload during dimming process, use the [`scriptUnloaded`](https://github.com/openhab/openhab-js#scriptunloaded) function to clear the cache. 
You may use multiple `managerID`s to not cancel all dimmers when one script reloads.

```javascript
var MANAGER_KEY = 'managerID';
require('@hotzware/openhab-tools').itemutils.dimmer(MANAGER_KEY, targetItem, targetState, step, time, ignoreExternalChange);

// Only for file based scripts:
scriptUnloaded = function () {
  cache.remove(MANAGER_KEY);
};
```
Parameter | Purpose | type | required
-|-|-|-
managerID | id used for cache | string | yes
targetItem | name of Item to control, item must support float states | string | yes
targetState | target to dim to | number | yes
step | size of dimming steps | number | yes
time | time in milliseconds between each step | number | yes
ignoreExternalChange | whether to ignore large Item state changes during dimming, default to false | boolean | no

### Example
```javascript
require('@hotzware/openhab-tools').itemutils.dimmer('sampleManager', 'Kitchen_Lights', 100, 1, 1000);
```
This dims the kitchen light to 100% with steps of 1% each second.
