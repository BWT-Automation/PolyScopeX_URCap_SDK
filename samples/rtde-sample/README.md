# RTDE Sample

This project uses backend contributions to communicate with one of the UR client interfaces. 
This example shows how you can use the [RTDE Python Client Library](https://github.com/UniversalRobots/RTDE_Python_Client_Library?tab=readme-ov-file). 
The [RTDE guide](https://www.universal-robots.com/articles/ur/interface-communication/real-time-data-exchange-rtde-guide/) can be found here, which contains information 
on the data synchronization protocol between the UR controller and external executables.

Refer to the [official documentation](https://docs.universal-robots.com/) for more information.

## Build and Deploy Sample

In order to build and deploy this sample, use the commands below. A rebuild of the project is required to see any changes made to the source code.  If you are deploying the URCap to URSim, ensure that you have started the simulator.
**Note: This does not currently work on arm64 systems.**

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

In order to communicate with the controller, use the DNS name of the desired service as the service name within the `manifest.yaml` file. 
In this sample, the code below shows the urcontrol-rtde being made available to the contribution. 

```yaml
containers:
  - id: rtde-sample
    image: rtde-sample:late
    services:
      - service: urcontrol-rtde
    mounts:
      - mount: persistent:/app/RTDE_Python_Client_Library/examples/robot_data
        access: rw
```

Refer to the "communicate with controlller" section in the [official documentation](https://docs.universal-robots.com/) for more information on client interfaces.

### Dockerfile

The rtde-sample code is pulled directly from the RTDE Python Client Library referenced above. The Dockerfile sets up the virtual environment, 
and then runs the record.py Python script. You can change the Python script that is called in the Dockerfile, with the appropriate parameters.

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

View the backend output by using the container ID associated with the `universal-robots_rtde-sample_rtde-sample` image (e.g. 8e3)

```shell
docker logs -f <container_id>
```

View the output from robot_data.csv by running 

```shell
docker exec -it universal-robots_rtde-sample_rtde-sample sh
```

You can now see a robot_data/ directory, with the robot_data.csv file inside. 

## Frontend Contribution

There are no frontend contributions in this URCap sample.