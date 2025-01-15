import { ChangeDetectionStrategy, ChangeDetectorRef, Component, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
    ApplicationNodeType,
    EndEffector,
    EndEffectorNode,
    Frame,
    FramesNode,
    isWaypoint,
    MoveScreenOptions,
    MoveType,
    TabInputModel,
    URVariable,
    VariableValueType,
} from '@universal-robots/contribution-api';
import { CloseReason, DropdownOption, InputValidator, TabInputValue, TabInputVariable } from '@universal-robots/ui-models';
import { CommonProgramPresenterComponent } from '../common-program-presenter.component';
import { getVariableNameValidator } from '../validator-helper';
import { MoveToDialogModel } from './move-to-settings-dialog/move-to-dialog.model';
import {
    getDefaultJointAcceleration,
    getDefaultJointSpeed,
    getDefaultLinearAcceleration,
    getDefaultLinearSpeed,
    getDefaultMotionValue,
    getDefaultOptiMoveAcceleration,
    getDefaultOptiMoveSpeed,
} from './move-to.constants';
import { SampleMoveToNode } from './move-to.node';
import { getDefaultMoveToValidation, MoveToFieldValidation, MoveToValidationResponse } from './move-to.validation.model';

@Component({
    templateUrl: './move-to.component.html',
    styleUrls: ['./move-to.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoveToComponent extends CommonProgramPresenterComponent<SampleMoveToNode> {
    moveTypes: DropdownOption[] = [];
    allVariables: URVariable[] = [];
    waypointVariables: TabInputVariable[] = [];
    variableNameValidator?: InputValidator<string>;
    gridVariableNameValidator?: InputValidator<string> = (varName: string) => {
        if (!this.presenterAPI.applicationService.isValidGridPattern(varName)) {
            return this.translateService.instant('presenter.variable_name.variable_grid_reference_invalid_error');
        }

        return null;
    };

    fieldValidation!: MoveToFieldValidation;
    advancedSettingsIsValid = true; // shared handle for all advanced settings properties.
    tabinputValue = signal<TabInputValue>({ selectedType: 'VALUE', value: '' });

    inputsDisabled = signal<boolean>(false);
    constructor(
        protected readonly translateService: TranslateService,
        protected readonly cd: ChangeDetectorRef,
    ) {
        super(translateService, cd);
        this.moveTypes = [
            { value: 'moveJ', label: this.translateService.instant('presenter.move-to.label.type_joint') },
            { value: 'moveL', label: this.translateService.instant('presenter.move-to.label.type_linear') },
        ];
    }

    async onSetContributedNode() {
        super.onSetContributedNode();

        this.allVariables = await this.presenterAPI.symbolService.getVariables();

        this.variableNameValidator = getVariableNameValidator.bind(this)(this.contributedNode.parameters.variable?.entity?.name);
        this.waypointVariables =
            this.allVariables
                .filter((variable) => variable.valueType === VariableValueType.WAYPOINT)
                .map((variable) => {
                    return {
                        ...variable,
                        valueType: 'string',
                    };
                }) ?? [];
        const variable = this.contributedNode.parameters.variable;
        if (variable.selectedType === 'VALUE') {
            this.waypointVariables = this.waypointVariables.filter(
                (variable) => variable.name !== this.contributedNode.parameters.variable.entity?.name,
            );
            if (variable.value !== variable.entity?.name) {
                // Ensure the tabinputmodel value is synced when copying the node
                if (variable.entity) {
                    variable.value = variable.entity.name;
                }
            }
        }
        this.tabinputValue.set(variable);

        // Validity of advanced settings properties:
        await this.updateValidation();

        this.inputsDisabled.set(false);

        this.cd.detectChanges();
    }

    async setMoveType(moveType: MoveType) {
        this.contributedNode.parameters.moveType = moveType;
        const speed = moveType === 'moveJ' ? getDefaultJointSpeed() : getDefaultLinearSpeed();
        const acceleration = moveType === 'moveJ' ? getDefaultJointAcceleration() : getDefaultLinearAcceleration();
        const motionValue = getDefaultMotionValue();
        const optiMoveSpeed = getDefaultOptiMoveSpeed();
        const optiMoveAcceleration = getDefaultOptiMoveAcceleration();
        this.contributedNode.parameters.advanced.speed = {
            speed,
            acceleration,
            motionValue,
            optiMoveSpeed,
            optiMoveAcceleration,
        };
        this.saveNode();
    }

    setPointType(tabInputValue: TabInputValue) {
        let variable: URVariable | undefined;
        if (tabInputValue.selectedType === 'VALUE') {
            variable = new URVariable(tabInputValue.value as string, VariableValueType.WAYPOINT);
        }
        if (tabInputValue.selectedType === 'VARIABLE') {
            variable = new URVariable(tabInputValue.value as string, VariableValueType.WAYPOINT, true);
        }
        this.contributedNode.parameters.variable = new TabInputModel<URVariable | undefined>(
            variable,
            tabInputValue.selectedType,
            tabInputValue.value,
        );
        this.saveNode();
    }

    async openMoveScreenClicked(): Promise<void> {
        if (!this.contributedNode.parameters.variable.entity || this.contributedNode.parameters.variable.entity?.reference) {
            return;
        }
        this.inputsDisabled.set(true);
        window.parent.performance.mark('setWaypointStart');

        const entity = this.contributedNode.parameters.variable.entity;
        const options = this.setMoveScreenOptions(entity);

        const newWaypoint = await this.presenterAPI.robotMoveService.openMoveScreen(options);
        if (isWaypoint(newWaypoint)) {
            // TODO save waypoint to model
        } else {
            this.inputsDisabled.set(false);
        }
    }

    private setMoveScreenOptions(entity: URVariable) {
        const options: MoveScreenOptions = {
            moveScreenTarget: 'waypoint',
            moveScreenTargetLabel: entity.name,
            frame: this.contributedNode.parameters.waypoint?.frame,
            tcp: this.contributedNode.parameters.waypoint?.tcp,
        };

        const waypoint = this.contributedNode.parameters.waypoint;

        if (isWaypoint(waypoint)) {
            // TODO save waypoint to model
        }
        return options;
    }

    async getFrame(frameId: string): Promise<Frame> {
        const framesList = await this.getFramesList();
        return framesList.find((frame) => frame.name === frameId) || ({} as Frame);
    }

    async getFramesList(): Promise<Frame[]> {
        return ((await this.presenterAPI.applicationService.getApplicationNode(ApplicationNodeType.FRAMES)) as FramesNode).framesList;
    }
    async getEndEffectorList(): Promise<EndEffector[]> {
        return ((await this.presenterAPI.applicationService.getApplicationNode(ApplicationNodeType.END_EFFECTOR)) as EndEffectorNode)
            .endEffectors;
    }
    public async openAdvancedSettingsDialog() {
        const dialogData = await this.presenterAPI.dialogService.openCustomDialog<MoveToDialogModel>(
            'ur-move-to-settings-dialog',
            {
                ...this.contributedNode.parameters,
                variables: this.allVariables,
                robotSettings: this.robotSettings,
                frames: (await this.getFramesList()).map((frame) => frame.name),
                fieldValidation: this.fieldValidation.advanced,
                endEffectors: await this.getEndEffectorList(),
            },
            {
                icon: 'access',
                title: this.translateService.instant('presenter.move-to.label.more_settings'),
                dialogSize: 'LARGE',
                confirmText: this.translateService.instant('presenter.move-to.label.confirm_text'),
                raiseForKeyboard: false,
            },
        );
        const { reason, returnData } = dialogData;
        if (reason !== CloseReason.CONFIRMED) {
            return;
        }

        if (returnData && Object.keys(returnData).length > 0) {
            this.contributedNode.parameters.advanced = { ...returnData.advanced };
            if (returnData.waypoint) {
                this.contributedNode.parameters.waypoint = { ...returnData.waypoint };
            }
            this.saveNode();
        }
    }

    private async updateValidation() {
        const validation = (await this.presenterAPI.validationService.getValidationResponse()) as MoveToValidationResponse;
        if (!validation) {
            return;
        }
        this.fieldValidation = validation.fieldValidation ?? getDefaultMoveToValidation();

        this.advancedSettingsIsValid = !Object.values(this.fieldValidation.advanced).some((valid) => !valid);
    }
}
