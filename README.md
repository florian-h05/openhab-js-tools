# Tools for the openHAB JS automation addon

This library provides some utilites for the openHAB JS Scripting Add-On.

## Table of Contents
- [Table of Contents](#table-of-contents)
- [Installation](#installation)
  - [sceneEngine](#sceneengine)
    - [Create the scene definition](#create-the-scene-definition)
      - [sceneTargets](#scenetargets)
    - [Create the scene rule](#create-the-scene-rule)

## Installation

- Install the openHAB [JavaScript binding](https://www.openhab.org/addons/automation/jsscripting/), a version of the [openHAB
library](https://www.npmjs.com/package/openhab) will be automatically installed and available to all javascript rules by default.
- Go to the javascript user scripts directory: `cd $OPENHAB_CONF/automation/js`
- Run `npm i florianh-openhab-tools` (you may need to install npm)

### sceneEngine
Allows the user to call scenes using a selectorItem and update the selectorItem to the matching scene on scene members' change.
It creates a full rule with triggers and actions out of your scene definition array.

#### Create the scene definition
Scene definition works as in this example:
```javascript
var scenes = [
  { // sceneSelector, identified by selectorItem
    selectorItem: 'F2_Florian_Szene',
    selectorStates: [
      { // a selectorState, itentified by selectorValue
        selectorValue: 1, // everything off
        sceneTargets: [
          { item: 'Florian_Licht', value: 'OFF', required: true },
          { item: 'Florian_LED_Stripes', value: 'OFF', required: true }
        ] 
      },
      {
        selectorValue: 15,
        sceneTargets: [
          { item: 'Florian_LED_Stripes', value: 'ON', required: true }
        ]
      }
    ]
  }
];
```
##### sceneTargets
Identifier | Purpose | Type
-|-|-
`item` | Name of the openHAB Item. | String
`value` | Target value for the scene in a string. | String
`required` | Whether to ignore changes of that item. | Boolean

#### Create the scene rule
```javascript
require('sceneEngine.js').getJSRule(scene, 'example engine');
```