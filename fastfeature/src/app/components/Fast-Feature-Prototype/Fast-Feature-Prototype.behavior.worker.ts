/// <reference lib="webworker" />
import {
    ApplicationBehaviors,
    ApplicationNode, FramesService, OptionalPromise,
    registerApplicationBehavior,
    ScriptBuilder
} from '@universal-robots/contribution-api';
import { FastFeaturePrototypeNode } from './Fast-Feature-Prototype.node';

// factory is required
const createApplicationNode = (): OptionalPromise<FastFeaturePrototypeNode> => ({
    type: 'fastfeature-fastfeature-fast-feature-prototype',    // type is required
    version: '1.0.0'     // version is required
});

// generatePreamble is optional
const generatePreambleScriptCode = (node: FastFeaturePrototypeNode): OptionalPromise<ScriptBuilder> => {
    const builder = new ScriptBuilder();
    return builder;
};

// upgradeNode is optional
const upgradeApplicationNode
  = (loadedNode: ApplicationNode, defaultNode: FastFeaturePrototypeNode): FastFeaturePrototypeNode =>
      defaultNode;

// downgradeNode is optional
const downgradeApplicationNode
  = (loadedNode: ApplicationNode, defaultNode: FastFeaturePrototypeNode): FastFeaturePrototypeNode =>
      defaultNode;

const behaviors: ApplicationBehaviors = {
    factory: createApplicationNode,
    generatePreamble: generatePreambleScriptCode,
    upgradeNode: upgradeApplicationNode,
    downgradeNode: downgradeApplicationNode
};

registerApplicationBehavior(behaviors);
