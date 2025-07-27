# openHAB JS Automation Tools

This library provides some utilities for the openHAB JS Scripting Add-On.

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

This library depends on `openhab` >= 5.12.0 (which is included since openHAB 5.1.0).

`openhab_rules_tools` will automatically get installed by npm, `openhab` is already included with the add-on.
Just make sure you have a compatible version installed (use `console.log(utils.OPENHAB_JS_VERSION)` to check the currently used version).

## Conventions

### Window States

Whilst contacts normally only have a binary state, `0` for `CLOSED` and `1` for `OPEN`, this is sometimes not enough.

Especially speaking about windows, most windows have more than a simple open or closed state.
Normal German windows have three states: Closed, tilted, opened.
I even have windows in the rooftop with four states: Closed, small ventilation (a bit opened), large ventilation (more opened), (fully) opened.

To work with these more complex states, the following convention is made:

- `0` represents `CLOSED`
- `0.3` represents small ventilation
- `0.5` represents tilted and large ventilation
- `1` represents `OPEN`

In general, any decimal in the range `(0, 1]` represents some form of open.
By still using 0 and 1 for closed and open, this format is compatible with the binary format, just round up the float using `Math.ceil()`.

If the closed state is required, this library will check for equality to 0.
If any opened state is required, it will check for greater than 0.

## API

