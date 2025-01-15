import { ApplicationNode } from '@universal-robots/contribution-api';

export interface FastFeaturePrototypeNode extends ApplicationNode {
  type: string;
  version: string;
}
