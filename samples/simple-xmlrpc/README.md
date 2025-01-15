# Simple XML-RPC Sample

This sample contains an example of how to communicate from both URScript and the frontend with a backend using XML-RPC (no 3rd party libraries required).

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

This URCap uses a Flask framework to start a REST service on port 12345, and run the `xmlrpc_server.py` script.

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

View the backend output by using the container ID associated with the `universal-robots_simple-xmlrpc_simple-xmlrpc-backend` image (e.g. 8e3)

```shell
docker logs -f <container_id>
```

Here is the expected output, after interacting with the application node components in the simulator.

```shell
Listening on address: 0.0.0.0:12345
172.18.0.4 - - [29/May/2024 08:48:25] "POST / HTTP/1.0" 200 -
172.18.0.4 - - [29/May/2024 08:48:27] "POST / HTTP/1.0" 200 -
172.18.0.4 - - [29/May/2024 08:48:27] "POST / HTTP/1.0" 200 -
172.18.0.4 - - [29/May/2024 08:48:35] "POST / HTTP/1.0" 200 -
172.18.0.4 - - [29/May/2024 08:48:35] "POST / HTTP/1.0" 200 -
172.18.0.4 - - [29/May/2024 08:48:40] "POST / HTTP/1.0" 200 -
Recieved Great Job! which is an <class 'str'>. Sending it back.
Recieved Great Job! which is an <class 'str'>. Sending it back.
172.18.0.4 - - [29/May/2024 08:48:40] "POST / HTTP/1.0" 200 -
Recieved 10 which is an <class 'int'>. Sending it back.
172.18.0.4 - - [29/May/2024 08:48:52] "POST / HTTP/1.0" 200 -
172.18.0.4 - - [29/May/2024 08:48:53] "POST / HTTP/1.0" 200 -
Recieved 10 which is an <class 'int'>. Sending it back.
Recieved {'name': 'John', 'age': 30.7, 'address': {'city': 'Odense', 'zipCode': 5220}, 'hobbies': ['Reading', 'Gardening']} which is an <class 'dict'>. Sending it back.
172.18.0.4 - - [29/May/2024 08:49:02] "POST / HTTP/1.0" 200 -
Recieved {'name': 'John', 'age': 30.7, 'address': {'city': 'Odense', 'zipCode': 5220}, 'hobbies': ['Reading', 'Gardening']} which is an <class 'dict'>. Sending it back.
172.18.0.4 - - [29/May/2024 08:49:02] "POST / HTTP/1.0" 200 -
```

## Frontend Contribution

The example includes buttons in the application node that sends XML-RPC requests to the server that unpacks it and directly returns the message to the client again.

### XML-RPC Client Library (Front-end)

The URCap contains an XML-RPC Client library (located in the `xmlrpc/` folder in the front-end) that automatically serialises four out of the six (4/6) supported value types used in XML-RPC communication (`int`, `double`, `boolean` and `string`). It additionally handles arrays and structs of any combination (e.g. array of structs, struct of structs, etc.). The values, arrays and struct section is based on [http://xmlrpc.com/spec.md](http://xmlrpc.com/spec.md).

#### Values (`<value>`)

| Tag         | Type                                          | Example       |
|-------------|-----------------------------------------------|---------------|
| `<int>`     | four-byte signed integer                      | -12           |
| `<double>`  | double-precision signed floating point number | -3.14         |
| `<boolean>` | 0 (false) or 1 (true)                         | 1             |
| `<string>`  | string                                        | "hello world" |

#### Arrays (`<array>`)

A value can also be of type `<array>`. An `<array>` contains a single `<data>` element, which can contain any number of `<value>`s.

**Example:**

```xml
<array>
    <data>
        <value><int>12</int></value>
        <value><double>3.14</double></value>
        <value><string>Denmark</string></value>
        <value><boolean>0</boolean></value>
    </data>
</array>
```

#### Structs (`<struct>`)

A value can also be of type `<struct>`. A `<struct>` contains `<member>`s and each `<member>` contains a `<name>` and a `<value>`.

**Example:**

```xml
<struct>
    <member>
        <name>lowerBound</name>
        <value><int>18</int></value>
    </member>
    <member>
        <name>upperBound</name>
        <value><int>139</int></value>
    </member>
</struct>
```


#### Introspection Functions
If the XML-RPC server has registered the introspection functions (`SimpleXMLRPCServer.register_introspection_functions()`) then it is possible for the client to ask for a list of methods using the (`system.listMethods`) function.

Example:

```ts
// Create URL for contacting the backend
const url = this.applicationAPI.getContainerContributionURL(VENDOR_ID, URCAP_ID, 'simple-xmlrpc-backend', 'xmlrpc');

// Create instance of XmlRpcClient
this.xmlrpc = new XmlRpcClient(`${location.protocol}//${url}/`);

// Get list of available methods on the server
const response = await this.xmlrpc.methodCall('system.listMethods');
```

**Please Note** that URScript cannot handle list of strings so avoid calling `system.listMethods` from there.

#### Serialise data (client -> server)
Whenever the client calls an XML-RPC methods with parameters, these are serialised in the XML-RPC client library. The below shows the "Send Struct" example:

```xml
<?xml version="1.0"?>
<methodCall>
  <methodName>echo_struct_method</methodName>
  <params>
    <param>
      <struct>
        <member>
          <name>name</name>
          <value><string>John</string></value>
        </member>
        <member>
          <name>age</name>
          <value><double>30.7</double></value>
        </member>
        <member>
          <name>address</name>
          <struct>
            <member>
              <name>city</name>
              <value><string>Odense</string></value>
            </member>
            <member>
              <name>zipCode</name>
              <value><int>5220</int></value>
            </member>
          </struct>
        </member>
        <member>
          <name>hobbies</name>
          <array>
            <data>
              <value><string>Reading</string></value>
              <value><string>Gardening</string></value>
            </data>
          </array>
        </member>
      </struct>
    </param>
  </params>
</methodCall>
```

#### Deserialise (server -> client)

When the XML-RPC method returns, the `<methodResponse>` is unpacked and the data is deserialised into a JS object.

Example:

```ts
{
    name: "John",
    age: 30.7,
    address: {
        city: "Odense",
        zipCode: 5220
    },
    city: "Odense",
    zipCode: 5220,
    hobbies: [
        "Reading",
        "Gardening"
    ]
}
```

### Frontend Output

After building and installing the URCap onto the simulator, open the simulator in a Chromium browser. The Simple XMLRPC Application Node will be found under the Application tab on the left.

Double click one of the four buttons to see the data that is sent to the backend. The data will the be sent back to the frontend. To see the backend behavior, 
open the backend contribution logs as shown above.
