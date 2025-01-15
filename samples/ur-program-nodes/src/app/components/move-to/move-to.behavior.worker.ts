/// <reference lib="webworker" />
import {
    ApplicationNodeType,
    EndEffectorNode,
    FramesNode,
    KinematicPosition,
    MoveToBlendSettings,
    MoveToSpeedSettings,
    ProgramBehaviorAPI,
    ProgramBehaviors,
    ProgramLabel,
    ScriptBuilder,
    TCPName,
    TabInputModel,
    TranslatedProgramLabelPart,
    URVariable,
    VariableValueType,
    convertValue,
    registerProgramBehavior,
    valueConverter,
} from '@universal-robots/contribution-api';
import { SelectedInput } from '@universal-robots/ui-models';
import {
  Acceleration,
  AngularAcceleration,
  AngularSpeed,
  Speed,
  Unit,
  UnitType,
  mPerSec,
  mPerSecSq,
  radPerSec,
  radPerSecSq,
} from '@universal-robots/utilities-units';
import {
  Active_TCP,
  Movement_Classic,
  getDefaultJointAcceleration,
  getDefaultJointSpeed,
  getDefaultMotionValue,
  getDefaultOptiMoveAcceleration,
  getDefaultOptiMoveSpeed,
} from './move-to.constants';
import { SampleMoveToNode } from './move-to.node';
import { MoveToFieldValidation, MoveToValidationResponse, getDefaultMoveToValidation } from './move-to.validation.model';

function formatValueWithUnit<T extends UnitType>(currentValue: number, currentUnit: Unit<T>, newUnit: Unit<T>) {
    const valueWithNewUnit = convertValue(
        {
            value: currentValue,
            unit: currentUnit.label,
        },
        newUnit.label,
    );
    return valueConverter(valueWithNewUnit, newUnit);
}

async function convertedValuesForMoveType(moveType: string, node: SampleMoveToNode) {
    const api = new ProgramBehaviorAPI(self);
    const units = (await api.settingsService.getRobotSettingsOnce()).units;

    let speedType: Unit<AngularSpeed | Speed>;
    let speedUnit: Unit<AngularSpeed | Speed>;
    let accelerationType: Unit<AngularAcceleration | Acceleration>;
    let accelerationUnit: Unit<AngularAcceleration | Acceleration>;
    if (moveType == 'Joint') {
        speedType = units.ANGULAR_SPEED;
        accelerationType = units.ANGULAR_ACCELERATION;
        speedUnit = radPerSec;
        accelerationUnit = radPerSecSq;
    } else {
        speedType = units.SPEED;
        accelerationType = units.ACCELERATION;
        speedUnit = mPerSec;
        accelerationUnit = mPerSecSq;
    }

    const convertedSpeed =
        node.parameters.advanced.speed.speed.selectedType === SelectedInput.VALUE
            ? formatValueWithUnit(Number(node.parameters.advanced.speed.speed.value), speedUnit, speedType)
            : node.parameters.advanced.speed.speed.value;
    const convertedAcceleration =
        node.parameters.advanced.speed.acceleration.selectedType === SelectedInput.VALUE
            ? formatValueWithUnit(Number(node.parameters.advanced.speed.acceleration.value), accelerationUnit, accelerationType)
            : node.parameters.advanced.speed.acceleration.value;

        return {
        convertedSpeed,
        convertedAcceleration,
        };
    }

