/// <reference lib="webworker" />
import { firstValueFrom } from 'rxjs';
import {
    ProgramLabel,
    convertValue,
    Current,
    CurrentUnit,
    CurrentUnits,
    floatOperator,
    operatorInverseMap,
    ProgramBehaviorAPI,
    ProgramBehaviors,
    registerProgramBehavior,
    ScriptBuilder,
    SignalAnalogDomainValueEnum,
    SignalDirectionEnum,
    SignalValueTypeEnum,
    TabInputModel,
    Time,
    ValidationResponse,
    Voltage,
    VoltageUnit,
    VoltageUnits,
} from '@universal-robots/contribution-api';
import { SelectedInput } from '@universal-robots/ui-models';
import { SampleWaitNode, SampleWaitNodeSignalInput } from './wait.node';

const SINGLE_DAY_IN_SECONDS = 86400;
export const MAX_WAIT_TIME_IN_SI = SINGLE_DAY_IN_SECONDS;
export const MIN_WAIT_TIME_IN_SI = 0.01;
const behaviors: ProgramBehaviors<SampleWaitNode> = {
    programNodeLabel: async (node: SampleWaitNode): Promise<ProgramLabel> => {
        switch (node.parameters.type) {
            case 'time': {
                return generateTimeLabel(node.parameters.time);
            }
            case 'signalInput': {
                return await generateSignalInputLabel(node.parameters.signalInput);
            }
            default:
                return [{ type: 'primary', translationKey: 'program-node-label.default' }];
        }
    },
    factory: async (): Promise<SampleWaitNode> => {
        const time = new TabInputModel<Time>(
            {
                value: 1,
                unit: 's',
            },
            SelectedInput.VALUE,
            1,
        );

        return {
            type: 'ur-sample-node-wait',
            version: '0.0.2',
            parameters: {
                type: 'time',
                time,
            },
        };
    },
    validator: async (node: SampleWaitNode, _context): Promise<ValidationResponse> => {
        switch (node.parameters.type) {
            case 'time': {
                return await validateTime(node.parameters.time);
            }
            case 'signalInput': {
                return await validateSignalInput(node.parameters.signalInput);
            }
            default:
                return { isValid: false };
        }
    },
    allowedInContext: async (_context): Promise<boolean> => {
        return true;
    },
    generateCodeBeforeChildren: async (node: SampleWaitNode): Promise<ScriptBuilder> => {
        const builder = new ScriptBuilder();
        if (node.parameters.type === 'signalInput') {
            return await generateWaitForSignalScript(builder, node.parameters.signalInput);
        } else if (node.parameters.type === 'time') {
            return generateWaitForTimeScript(builder, node.parameters.time);
        }
        return builder;
    },
    async upgradeNode(node: SampleWaitNode) {
        const upgradedNode = structuredClone(node);
        if (upgradedNode.version === '0.0.1') {
            if (upgradedNode.parameters.type === 'signalInput' && upgradedNode.parameters.signalInput) {
                const signalInput = upgradedNode.parameters.signalInput as SampleWaitNodeSignalInput & { analogOperator?: floatOperator };
                let groupId = signalInput.groupId;
                const { sourceID, signalID, value } = signalInput;
                if (!groupId && sourceID && (sourceID.includes('ur-tool') || sourceID.includes('ur-wired'))) {
                    signalInput.groupId = 'robot';
                    groupId = signalInput.groupId;
                }
                if (signalInput?.analogOperator) {
                    signalInput.floatOperator = signalInput.analogOperator as floatOperator;
                delete (upgradedNode as any).parameters.signalInput.analogOperator;
            }

                if (groupId && sourceID && signalID) {
                    const api = new ProgramBehaviorAPI(self);
                    const signalValueType = (await firstValueFrom(api.sourceService.sourceSignals(groupId, sourceID)))?.find(
                        (signal) => signal.signalID === signalID,
                    )?.valueType;
                    if (
                        (signalValueType === SignalValueTypeEnum.FLOAT &&
                            ((value as Current | Voltage)?.value || typeof value === 'number')) ||
                        (signalValueType === SignalValueTypeEnum.BOOLEAN && typeof value === 'boolean') ||
                        (signalValueType === SignalValueTypeEnum.REGISTER &&
                            typeof value === 'number' &&
                            parseInt(value.toString()) === value)
                    ) {
                        signalInput.signalValueType = signalValueType;
                    }
                }
            }
            upgradedNode.version = '0.0.2';
        }
        return upgradedNode;
    },
};

