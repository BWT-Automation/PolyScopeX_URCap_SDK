import { ProgramNode, TabInputModel, Time, SignalValue, SignalValueTypeEnum } from '@universal-robots/contribution-api';

export const floatOperators = ['<', '>'] as const;
export const registerOperators = [...floatOperators, '==', '!=', '>=', '<='] as const;
export const operatorInverseMap = {
    '<': '>=',
    '>': '<=',
    '==': '!=',
    '!=': '==',
    '>=': '<',
    '<=': '>',
} as const;

export type floatOperator = (typeof floatOperators)[number];
export type registerOperator = (typeof registerOperators)[number];

export interface SampleWaitNodeSignalInput {
  groupId?: string;
  sourceID?: string;
  signalID?: string;
  floatOperator?: floatOperator;
  registerOperator?: registerOperator;
  value?: SignalValue;
  signalValueType?: SignalValueTypeEnum;
}

export interface SampleWaitNode extends ProgramNode {
    type: 'ur-sample-node-wait';
    parameters: {
        type: 'time' | 'signalInput';
        time?: TabInputModel<Time>;
        signalInput?: SampleWaitNodeSignalInput;
    };
}
