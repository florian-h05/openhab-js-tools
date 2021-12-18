# openHAB JS Automation Tools

This library provides some utilites for the openHAB JS Scripting Add-On.

Please note that it depents on the [openHAB JavaScript Library](https://github.com/openhab/openhab-js), which is included in the JS Scripting Add-On by default.
Therefore it is not listed in the dependencies of this package.

[![js-semistandard-style](https://raw.githubusercontent.com/standard/semistandard/master/badge.svg)](https://github.com/standard/semistandard)
[![npm version](https://badge.fury.io/js/florianh-openhab-tools.svg)](https://badge.fury.io/js/florianh-openhab-tools)

## Table of Contents
- [Table of Contents](#table-of-contents)
- [Installation](#installation)
- [Scene Engine](#scene-engine)
  - [The `sceneItem`](#the-sceneitem)
  - [Scene definition](#scene-definition)
  - [Scene rule](#scene-rule)

***
## Installation

- Install the openHAB [JavaScript binding](https://www.openhab.org/addons/automation/jsscripting/), a version of the [openHAB
library](https://www.npmjs.com/package/openhab) will be automatically installed and available to all javascript rules by default.
- Go to the javascript user scripts directory: `cd $OPENHAB_CONF/automation/js`
- Run `npm i florianh-openhab-tools` (you may need to install npm)

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
`required` | Whether that member must match the target state when the scene is checked. | Boolean | defaults to true

### Scene rule
NOTE: The sceneEngine was developed for file-based JavaScript rules, 
therefore create a script in the directory ``$OPENHAB_CONF/automation/js`` and not in the UI.
```javascript
require('sceneEngine.js').getJSRule(scenes, 'example engine');
```
Parameter | Purpose | required
-|-|-
scenes | The scene definition array of objects. | yes
engineId | The id of the scene engine, used in description. | yes
