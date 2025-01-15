# Simple Docker Sample

This sample shows communication and interfacing between frontend and backend contributions.

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

This URCap uses a Flask framework to run a REST server on port 5000. 

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

View the backend output by using the container ID associated with the `universal-robots_simple-docker_simple-docker-backend` image (e.g. 8e3)

```shell
docker logs -f <container_id>
```

## Frontend Contribution

The frontend contribution is built in Angular using no external libraries. The application node contains an input field, and a button that writes the input field data to the backend. 
It also contains a button to fetch the backend data, as well as an input field that is only changes from the fetch button interaction.

### Frontend Output

When you type something into the "Data to send to the backend" field, and press the "Write data to Backend", the data will be updated in the 
"Shows data currently saved in the backend contribution" field.