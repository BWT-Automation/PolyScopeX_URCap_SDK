import {
    WaypointTabInputModel,
    FrameName,
    MoveToAdvancedSettings,
    MoveType,
    RobotSettings,
    TabInputModel,
    URVariable,
    EndEffector,
} from '@universal-robots/contribution-api';
import { MoveToFieldValidation } from '../move-to.validation.model';

export interface MoveToDialogModel {
    moveType: MoveType;
    variable: TabInputModel<URVariable | undefined>;
    waypoint?: WaypointTabInputModel;
    advanced: MoveToAdvancedSettings;
    variables: URVariable[];
    robotSettings: RobotSettings;
    frames: FrameName[];
    fieldValidation: MoveToFieldValidation['advanced'];
    endEffectors: EndEffector[];
}
