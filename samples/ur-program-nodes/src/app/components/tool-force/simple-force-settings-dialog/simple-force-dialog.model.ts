import { FrameName, TabInputModel, ToolForceFrame, ToolForceZeroSensor } from '@universal-robots/contribution-api';

export interface SimpleForceDialogModel {
    zeroSensor: TabInputModel<ToolForceZeroSensor>;
    selectedFrame: TabInputModel<ToolForceFrame>;
    frames: FrameName[];
}