To have a look at all capabilities of this library, have a look at the [JSDoc](https://florian-h05.github.io/openhab-js-tools/index.html).

The README will only take care of the most important stuff, and explain the more complicated ones.

### `itemutils`

#### `dimItem`

Dims an Item step-by-step to a target state.

```js
const { itemutils } = require('@hotzware/openhab-tools');
// Dim the Bedroom_Light to 50% in 750 seconds (1% each 15 seconds).
itemutils.dimItem('Bedroom_Light', 50.0, 1, 15 * 1000);
```

See [JSDoc: dimItem()](https://florian-h05.github.io/openhab-js-tools/itemutils.html#.dimItem) for full API documentation.

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

This namespace provides complete rules with specific functionality such as alarm clock and open window alerting.
It also provides the utilities it uses internally in its rules.
The rules from this namespace are developed to be created from file-based scripts only!

#### `createAlarmClock` & `createAlarmClockItems`

Create an alarm clock with time and days configurable over Items, therefore compatible with Sitemaps.

Under the hood, two rules are created: 
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
const { rulesx } = require('@hotzware/openhab-tools');
rulesx.createAlarmClock(switchItem, data => { console.log('Successfully tested alarm clock.'); });
```

See [JSDoc: getAlarmClock()](https://florian-h05.github.io/openhab-js-tools/rulesx.html#.getAlarmClock) for full API documentation.

#### `createSceneEngine`

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
const { rulesx } = require('@hotzware/openhab-tools');
rulesx.createSceneEngine(sceneDefinition);
```

See [JSDoc: createSceneEngine()](https://florian-h05.github.io/openhab-js-tools/rulesx.html#.createSceneEngine) for full API documentation.

#### `createRainAlarmRule`

Create a rule that issues alerts for open windows and doors when its raining.

It is able to additionally check wind speed thresholds before issuing alerts, as e.g. for tilted windows, high wind speeds can push the rain through the open part.
Once a condition for an alert is not fulfilled any more, the alert is revoked.
How alerts are sent and revoked is configurable, as well as the alert message.
The message can even depend on the state of the window or door, i.e. is the window tilted or fully open.

```js
const { rulesx } = require('@hotzware/openhab-tools');
rulesx.alerting.createRainAlarmRule({
  sendAlertCallback: (id, msg) => {
    actions.notificationBuilder(msg).withReferenceId('rainalarm-' + id).send();
  },
  revokeAlertCallback: (id) => {
    actions.notificationBuilder().withReferenceId('rainalarm-' + id).hide().send();
  },
  rainalarmItemName: 'RainSensor',
  rainalarmActiveState: 'ON',
  contactGroupName: 'gRainalarm',
  messagePattern: 'Alert! It is raining and %LABEL is open!',
  windspeedItemName: 'WindSpeed',
  contactLevelToWindspeed: [
    { contactLevel: 0.3, treshold: Quantity('12 m/s') },
    { contactLevel: 0.5, treshold: Quantity('7 m/s') }
  ]
});
```

See [JSDoc: createRainAlarmRule()](https://florian-h05.github.io/openhab-js-tools/rulesx.html#.createRainAlarmRule) for full API documentation.

#### `createTemperatureAlarmRule`

Create a rule that issues alerts based on a temperature condition for open windows and doors. 

Similarly to the [`createRainAlarmRule](#createrainalarmrule), it handles issuing and revocation of alerts.
It is even more configurable, with optional alerting delays, the message and additional conditions per Item being supported through the required callbacks.
The `createTemperatureAlarmRule` function returns another function that can be used to mute alerts for specific contact Items for a given duration.

```js
const { rulesx } = require('@hotzware/openhab-tools');
const muteAlert = rulesx.alerting.createTemperatureAlarmRule({
  name: 'Frost Alarm',
  sendAlertCallback: (id, msg) => {
    actions.notificationBuilder(msg).withReferenceId('frostalarm-' + id).send();
  },
  revokeAlertCallback: (id) => {
    actions.notificationBuilder().withReferenceId('frostalarm-' + id).hide().send();
  },
  temperatureItemName: 'OutsideTemperature',
  contactGroupName: 'gFrostalarm',
  alarmConditionCallback: (temperature) => {
    return temperature.lessThanOrEqual('12 °C');
  },
  delayCallback: (temperature, contactLevel) => {
    let delay = 10; // base delay
    if (temperature.greaterThan('2 °C')) delay += 10; // add 10 minutes if warning only
    if (contactLevel === 0.5) delay += 5; // add 5 minutes if tilted or large ventilation
    if (contactLevel === 0.3) delay += 10; // add 10 minutes if small ventilation
    return delay;
  },
  messagePatternCallback: (temperature, contactLevel) => {
    if (temperature.greaterThan('2 °C')) return 'Warning: Close %LABEL, it is cold outside and it has been open long enough.';
    return 'Frost Alert: Close %LABEL, it has been open long enough!';
  },
  perItemConditionCallback: (temperature, item) => {
    // validate that inside it is at least two degress Celsius warmer than outside
    const insideTemperature = items.getItem(item.name.split('_')[0] + '_Temperature', true)?.quantityState;
    if (!insideTemperature) return true;
    const difference = insideTemperature.subtract(outside);
    return difference.greaterThanOrEqual('2 °C');
  }
});

// Mute alerts for LivingRoom_Window for 10 minutes
muteAlert('LivingRoom_Window_Contact', 10);
```

See [JSDoc: createTemperatureAlarmRule()](https://florian-h05.github.io/openhab-js-tools/rulesx.html#.createTemperatureAlarmRule) for full API documentation.

#### `AlertManager`

The powerful class behind the alerting rules, managing alerts throughout their entire lifecylce.

See [JSDoc: AlertManager](https://florian-h05.github.io/openhab-js-tools/rulesx.AlertManager.html) for full API documentation.

### `thingsx`

- `createReEnableThingWithItemRule`: Creates a rule that re-enables a Thing on command `ON` to a given Item.
- `createThingStatusToItemRule`: Creates a rule that posts Thing statuses to String Items.
- `createThingStatusNotificationRule`: Creates a rule that sends a notification when a Thing goes offline and back online.
- `reEnableThing`: Re-enables a Thing by first disabling and then enabling it again.
- `MlscRestClient`: Class providing state fetching from and command sending to [music_led_strip_control](https://github.com/TobKra96/music_led_strip_control).

See [JSDoc: thingsx](https://florian-h05.github.io/openhab-js-tools/thingsx.html) for full API documentation.
