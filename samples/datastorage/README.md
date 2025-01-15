# Data Storage Sample

This project provides an understanding, and examples of various ways to handle storage in a URcap container. 
Key takeaway points include persistent volumes, permanent volumes, tmpfs mounts, and removable storage. We'll also explore the potential risks, such as data loss, associated with volume mounts.

Refer to the [official documentation](https://docs.universal-robots.com/) for more information.

## Types of Volume Mounts

Different types of volume mounts in Docker serve distinct use cases. Each comes with its own advantages and disadvantages.

### Persistent Volumes

Persistent Volumes retain data beyond the lifecycle of individual containers. Subsequently, the data in the persistent volume remains intact even when a container is stopped. This preservation of data applies even during URCap updates and/or upgrades. These volumes are particularly useful when you need to preserve data across container restarts — such as long-term data found in database files and application logs. Typically, this type of storage resides on the host filesystem.

### Permanent Volumes

Permanent volumes work like persistent volumes with one key exception: Data is not deleted when the associated URCap is deleted. This way the permanent data will be available to the URCap when installed again.

### tmpfs mounts

In contrast to Persistent Volumes, tmpfs mounts are temporary filesystems residing in memory or the host's swap space. All content in tmpfs is cleared when the container stops, leading to high-speed but non-persistent storage. tmpfs mounts are ideal for storing sensitive information that should not be written to disk or temporary data that doesn't need to persist. However, note that data in tmpfs mounts is lost during urcap updates/upgrades.

### Removable Storage

Removable storage generally refers to physical storage devices like USB drives, external hard drives, or SD cards. Direct use of removable storage with Docker is less common because Docker performs best with consistently available storage. However, you can technically use removable storage with Docker if the storage is present and mounted on the host system. This mounted directory can then serve as a Docker volume.

## Risk of Data Loss with Volume Mounts

Regardless of the volume mount type (Persistent, tmpfs, or Removable Storage), data loss can occur when a volume is mounted onto an existing directory in a Docker container.

When a volume mount "covers" a directory with pre-existing data, the data becomes obscured and inaccessible for the duration of the mount. It's crucial to note that this doesn't result in permanent data deletion or loss, but from the perspective of applications running inside the container, it seems as though the data has been lost.

To avoid obscuring crucial data, ensure that the target directory for volume mounts is specifically designed for this purpose and does not contain data required while the volume is mounted.


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

[//]: # (TODO: WRITE MORE INFO ON BACKEND, FLASK, ETC)

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

View the backend output by using the container ID associated with the `universal-robots_data-storage-demo_data-storage` image (e.g. 8e3)

```shell
docker logs -f <container_id>
```

Here is an example output.

```shell
2024-05-22 13:46:01,782 [INFO] __main__: Hello World!
 * Serving Flask app 'src.rest.api'
 * Debug mode: on
2024-05-22 13:46:01,814 [INFO] werkzeug: WARNING: This is a development server. Do not use it in a production deployment. Use a production WSGI server instead.
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:8000
 * Running on http://172.18.0.15:8000
2024-05-22 13:46:01,814 [INFO] werkzeug: Press CTRL+C to quit
2024-05-22 13:46:01,818 [INFO] werkzeug:  * Restarting with stat
2024-05-22 13:46:02,084 [INFO] __main__: Hello World!
2024-05-22 13:46:02,092 [WARNING] werkzeug:  * Debugger is active!
2024-05-22 13:46:02,097 [INFO] werkzeug:  * Debugger PIN: 200-200-791
```

## Frontend Contribution

There are no frontend contributions in this URCap sample.