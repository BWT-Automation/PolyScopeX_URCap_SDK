import {
    Acceleration,
    AngularAcceleration,
    AngularSpeed,
    Angle,
    Length,
    Speed,
    ProgramNode,
    TabInputModel,
    URVariable,
    Waypoint,
} from '@universal-robots/contribution-api';

export type MoveType = 'moveJ' | 'moveL';
export type WaypointTabInputModel = Omit<Waypoint, 'pose'> & {
    pose: {
        x: TabInputModel<Length>;
        y: TabInputModel<Length>;
        z: TabInputModel<Length>;
        rx: TabInputModel<Angle>;
        ry: TabInputModel<Angle>;
        rz: TabInputModel<Angle>;
    };
};

export interface SampleMoveToNode extends ProgramNode {
    type: 'ur-sample-node-move-to';
    parameters: {
        moveType: MoveType;
        variable: TabInputModel<URVariable | undefined>;
        waypoint?: WaypointTabInputModel;
        advanced: MoveToAdvancedSettings;
    };
}

export interface MoveToAdvancedSettings {
    speed: MoveToSpeedSettings;
    transform: MoveToTransformSettings;
    blend: MoveToBlendSettings;
}

export interface MoveToSpeedSettings {
    speed: TabInputModel<Speed | AngularSpeed>;
    acceleration: TabInputModel<Acceleration | AngularAcceleration>;
    motionValue: string;
    optiMoveSpeed: number;
    optiMoveAcceleration: number;
}

export interface MoveToBlendSettings {
    enabled: boolean;
    radius?: TabInputModel<Length>;
}

export interface MoveToTransformSettings {
    transform: boolean;
    poseVariable?: URVariable;
}
