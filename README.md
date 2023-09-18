# openHAB JS Automation Tools

This library provides some utilites for the openHAB JS Scripting Add-On.

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

This library depends on `openhab` >= 4.6.0 (which is included since openHAB 4.1.0 Milestone 2) and `openhab_rules_tools` >= 2.0.1.

`openhab_rules_tools` will automatically get installed by npm, `openhab` is already included with the add-on.
Just make sure you have a compatible version installed (use `console.log(utils.OPENHAB_JS_VERSION)` to check the currently used version).

## API

To have a look at all capabilities of this library, have a look at the [JSDoc()](https://florian-h05.github.io/openhab-js-tools/index.html).

The README will only take care of the most important stuff, and explain the more complicated ones.

### `itemutils`

- `dimItem`: Dims an Item step-by-step to a target state.
- `getGroupUtils`: See [Group Utilities](#group-utilities)

#### Group Utilities

The Group Utilities provide a number of functions on groups, e.g. arithmetic operations like min/max and count operations.

##### Examples

```javascript
const { itemutils } = require('@hotzware/openhab-tools');
// The name of the member with the maximum state.
itemutils.getGroupUtils(group).membersMax.name;
// The sum of states.
itemutils.getGroupUtils(group).membersSum;
// Count how many members are on.
itemutils.getGroupUtils(group).membersCount(item => item.state === 'ON');
```

See [JSDoc: GroupUtils](https://florian-h05.github.io/openhab-js-tools/itemutils.GroupUtils.html) for full API documentation.

### `rulesx`

- `createAlarmClock`: See [Alarm Clock](#alarm-clock).
- `createAlarmClockItems`: Creates the required Items for an alarm clock and optionally also generates Sitemap code.
- `createSceneEngine`: See [Scene Engine](#scene-engine).

#### Alarm Clock

Creates an alarm clock with time and days configurable over Items, therefore compatible with Sitemaps.

Under the hood, two rules are created. 
The first rule, the so-called manager rule, watches for configuration changes and updates the cron trigger of the second rule, the alarm clock itself.
It also disables and enables the alarm clock rule based on the _switchItem_.

##### Required Items

Configuration Items must follow a specific naming scheme, _switchItem_ can be anything.

| Itemname-Suffix     | Purpose                            |
|---------------------|------------------------------------|
| _switchItem_        | Enable/disable alarm               |
| _switchItem_`_H`    | Hour                               |
| _switchItem_`_M`    | Minute                             |
| _switchItem_`_MON`  | Monday                             |
| _switchItem_`_TUE`  | Tuesday                            |
| _switchItem_`_WED`  | Wednesday                          |
| _switchItem_`_THU`  | Thursday                           |
| _switchItem_`_FRI`  | Friday                             |
| _switchItem_`_SAT`  | Saturday                           |
| _switchItem_`_SUN`  | Sunday                             |
| _switchItem_`_Time` | Displays the alarm time as String. |

##### Alarm Rule

```javascript
rulesx.createAlarmClock(switchItem, data => { console.log('Successfully tested alarm clock.'); });
```

See [JSDoc: getAlarmClock()](https://florian-h05.github.io/openhab-js-tools/rulesx.html#.getAlarmClock) for full API documentation.

#### Scene Engine

Call scene by sending a command to the `sceneItem`.

When a member of the scene changes it's state, the rule will check whether a 
defined scene is matching the current states and which scene.

It creates a full rule with triggers and actions out of your scene definition.

###### The `sceneItem`

Must be a Number item.
You can assign a scene to every positive integer value, except to 0.

0 is the value the Item is et to when no match with a scene is found on members' change.

###### Scene definition

Scene definition works with an array of objects.

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

##### Create the Scene Engine

```javascript
rulesx.createSceneEngine(sceneDefinition);
```

See [JSDoc: createSceneEngine()](https://florian-h05.github.io/openhab-js-tools/rulesx.html#.createSceneEngine) for full API documentation.

### `thingsx`

- `createReEnableThingWithItemRule`: Creates a rule that re-enabled a Thing on command ON to a given Item.
- `createThingStatusRule`: Creates a rule that posts Thing statuses to String Items.
- `reEnableThing`: Re-enables a Thing by first disabling and then enabling it again.
- `MlscRestClient`: Class providing state fetching from and command sending to [music_led_strip_control](https://github.com/TobKra96/music_led_strip_control).
