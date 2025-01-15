# Calibration Info Sample

This project allows users to view the robot's calibration data.
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

This example builds a Java application, and uses a shell script to check the health status of the Java process in order to get the robot callibration info. 

### Backend Output

Having built and installed the URCap in the simulator you can open your terminal to see the output from the backend:

```shell
docker exec -it ursim-polyscopex-runtime-1 bash
```

You can find more documentation on the `docker exec` functionality [here](https://docs.docker.com/reference/cli/docker/container/exec/).

Your terminal prompt should have switched from `psxdev@<vsc_container_id>:/pwd/$ ` to `<ursim_container_id>:/pwd/# `, meaning you can now execute commands within your simulator docker container.

List the active docker containers with

```shell
docker ps
```

View the backend output by using the container ID associated with the `universal-robots_calibration-info_calibration-info` image (e.g. 8e3)

```shell
docker logs -f <container_id>
```

Here is an example output.

```shell
CalibrationInfo{
    jointChecksums=[4294967295, 4294967295, 4294967295, 4294967295, 4294967295, 4294967295],
    theta=[0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    a=[0.0, -0.425, -0.3922, 0.0, 0.0, 0.0],
    d=[0.1625, 0.0, 0.0, 0.1333, 0.0997, 0.0996],
    alpha=[1.570796327, 0.0, 0.0, 1.570796327, -1.570796327, 0.0],
    calibrationStatus=0}
Shutting down...
URCap was shut down!
```

## Frontend Contribution

There are no frontend contributions in this URCap sample.

