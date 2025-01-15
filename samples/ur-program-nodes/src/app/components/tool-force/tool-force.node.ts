import { Force, Time, ProgramNode, TabInputModel } from '@universal-robots/contribution-api';

export interface SampleToolForceNode extends ProgramNode {
    type: 'ur-sample-node-tool-force';
    parameters: {
        x: {
            isValid: boolean;
            model: TabInputModel<ToolForceDirection>;
        };
        y: {
            isValid: boolean;
            model: TabInputModel<ToolForceDirection>;
        };
        z: {
            isValid: boolean;
            model: TabInputModel<ToolForceDirection>;
        };
        zeroSensor: {
            isValid: boolean;
            model: TabInputModel<ToolForceZeroSensor>;
        };
        selectedFrame: {
            isValid: boolean;
            model: TabInputModel<ToolForceFrame>;
        };
    };
}

export interface ToolForceDirection {
    enabled: boolean;
    force?: Force;
}

export interface ToolForceZeroSensor {
    enabled: boolean;
    waiting: Time;
}

export interface ToolForceFrame {
    enabled: boolean;
    frameName: string;
}
