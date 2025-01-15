# UR Program Nodes Sample

This project contains various program node examples.

## Build and Deploy Sample

In order to build and deploy this sample, use the commands below. A rebuild of the project is required to see any changes made to the source code. If you are deploying the URCap to URSim, ensure that you have started the simulator.

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
```

## Backend Contribution

This sample does not contain any backend contributions.

## Frontend Contribution

The frontend contribution is built in Angular using no external libraries. The program nodes included in this sample are

-   assignment
-   loop
-   move-to
-   set
-   tool-force
-   wait

### Frontend Output

After building and installing the URCap onto the simulator, open the simulator in a Chromium browser. You will find the program nodes under commands when
you add a new program node.