const behaviors: ProgramBehaviors<SampleMoveToNode> = {
    programNodeLabel: async (node: SampleMoveToNode): Promise<ProgramLabel> => {
        const variable = node.parameters.variable;
        const moveType = node.parameters.moveType === 'moveJ' ? 'Joint' : 'Linear';
        const frame = variable.selectedType === SelectedInput.VARIABLE ? undefined : node.parameters.waypoint?.frame;
        const tcpName = variable.selectedType === SelectedInput.VALUE ? node.parameters.waypoint?.tcp?.name || Active_TCP : Active_TCP;
        const moveTypeTranslateKey = moveType === 'Joint' ? 'program-node-label.move-to.joint' : 'program-node-label.move-to.linear';
        const moveTypeLabel: TranslatedProgramLabelPart = { type: 'secondary', translationKey: moveTypeTranslateKey };

        const convertedValues = await convertedValuesForMoveType(moveType, node);
        const frameLabel: TranslatedProgramLabelPart = {
                type: 'secondary',
            translationKey: 'program-node-label.single-value',
            interpolateParams: { value: frame ?? '' },
        };
        const tcpLabel: TranslatedProgramLabelPart = {
                type: 'secondary',
            translationKey: 'program-node-label.single-value',
            interpolateParams: { value: tcpName ?? '' },
        };
        const speedLabel: TranslatedProgramLabelPart = {
            type: 'secondary',
            translationKey: 'program-node-label.move-to.speed',
            interpolateParams: { speed: `${convertedValues.convertedSpeed}` },
        };
        const accelerationLabel: TranslatedProgramLabelPart = {
            type: 'secondary',
            translationKey: 'program-node-label.move-to.acceleration',
            interpolateParams: { acceleration: `${convertedValues.convertedAcceleration}` },
        };
        const optSpeedLabel: TranslatedProgramLabelPart = {
            type: 'secondary',
            translationKey: 'program-node-label.move-to.speed',
            interpolateParams: { speed: `${node.parameters.advanced.speed.optiMoveSpeed + ' %'}` },
        };
        const optAccelerationLabel: TranslatedProgramLabelPart = {
            type: 'secondary',
            translationKey: 'program-node-label.move-to.acceleration',
            interpolateParams: { acceleration: `${node.parameters.advanced.speed.optiMoveAcceleration + ' %'}` },
        };
        let labels: TranslatedProgramLabelPart[] = [];

        let name: TranslatedProgramLabelPart = { type: 'primary', translationKey: 'program-node-label.default' };
        const nameType = (!frame || !tcpName) && variable.selectedType !== 'EXPRESSION' ? 'secondary' : 'primary';
        const nameString = variable.entity ? variable.entity.name : '';
        if (variable.entity && variable.selectedType === 'VARIABLE') {
            name = {
                type: nameType,
                translationKey: 'program-node-label.move-to.name.variable',
                interpolateParams: { variableName: nameString },
            };
        } else if (variable.entity) {
            name = {
                type: nameType,
                translationKey: 'program-node-label.move-to.name.default',
                interpolateParams: { name: nameString },
            };
        }

        if (variable.selectedType === SelectedInput.EXPRESSION) {
            labels = [
                {
                    type: 'secondary',
                    translationKey: 'program-node-label.single-value',
                    interpolateParams: { value: `${variable.value}` },
            },
                moveTypeLabel,
        ];
        }
        if (variable.selectedType === SelectedInput.VARIABLE && variable.entity) {
            labels = [name, moveTypeLabel];
        }
        if (variable.selectedType === SelectedInput.VALUE && variable.entity) {
            labels = [name, moveTypeLabel, frameLabel, tcpLabel];
        }

        if (node.parameters.advanced.speed.motionValue === Movement_Classic) {
            labels = labels.concat([speedLabel, accelerationLabel]);
        } else {
            labels = labels.concat([optSpeedLabel, optAccelerationLabel]);
        }

        if (node.parameters.advanced.transform.transform) {
            labels.push({
                type: 'secondary',
                translationKey: 'program-node-label.move-to.transform',
                interpolateParams: { transformName: `${node.parameters.advanced.transform.poseVariable?.name}` },
            });
        }

        return labels;
    },
    factory: async (): Promise<SampleMoveToNode> => {
        const api = new ProgramBehaviorAPI(self);
        const pointName = await api.symbolService.generateVariable('Point', VariableValueType.WAYPOINT);
        return {
            version: '0.0.3',
            type: 'ur-sample-node-move-to',
            allowsChildren: false,
            parameters: {
                moveType: 'moveJ',
                variable: new TabInputModel<URVariable>(pointName, 'VALUE', pointName.name),
                waypoint: undefined,
                advanced: {
                    speed: {
                        speed: getDefaultJointSpeed(),
                        acceleration: getDefaultJointAcceleration(),
                        motionValue: getDefaultMotionValue(),
                        optiMoveSpeed: getDefaultOptiMoveSpeed(),
                        optiMoveAcceleration: getDefaultOptiMoveAcceleration(),
                    },
                    blend: {
                        enabled: false,
                    },
                    transform: {
                        transform: false,
                        poseVariable: undefined,
                    },
                },
            },
        };
    },
    validator: async (node: SampleMoveToNode): Promise<MoveToValidationResponse> => {
        const api = new ProgramBehaviorAPI(self);
        const variable = node.parameters.variable;
        const waypoint = node.parameters.waypoint;
        const fieldValidation: MoveToFieldValidation = getDefaultMoveToValidation();
        if (!variable) {
            fieldValidation.point = false;
            return { isValid: false, fieldValidation };
        }

        if (variable.selectedType === SelectedInput.VALUE && !waypoint) {
            fieldValidation.position = false;
        }

        if (variable.selectedType === SelectedInput.VARIABLE) {
            if (!variable.entity) {
                fieldValidation.point = false;
            } else {
                const variableExists = await isValidVariable(variable.entity.name, api);
                if (!variableExists) {
                    fieldValidation.point = false;
                }
            }
        }

        if (variable.selectedType === SelectedInput.EXPRESSION) {
            const expressionEmpty = (variable.value as string).length === 0;
            if (expressionEmpty) {
                fieldValidation.point = false;
            }
        }

        const advanced = node.parameters.advanced;

        // If speed settings are set to variables they should be valid
        if (advanced.speed.speed.selectedType === SelectedInput.VARIABLE) {
            const variableExists = await isValidVariable(advanced.speed.speed.value as string, api);
            if (!variableExists) {
                fieldValidation.advanced.speed = false;
            }
        }
        if (advanced.speed.acceleration.selectedType === SelectedInput.VARIABLE) {
            const variableExists = await isValidVariable(advanced.speed.acceleration.value as string, api);
            if (!variableExists) {
                fieldValidation.advanced.acceleration = false;
            }
        }

        // If a pose is set for the Move node, it should be a valid variable name:
        if (advanced.transform?.transform && advanced.transform.poseVariable) {
            const poseVar = advanced.transform.poseVariable;
            const variableExists = await isValidVariable(poseVar.name, api);
            if (!variableExists) {
                fieldValidation.advanced.transform = false;
            }
        }

        const frameId = waypoint?.frame;
        if (frameId) {
            fieldValidation.advanced.frame = await isValidFrame(frameId, api);
        }
        const tcpName = waypoint?.tcp;
        if (tcpName) {
            fieldValidation.advanced.tcp = await isValidTcp(tcpName, api);
        }

        // If blend radius is enabled and set to a variable, is should be a valid variable
        if (advanced.blend.enabled && advanced.blend.radius?.selectedType === SelectedInput.VARIABLE) {
            const variableExists = await isValidVariable(advanced.blend.radius.value as string, api);
            if (!variableExists) {
                fieldValidation.advanced.blend = false;
            }
        }

        const hasInvalidField = [fieldValidation.point, fieldValidation.position, ...Object.values(fieldValidation.advanced)].some(
            (valid: boolean) => !valid,
        );

        return { isValid: !hasInvalidField, fieldValidation };
    },
    generateCodeBeforeChildren: async (node: SampleMoveToNode): Promise<ScriptBuilder> => {
        const builder = new ScriptBuilder();

        if (node.parameters.variable.selectedType === SelectedInput.VALUE) {
            builder.append(await writeTCPScript(node.parameters.waypoint?.tcp?.name));
        }

        const destination = getDestinationString(node);
        const blendRadius = getBlendRadius(node.parameters.advanced.blend);

        const moveFunction = getMoveFunction(builder, node);
        if (node.parameters.advanced.speed.motionValue === Movement_Classic) {
        const speed = getSpeed(node.parameters.advanced.speed);
        const acceleration = getAcceleration(node.parameters.advanced.speed);
        return moveFunction.call(builder, destination, acceleration, speed, undefined, blendRadius);
        } else {
            const speed = getOptiMoveSpeed(node.parameters.advanced.speed);
            const acceleration = getOptiMoveAcceleration(node.parameters.advanced.speed);
            return moveFunction.call(builder, destination, acceleration, speed, blendRadius);
        }
    },
    generateCodePreamble: async (node: SampleMoveToNode): Promise<ScriptBuilder> => {
        const builder = new ScriptBuilder();
        const variable = node.parameters.variable;
        const waypoint = node.parameters.waypoint;
        if (variable.selectedType === 'VALUE' && variable.entity?.name && waypoint) {
            // TODO create waypoint variable
        }
        return builder;
    },

    upgradeNode: async (node: SampleMoveToNode): Promise<SampleMoveToNode> => {
        if (node.version === '0.0.1') {
            node = await upgradeTo002(node);
        }
        if (node.version === '0.0.2') {
            node = await upgradeTo003(node);
        }
        return node;
    },
};