function generateTimeLabel(time: SampleWaitNode['parameters']['time']): ProgramLabel {
    if (!TabInputModel.isTabInputModel<Time>(time)) {
        return [{ type: 'primary', value: '' }];
    }
    return [{ type: 'secondary', value: time2Label(time) }];
}

async function generateSignalInputLabel(signalInput: SampleWaitNode['parameters']['signalInput']): Promise<ProgramLabel> {
    if (signalInput?.groupId && signalInput?.signalID && signalInput?.sourceID && signalInput.value !== undefined) {
        const signalName = await getSignalName(signalInput.groupId, signalInput.sourceID, signalInput.signalID);
        if (typeof signalInput.value === 'boolean') {
            const hiLow = signalInput.value ? 'high' : 'low';
            return [
                { type: 'primary', translationKey: 'program-node-label.single-value', interpolateParams: { value: `${signalName} == ` } },
                {
                    type: 'secondary',
                    translationKey: `program-node-label.abbreviations.${hiLow}`,
                },
            ];
        } else if (typeof signalInput.value === 'number') {
            const operator = signalInput.registerOperator || signalInput.floatOperator;
            return [
                { type: 'primary', value: `${signalName} ${operator} ` },
                { type: 'secondary', value: `${signalInput.value}` },
            ];
        } else {
            // Legacy analog signal from wired-io or tool-io
            const input = signalInput.value;
            const operator = signalInput.floatOperator;
            return [
                { type: 'primary', value: `${signalName} ` },
                {
                    type: 'secondary',
                    value: `${operator} ${input.value} ${input.unit}`,
                },
            ];
        }
    }
    return [{ type: 'primary', value: '' }];
}

async function validateTime(time: SampleWaitNode['parameters']['time']): Promise<ValidationResponse> {
    if (time && !(await TabInputModel.isValid<Time>(time))) {
        return { isValid: false };
    }

    if (!time?.value) {
        return { isValid: false };
    }
    const MILLIS_TO_SECONDS = 1000;
    const waitTime = time?.entity.unit === 's' ? Number(time?.value) : time?.entity.value / MILLIS_TO_SECONDS;
    if (waitTime > MAX_WAIT_TIME_IN_SI) {
        return { isValid: false, errorMessageKey: 'Time must be 24 hours or less' };
    }
    if (waitTime < MIN_WAIT_TIME_IN_SI) {
        return { isValid: false, errorMessageKey: 'Time must be 10 ms or greater' };
    }
    return { isValid: true };
}

async function validateSignalInput(signalInput: SampleWaitNode['parameters']['signalInput']): Promise<ValidationResponse> {
    const api = new ProgramBehaviorAPI(self);
    if (!signalInput?.sourceID || !signalInput?.signalID || signalInput?.value === undefined) {
        return { isValid: false };
    }
    const signals = await api.sourceService.getSignals(signalInput.sourceID);
    const signal = signals.find((s) => s.signalID === signalInput.signalID);
    if (!signal) {
        return { isValid: false, errorMessageKey: 'Signal not found' };
    }
    if (![SignalValueTypeEnum.BOOLEAN, SignalValueTypeEnum.FLOAT, SignalValueTypeEnum.REGISTER].includes(signal.valueType)) {
        return { isValid: false, errorMessageKey: 'Signal type not supported' };
    }
    if (signalInput.value === undefined) {
        return { isValid: false, errorMessageKey: 'Value must be set' };
    }
    if (signal.valueType === SignalValueTypeEnum.REGISTER && signalInput.registerOperator === undefined) {
        return { isValid: false, errorMessageKey: 'register operator must be set' };
    }
    if (typeof signalInput.value !== 'boolean' && typeof signalInput.value !== 'number') {
        const domains = await api.sourceService.getAnalogSignalDomains(signalInput.sourceID);
        const currentDomain = domains[signalInput.signalID];
        return { isValid: isUnitOfDomain(signalInput.value.unit, currentDomain) };
    }
    if (signal.direction !== SignalDirectionEnum.IN) {
        return { isValid: false, errorMessageKey: 'Signal must be an input signal' };
    }
    return { isValid: true };
}

