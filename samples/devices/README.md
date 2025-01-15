# Devices Sample

This project aims to provide a practical understanding of URCap development, device hooks, and device interaction in an easily digestible format.
It provides a simple flask server with endpoints that allow you to interact with a device and gather information about its status. While an Arduino is used for this example, you can substitute it with any other device of your choice. For setup and installation instructions, refer to the [README](./_setup/README.md) file in the `_setup` folder.

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

1. The backend container expecting devices to be plugged in must contain `on_device_add` & `on_device_remove` executables and must have exact names.
2. These files must be placed in the root (`/`) directory. You can verify their placement with the following commands:

   ```bash
   ls -l /on_device_add
   ls -l /on_device_remove
   ```
3. The device hooks (`on_device_add`/`on_device_remove`) must be executable files with execution permissions. You can set these permissions with the following commands:

   ```bash
   chmod +x /on_device_add
   chmod +x /on_device_remove
   ```

Flask server is running in the background container. After installing the URCap, you can make curl requests. For more details, refer to the file [api](./device/src/rest/api.py).

#### Get List of Owned Devices

To retrieve a list of owned devices, execute the following command. Replace `<robot_ip>` with the IP address of the robot and `<my_device_type>` with either 'serial' or 'video'.

```bash
curl -X GET http://<robot_ip>/universal-robots/devices-demo/device/rest-api/owned_devices?device_type=<my_device_type>
```

#### Get Invocation Logs

To retrieve the invocation logs related to `on_add_device` and `on_remove_device`, execute the following command. Replace `<robot_ip>` with the IP address of the robot.

```bash
curl -X GET http://<robot_ip>/universal-robots/devices-demo/device/rest-api/invocation_logs
```

#### Echo a Serial Device

To echo a serial device, execute the following command. Replace `<robot_ip>` with the IP address of the robot. Note that the logic may need to be adjusted to match your device.

```bash
curl -X GET http://<robot_ip>/universal-robots/devices-demo/device/rest-api/serial/echo -H "Content-Type: application/json" -d '{"device": "/dev/ttyUSB0", "baud": 115200, "timeout_s": 10.0, "sent_msg": "hello world", "expected_msg": "hello world OK", "reset_delay_s": 0.5}'
```

### Backend Output

Here are some ways to debug `on_device_add`.

### Monitor the Execution Events

List the active docker containers with

```shell
docker ps
```

Monitor `exec_create` and `exec_start` events for a specific container. Replace `<container_id>` with the ID of your `ursim-polyscopex-runtime-1` image (e.g. 8e3).

```bash
docker events --filter 'event=exec_create' --filter 'event=exec_start' --filter 'container=<container_id>'
```

### Execute the Event Manually

You can manually trigger the `on_device_add` event using the `docker exec` command.

```shell
docker exec -it ursim-polyscopex-runtime-1 bash
```
You can find more documentation on the `docker exec` functionality [here](https://docs.docker.com/reference/cli/docker/container/exec/).

Your terminal prompt should have switched from `psxdev@<vsc_container_id>:/pwd/$ ` to `<ursim_container_id>:/pwd/# `, meaning you can now execute commands within your simulator docker container.

Now, you can run this command to trigger the `on_device_add` event. 

```bash
/on_device_add '{"idProduct":"6001","idVendor":"0403","logicalDevices":[{"deviceNode":"/dev/ttyUSB0","major":188,"minor":0}],"manufacturer":"FTDI","product":"USB-RS485 Cable","serial":"AU064DZK","urDeviceType":"SERIAL","urDeviceAPIVersion":"0.1"}'
```

If you do not wish to trigger the `on_device_add` event inside the simulator docker container, you can run this command directly from your development container:

```bash
docker exec -it ursim-polyscopex-runtime-1 /on_device_add '{"idProduct":"6001","idVendor":"0403","logicalDevices":[{"deviceNode":"/dev/ttyUSB0","major":188,"minor":0}],"manufacturer":"FTDI","product":"USB-RS485 Cable","serial":"AU064DZK","urDeviceType":"SERIAL","urDeviceAPIVersion":"0.1"}'
```

## Frontend Contribution

There are no frontend contributions in this URCap sample.