async function upgradeTo002(node: SampleMoveToNode) {
    // Convert from the old KinematicPosition to the new Waypoint model and store in WaupointTabInputModel
    const point = (node.parameters as any).point;
    const { position, variable } = point.entity as { position: KinematicPosition; variable: URVariable };
    if (point.selectedType === 'VALUE') {
        // TODO create updated waypoint variable
    } else {
        node.parameters.variable = new TabInputModel<URVariable>(variable, point.selectedType, point.value);
        node.parameters.waypoint = undefined;
    }
    delete (node.parameters as any).point;
    delete (node.parameters.advanced as any).reference;
    node.version = '0.0.2';
    return node;
}

async function upgradeTo003(node: SampleMoveToNode) {
    // Set the OptiMove parameters for old nodes
    node.parameters.advanced.speed.motionValue = Movement_Classic;
    node.parameters.advanced.speed.optiMoveSpeed = getDefaultOptiMoveSpeed();
    node.parameters.advanced.speed.optiMoveAcceleration = getDefaultOptiMoveAcceleration();
    node.version = '0.0.3';
    return node;
}

async function writeTCPScript(tcpName: string | undefined): Promise<ScriptBuilder> {
    const builder = new ScriptBuilder();
    if (tcpName) {
        const api = new ProgramBehaviorAPI(self);
        const eeNode = (await api.applicationService.getApplicationNode(ApplicationNodeType.END_EFFECTOR)) as EndEffectorNode;

        const tcp = eeNode.endEffectors.flatMap((ee) => ee.tcps).find((tcp) => tcp.name === tcpName);
        if (tcp) {
            builder.setTcp(tcp.x.value, tcp.y.value, tcp.z.value, tcp.rx.value, tcp.ry.value, tcp.rx.value, tcp.name);
        }
    }
    return builder;
}