function generateWaitForTimeScript(builder: ScriptBuilder, time: SampleWaitNode['parameters']['time']) {
    if (time?.value) {
        builder.sleep(time.value);
    }
    return builder;
}

async function generateWaitForSignalScript(builder: ScriptBuilder, signalInput: SampleWaitNode['parameters']['signalInput']) {
    const api = new ProgramBehaviorAPI(self);
    if (!signalInput?.groupId || !signalInput?.sourceID || !signalInput.signalID || signalInput.value === undefined) {
        return builder;
    }
    const signal = (
        await firstValueFrom(
            api.sourceService.sourceSignals(signalInput.groupId, signalInput.sourceID, { direction: SignalDirectionEnum.IN }),
        )
    ).find((signal) => signal.signalID === signalInput.signalID);
    if (!signal) return builder;
    let whileExpression = '';
    const left = await api.sourceService.getGetSignalScript(signalInput.groupId, signalInput.sourceID, signalInput.signalID);
    let right;
    switch (signal.valueType) {
        case SignalValueTypeEnum.BOOLEAN: {
            right = signalInput.value ? 'False' : 'True';
            whileExpression = `${left} == ${right}`;
            break;
        }
        case SignalValueTypeEnum.REGISTER: {
            const operator = signalInput?.registerOperator ?? '==';
            const operatorScript = operatorInverseMap[operator];
            right = signalInput.value;
            whileExpression = `${left} ${operatorScript} ${right}`;
            break;
        }
        case SignalValueTypeEnum.FLOAT: {
            if (!signalInput.floatOperator) break;
            right = signalInput.value;
            // Support legacy wired-io and tool-io analog signals
            if (typeof signalInput.value !== 'number') {
                right =
                    (signalInput.value as Current | Voltage).unit === 'mA'
                        ? convertValue(signalInput.value as Current, 'A').value
                        : (signalInput.value as Voltage).value;
            }
            right = whileExpression = `${left} ${operatorInverseMap[signalInput.floatOperator]} ${right}`;
            break;
        }
        default:
            break;
    }
    builder.beginWhile(whileExpression);
    builder.sync();
    builder.end();
    return builder;
}

const getSignalName = async (groupId: string, sourceId: string, signalId: string) => {
    const api = new ProgramBehaviorAPI(self);
    return (
        (await firstValueFrom(api.sourceService.sourceSignals(groupId, sourceId))).find((signal) => signal.signalID === signalId)?.name ??
        signalId
    );
};

const isUnitOfDomain = (unit: CurrentUnit | VoltageUnit, domain: SignalAnalogDomainValueEnum) => {
    if ((CurrentUnits as readonly string[]).includes(unit) && domain === SignalAnalogDomainValueEnum.CURRENT) {
        return true;
    }
    return (VoltageUnits as readonly string[]).includes(unit) && domain === SignalAnalogDomainValueEnum.VOLTAGE;
};

// Function to write different label based on SelectedType
const time2Label = (time: TabInputModel<Time>): string => {
    switch (time.selectedType) {
        case SelectedInput.VALUE:
            return `${Number(time.entity.value).toFixed(2)} ${time.entity.unit}`;
        case SelectedInput.VARIABLE:
            return `Variable: ${time.value}`;
        case SelectedInput.EXPRESSION:
            return `Expression: ${time.value}`;
        default:
            return '';
    }
};

registerProgramBehavior(behaviors);
