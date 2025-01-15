"""Simple ROS2 Node for UR Backend"""

import os

import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, QoSDurabilityPolicy, QoSHistoryPolicy, QoSReliabilityPolicy, QoSLivelinessPolicy

from urinterfaces.msg import Analog, AnalogIOStateStamped
from urinterfaces.srv import SetAnalogOutput


class SimpleROS2Node(Node):
    """Creates a ROS Node"""

    def __init__(self):
        self.namespace = os.getenv('ROS2_NAMESPACE')
        super().__init__('simple_ros2_node', namespace=self.namespace)

        self.qos_profile = QoSProfile(
            depth=1,
            history=QoSHistoryPolicy.KEEP_LAST,
            liveliness=QoSLivelinessPolicy.AUTOMATIC,
            reliability=QoSReliabilityPolicy.BEST_EFFORT,
            durability=QoSDurabilityPolicy.VOLATILE
        )

        self.subscription = self.create_subscription(
            AnalogIOStateStamped,
            'control_box_analog_io',
            self.submit_value_callback,
            self.qos_profile)

        self.client = self.create_client(SetAnalogOutput, 'set_standard_analog_output')
        while not self.client.wait_for_service(timeout_sec=1.0):
            self.get_logger().info(f'Robot Controller ({self.namespace}) not accessible, waiting again...')
        self.get_logger().info(f'Using Robot Controller: {self.namespace}')

    def submit_value_callback(self, msg):
        """Submits the value from analog output pin 0 to pin 1

        Args:
            msg (ROS message): The message
        """
        self.get_logger().info(f'Incoming request {msg}')
        domain = Analog.CURRENT
        value = 0.0

        # Find the values for pin 0
        for analog in msg.io_state.analog_outputs:
            if analog.pin == 0:
                domain = analog.domain
                value = analog.value

        # Set the value for pin 1
        req = SetAnalogOutput.Request()
        req.data = [Analog(pin=1, domain=domain, value=value)]
        self.client.call_async(req)


def main(args=None):
    """Main Entrance"""
    rclpy.init(args=args)
    simple_ros2_node = SimpleROS2Node()
    simple_ros2_node.get_logger().info('Simple ROS2 Node, a sample where standard '
                                       'analog out 0 is sent to standard analog out 1')

    try:
        rclpy.spin(simple_ros2_node)
    except KeyboardInterrupt:
        simple_ros2_node.get_logger().info('Ctrl-C detected, shutting down')
    finally:
        simple_ros2_node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
