import { ProgramNode, SignalValue, SignalValueTypeEnum } from '@universal-robots/contribution-api';

export interface SampleSetNode extends ProgramNode {
    type: 'ur-sample-node-set';
    parameters: {
        signalOutput?: {
            groupId?: string;
            sourceID?: string;
            signalID?: string;
            value?: SignalValue;
            signalValueType?: SignalValueTypeEnum;
        };
    };
}
