# Simple Gripper Sample

This sample uses ROS2 to enable a device that is attached to the robot tool flange, and connected via the tool serial interface.

Refer to the gripper contribution section in the [official documentation](https://docs.universal-robots.com/) for more information.

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

### manifest.yaml 

The serial device is called in the `manifest.yaml` file with the code below.

```yaml
containers:
    - id: simple-gripper-backend
      image: simple-gripper-backend
      mounts:
        - mount: tmpfs:/root/.ros
          access: rw
      devices:
        - type: ttyTool
```

### ROS2 Topics and Services

The sample exposes the following topics and services. 

| ROS interface   | name        | Type                             | Response                               | Description                  |
|-----------------|-------------|----------------------------------|----------------------------------------|------------------------------|
| Publish Topic   | /status     | std_msg.msg/String               |                                        | Grippers current state       |
| Expose Service  | /set_force  | rcl_interfaces.srv/SetParameters | rcl_interfaces.msg/SetParametersResult | Configure the gripping force |
| Subscribe Topic | /open_close | std_msg.msg/String               |                                        | Gripper action               |
| Expose Service  | /open_close | rcl_interfaces.srv/SetParameters | rcl_interfaces.msg/SetParametersResult | Gripper action               |

The `main.py` file sets up the ROS2 topics, services, and other functionalities in the URCap.

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

View the backend output by using the container ID associated with the `universal-robots_simple-gripper_simple-gripper-backend` image (e.g. 8e3)

```shell
docker logs -f <container_id>
```

An expected output from the docker log would be: 

```shell
[INFO] [1716891835.590466015] [UR8888.Vendor_universal_robots.URCap_simple_gripper]: Initializing simple-gripper ROS2 Node
[INFO] [1716891835.600503588] [UR8888.Vendor_universal_robots.URCap_simple_gripper]: Subscribing on: URCap_simple_gripper/open_close
SIMULATOR: Initializing serial communication at dev/ur-ttylink/ttyTool
[INFO] [1716891835.602921895] [UR8888.Vendor_universal_robots.URCap_simple_gripper]: Started ROS2 Node with namespace UR8888/Vendor_universal_robots/URCap_simple_gripper
[INFO] [1716893298.216289531] [UR8888.Vendor_universal_robots.URCap_simple_gripper]: Opening gripper
SIMULATOR: Writing data = "1"
[INFO] [1716893298.739530263] [UR8888.Vendor_universal_robots.URCap_simple_gripper]: Closing gripper
SIMULATOR: Writing data = "0"
SIMULATOR: Writing data = "1"
[INFO] [1716893301.290532902] [UR8888.Vendor_universal_robots.URCap_simple_gripper]: Opening gripper
```

## Frontend Contribution

The gripper sample includes both an application node and a program node. Both generates URscript and communicates directly with the gripper backend.
Both the application node and program node uses the utility functions in `RosHelper.ts` to handle the ROS2 communication with the backend. This is where the 
frontend can access the two exposed services shown in the chart above.

### Frontend Output

The application node allows you to toggle the gripper and set the grip force value. The screen also shows the status of the gripper. 
The program node allows you to open or close the gripper, as well as set conditional behaviors on success or failure.