# Grip Distance Sample

This project contains an example of interaction between a program and application node.
The application node uses the generate preamble behavior to demonstrate how a URCap would write to the preamble.

Refer to the [official documentation](https://docs.universal-robots.com/) for more information.

## Build and Deploy Sample

In order to build and deploy this sample, use the commands below. A rebuild of the project is required to see any changes made to the source code.  If you are deploying the URCap to URSim, ensure that you have started the simulator.

### Dependencies

Run this command to install the dependencies of the project.

```shell
npm install
```

### Build

Run this command to build the contribution type.

```shell
npm run build
```

### Installation

Run this command to install the built URCap to the simulator.

```shell
npm run install-urcap
```

Run this command to install the built URCap to the robot.

```shell
npm run install-urcap -- --host <robot_ip_address>
````

## Backend Contribution 

This sample does not contain any backend contributions.

## Frontend Contribution

The frontend contribution is built in Angular using no external libraries. The application node contains two input fields that allow the user to set the open and close distance for the gripper.
The program node allows the user to toggle the gripper.

The program node behavior worker can access the grip distance with the line below.

```typescript
const applicationNode = await api.applicationService.getApplicationNode('ur-sample-gripdistance-application') as GripDistanceApplicationNode;
```

The `ur-sample-gripdistance-application` tag is defined in the `contribution.json` file. 

```json
{
    "applicationNodes": [
        {
            "translationPath": "assets/i18n/",
            "behaviorURI": "gripdistance-application.worker.js",
            "presenterURI": "main.js",
            "componentTagName": "ur-sample-gripdistance-application"
        }
    ],
    "programNodes": [
        {
            "...": ""
        }
    ]
}
      
```

### Frontend Output 

The changes made to the min and max gripper values set in the application node will be reflected on the program node toggle labels.