function getMoveFunction(builder: ScriptBuilder, node: SampleMoveToNode) {
    if (node.parameters.advanced.speed.motionValue === Movement_Classic) {
        return node.parameters.moveType === 'moveJ' ? builder.movej : builder.movel;
    } else {
        return node.parameters.moveType === 'moveJ' ? builder.optimovej : builder.optimovel;
    }
}

async function setTCPOnBuilder(builder: ScriptBuilder, node: SampleMoveToNode) {
    const api = new ProgramBehaviorAPI(self);
    const eeNode = (await api.applicationService.getApplicationNode(ApplicationNodeType.END_EFFECTOR)) as EndEffectorNode;

    const tcpName = node.parameters.waypoint?.tcp?.name;

    const tcp = eeNode.endEffectors.flatMap((ee) => ee.tcps).find((tcp) => tcp.name === tcpName);

    if (tcp) {
        builder.setTcp(tcp.x.value, tcp.y.value, tcp.z.value, tcp.rx.value, tcp.ry.value, tcp.rz.value, tcp.name);
    }
}

function getDestinationString(node: SampleMoveToNode): string {
    if (node.parameters.variable.selectedType === SelectedInput.EXPRESSION) {
        return node.parameters.variable.value as string;
    }

    const moveType = node.parameters.moveType;
    const variable = node.parameters.variable.entity;
    if (!variable) {
        return '';
    }
    let targetPoseString = `convert_pose(${variable.name}.p, ${variable.name}.frame, "base")`;

    if (node.parameters.advanced.transform?.poseVariable?.name) {
        targetPoseString = `pose_trans(${targetPoseString}, ${node.parameters.advanced.transform.poseVariable.name})`;
    }

    if (moveType === 'moveL') {
        return targetPoseString;
    } else if (moveType === 'moveJ') {
        return `get_inverse_kin(${targetPoseString}, qnear=${variable.name}.q)`;
    }

    return '';
}

function getSpeed(speedSettings: MoveToSpeedSettings) {
    return speedSettings.speed.value;
}

function getAcceleration(speedSettings: MoveToSpeedSettings) {
    return speedSettings.acceleration.value;
}

function getBlendRadius(blendSettings: MoveToBlendSettings) {
    if (blendSettings.enabled && blendSettings.radius) {
        return blendSettings.radius.value;
    }
    return undefined;
}

function getOptiMoveSpeed(speedSettings: MoveToSpeedSettings) {
    return speedSettings.optiMoveSpeed / 100;
}

function getOptiMoveAcceleration(speedSettings: MoveToSpeedSettings) {
    return speedSettings.optiMoveAcceleration / 100;
}

async function isValidVariable(variableName: string, api: ProgramBehaviorAPI): Promise<boolean> {
    const validVariable = await api.symbolService.isValidVariable(variableName);
    const validGrid = await api.applicationService.isValidGridPattern(variableName.replace('_iterator', ''));
    return validVariable && validGrid;
}
/**
 * Check if the frame is valid. If the frame is not set, it is considered valid.
 */
async function isValidFrame(frameId: string, api: ProgramBehaviorAPI): Promise<boolean> {
    const framesList = ((await api.applicationService.getApplicationNode(ApplicationNodeType.FRAMES)) as FramesNode).framesList;
    return !!framesList.some((frame) => frame.name === frameId);
}
/**
 * Check if the TCP is valid. If the TCP is not set, it is considered valid.
 */
async function isValidTcp(tcpName: TCPName, api: ProgramBehaviorAPI): Promise<boolean> {
    const eeNode = (await api.applicationService.getApplicationNode(ApplicationNodeType.END_EFFECTOR)) as EndEffectorNode;
    return !!eeNode.endEffectors.flatMap((ee) => ee.tcps).find((tcp) => tcp.id === tcpName.id);
}
registerProgramBehavior(behaviors);
