import { ProgramNode, URVariable, Waypoint, TabInputModel } from '@universal-robots/contribution-api';

export enum WaypointType {
    Teach = 'teach',
    Expression = 'expression',
}

export interface SampleAssignmentNode extends ProgramNode {
    type: 'ur-sample-node-assignment';
    parameters: {
        variable: TabInputModel<URVariable>;
        waypoint?: Waypoint;
        waypointType: WaypointType;
    };
}
