import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnChanges, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
    ApplicationNodeType,
    Frame,
    FramesNode,
    PositionAxes,
    PositionAxis,
    TabInputModel,
    URVariable,
    VariableValueType,
} from '@universal-robots/contribution-api';
import { InputValidator, SelectedInput, TabInputValue, CloseReason } from '@universal-robots/ui-models';
import { CommonProgramPresenterComponent } from '../common-program-presenter.component';
import { SampleToolForceNode } from './tool-force.node';
import { SimpleForceDialogModel } from './simple-force-settings-dialog/simple-force-dialog.model';

@Component({
    templateUrl: './tool-force.component.html',
    styleUrls: ['./tool-force.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolForceComponent extends CommonProgramPresenterComponent<SampleToolForceNode> implements OnChanges {
    maxToolForce!: number;
    variableType = VariableValueType;
    variables: URVariable[] = [];
    axes = PositionAxes;

    validators: Array<InputValidator>;
    // Feature flag for the test mode
    testModeEnabled = false;

    constructor(
        protected readonly translateService: TranslateService,
        protected readonly cd: ChangeDetectorRef,
    ) {
        super(translateService, cd);
        this.validators = [
            (value) => {
                value = Number(value);
                if (value > this.maxToolForce || value < -this.maxToolForce) {
                    return this.translateService.instant('presenter.tool-force.validation-error', { lim: this.maxToolForce });
                }
                return null;
            },
        ];
    }

    async fetchVariables() {
        return await this.presenterAPI.symbolService.getVariables();
    }

    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        await super.ngOnChanges(changes);
        if (changes.presenterAPI?.firstChange) {
            this.maxToolForce = await this.presenterAPI.safetyService.getMaxToolForce();
            this.variables = await this.fetchVariables();
            this.cd.detectChanges();
        }
    }

    async onSetContributedNode() {
        super.onSetContributedNode();
        const variables = await this.fetchVariables();
        const enabledAxes = Object.values(this.contributedNode.parameters).filter((item) => item.model.entity.enabled);
        const notEnabledAxes = Object.values(this.contributedNode.parameters).filter((item) => !item.model.entity.enabled);

        for (const singleNode of notEnabledAxes) {
            singleNode.isValid = true;
        }

        //Validate all enabled nodes
        for (const singleNode of enabledAxes) {
            const isSuppressed = await this.presenterAPI.symbolService.isSuppressed(singleNode.model.value as string);
            const isRegistered = await this.presenterAPI.symbolService.isRegisteredVariableName(singleNode.model.value as string);

            singleNode.isValid = String(singleNode.model.value).length > 0;

            //If variable is chosen.
            if (singleNode.model.selectedType === SelectedInput.VARIABLE) {
                const variable = variables.find((urVariable) => urVariable.name === singleNode.model.value);
                if (variable && variable.valueType === VariableValueType.FLOAT && !isSuppressed && isRegistered) {
                    singleNode.isValid = true;
                }

                if (isSuppressed || !isRegistered) {
                    singleNode.isValid = false;
                }
            }
        }

        this.cd.detectChanges();
    }

    toggle(axis: PositionAxis) {
        const toggledAxis = this.contributedNode.parameters[axis].model.entity;
        toggledAxis.enabled = !toggledAxis.enabled;
        if (toggledAxis.enabled && !toggledAxis.force) {
            toggledAxis.force = {
                value: 0.0,
                unit: 'N',
            };
        }
        this.saveNode();
    }

    setForce(axis: PositionAxis, $event: TabInputValue) {
        const tabInput = this.contributedNode.parameters[axis];
        if (tabInput.model.entity.force) {
            TabInputModel.setTabInputValue(tabInput.model, $event);
            this.saveNode();
        }

        this.cd.detectChanges();
    }
    getToolForce(axis: PositionAxis) {
        return TabInputModel.getTabInputValue(this.contributedNode.parameters[axis].model);
    }

    getLabel(axis: PositionAxis) {
        return `${axis.toUpperCase()}`;
    }

    public async openAdvancedSettingsDialog() {
        const dialogData = await this.presenterAPI.dialogService.openCustomDialog<SimpleForceDialogModel>(
            'ur-simple-force-settings-dialog',
            {
                ...this.contributedNode.parameters,
                zeroSensor: this.contributedNode.parameters.zeroSensor.model,
                selectedFrame: await this.getSelectedFrame(),
                frames: (await this.getFramesList()).map((frame) => frame.name),
            },
            {
                icon: 'access',
                title: this.translateService.instant('presenter.tool-force.label.more_settings'),
                dialogSize: 'LARGE',
                confirmText: this.translateService.instant('presenter.tool-force.label.confirm_text'),
                raiseForKeyboard: false,
            },
        );
        const { reason, returnData } = dialogData;
        if (reason !== CloseReason.CONFIRMED) {
            return;
        }

        if (returnData && Object.keys(returnData).length > 0) {
            this.contributedNode.parameters.zeroSensor.model = { ...returnData.zeroSensor };
            this.contributedNode.parameters.selectedFrame.model = { ...returnData.selectedFrame };
            this.saveNode();
        }
    }

    private async getSelectedFrame() {
        const selectedFrame = this.contributedNode.parameters.selectedFrame.model;
        if (!selectedFrame.entity.frameName) {
            selectedFrame.entity.frameName = (await this.getFramesList()).map((frame) => frame.name)[0];
        }
        return selectedFrame;
    }

    private async getFramesList(): Promise<Frame[]> {
        return ((await this.presenterAPI.applicationService.getApplicationNode(ApplicationNodeType.FRAMES)) as FramesNode).framesList;
    }
}
