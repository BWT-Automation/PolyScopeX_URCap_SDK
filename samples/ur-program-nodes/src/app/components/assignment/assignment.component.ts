import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    inject,
    OnChanges,
    signal,
    SimpleChanges,
    WritableSignal,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
    ApplicationNodeType,
    GridPatternNode,
    GridPatternParameters,
    isWaypoint,
    MoveScreenOptions,
    TabInputModel,
    URVariable,
    VariableValueType,
    WaypointType,
} from '@universal-robots/contribution-api';
import { DropdownOption, InputValidator, SelectedInput, TabInputValue } from '@universal-robots/ui-models';
import { CommonProgramPresenterComponent } from '../common-program-presenter.component';
import { getVariableNameValidator } from '../validator-helper';
import { SampleAssignmentNode } from './assignment.node';

@Component({
    templateUrl: './assignment.component.html',
    styleUrls: ['./assignment.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentComponent extends CommonProgramPresenterComponent<SampleAssignmentNode> implements OnChanges {
    protected readonly translateService = inject(TranslateService);
    protected readonly cd = inject(ChangeDetectorRef);

    PositionType = WaypointType;

    variables: WritableSignal<Array<URVariable>> = signal([]);
    filteredVariables: WritableSignal<Array<URVariable>> = signal([]);
    variableOptions: WritableSignal<Array<DropdownOption>> = signal([]);
    selectedVariableOption = signal<DropdownOption | undefined>(undefined);
    selectedWaypointSource = signal<(DropdownOption & { value: WaypointType }) | undefined>(undefined);
    tabInputValue = signal<TabInputValue | undefined>(undefined);
    isTabInput: WritableSignal<boolean> = signal(false);
    isValid: WritableSignal<boolean> = signal(false);

    wayPointSources: DropdownOption[] = this.getWaypointSources();
    expressionValidators = signal<Array<InputValidator>>([]);
    variableNameValidator?: InputValidator<string>;
    variableDropdown = signal<{ label: string; icon: string }>({
        label: this.translateService.instant('presenter.assignment.variable_dropdown.new'),
        icon: 'pencil',
    });

    variableTypes = Object.values(VariableValueType)
        .filter((val) => val !== VariableValueType.FRAME)
        .sort((a, b) => a.localeCompare(b));

    variableTypeTranslationFactory = (variableType: string) => {
        return this.translateService.instant('variable-type.' + variableType);
    };

    popoverTranslations = {
        popoverHeader: '',
        createNewOption: '',
        placeholderText: '',
        createInputLabel: '',
    };

    private async fetchVariables() {
        this.variables.set(
            (await this.presenterAPI.symbolService.getVariables())
                .filter((variable) => variable.valueType !== VariableValueType.FRAME)
                .sort((a, b) => a.name.localeCompare(b.name)),
        );
        this.variableOptions.set(
            await Promise.all(
                this.variables().map(async (variable) => {
                    const isValidVariable =
                        (await this.presenterAPI.symbolService.isRegisteredVariableName(variable.name)) &&
                        !(await this.presenterAPI.symbolService.isSuppressed(variable.name));
                    return {
                        label: variable.name,
                        value: variable.name,
                        invalid:
                            this.contributedNode.isSuppressed && !this.contributedNode.parameters.variable.entity.reference
                                ? false
                                : variable.suppressed || !isValidVariable,
                    };
                }),
            ),
        );
        this.filteredVariables.set(
            this.variables().filter((variable) => {
                return variable.valueType !== VariableValueType.FRAME &&
                    variable.name !== this.contributedNode.parameters.variable.entity.name
                    ? variable
                    : '';
            }),
        );
    }

    async isValidGridPattern(name: string): Promise<boolean> {
        const gridPatternNode = (await this.presenterAPI.applicationService.getApplicationNode(
            ApplicationNodeType.GRID_PATTERN,
        )) as GridPatternNode;
        // if the grid not found on the grid pattern application node, we assume the grid pattern is valid
        let validGrid = true;
        if (gridPatternNode && name) {
            const grid = gridPatternNode.grids.find((grid: GridPatternParameters) => grid.grid.name === name);
            if (grid) {
                validGrid &&= this.validateGridPattern(grid);
            }
        }
        return validGrid;
    }
    validateGridPattern(gridPattern: GridPatternParameters): boolean {
        // A grid pattern needs to have at least some corner positions defined.
        if (!gridPattern.corners.length) {
            return false;
        }

        // Determine whether the grid pattern is 1D (single row or column) or 2D (matrix).
        // 1D grids need at least 2 corners.
        // 2D grids need at least 4 corners.
        const columns = gridPattern.numColumns;
        const rows = gridPattern.numRows;
        const requiredCorners = columns === 1 || rows === 1 ? 2 : 4;

        const hasRequiredCorners = gridPattern.corners.length >= requiredCorners;

        // Every corner must be defined to be a valid grid.
        const hasValidCorners = gridPattern.corners.every((corner) => !!corner);

        return hasRequiredCorners && hasValidCorners;
    }

    async ngOnChanges(changes: SimpleChanges) {
        await super.ngOnChanges(changes);

        if (changes.presenterAPI) {
            await this.fetchVariables();
        }
    }

    onSetRobotSettings() {
        super.onSetRobotSettings();
        this.setPopoverTranslations();
        this.setValidators();
        this.wayPointSources = this.getWaypointSources();
    }

    async onSetContributedNode() {
        super.onSetContributedNode();

        // Set UI validation state:
        this.isValid.set(await this.tabInputValidator());

        // non-tabInput types validation:
        this.setValidators();

        // get latest variables list:
        await this.fetchVariables();

        await this.setSelectedVariable();

        const waypointType = this.contributedNode.parameters.waypointType;
        const label = this.wayPointSources.find((source) => source.value === waypointType)?.label;
        if (label) this.selectedWaypointSource.set({ value: waypointType, label });

        const { value, selectedType } = this.contributedNode.parameters.variable;
        this.tabInputValue.set({ value, selectedType });

        this.cd.detectChanges();
    }

    async tabInputValidator() {
        if (
            this.contributedNode.parameters.variable.entity.valueType === 'waypoint' &&
            this.contributedNode.parameters.waypointType === WaypointType.Teach
        ) {
            return true;
        }
        if (this.contributedNode.parameters.variable.selectedType === SelectedInput.VARIABLE) {
            const value = this.contributedNode.parameters.variable.value.toString();
            const isGrid = this.contributedNode.parameters.variable.entity.valueType === VariableValueType.GRID;
            const isValidGrid = isGrid ? await this.isValidGridPattern(value) : false;
            return (await this.variableValidator()(value)) === null && (!isGrid || isValidGrid);
        }
        if (this.contributedNode.parameters.variable.value.toString().length === 0) {
            return false;
        }
        return true;
    }

    variableValidator(): InputValidator<string> {
        return async (value: string) => {
            const isRegisteredVariableName = await this.presenterAPI.symbolService.isRegisteredVariableName(value);
            if (!isRegisteredVariableName) {
                return this.translateService.instant('presenter.assignment.variable_not_found_error');
            }
            const isSuppressed = await this.presenterAPI.symbolService.isSuppressed(value);
            if (isSuppressed) {
                return this.translateService.instant('presenter.assignment.variable_suppressed_error');
            }
            const referencedVariable = await this.presenterAPI.symbolService.getVariable(value);
            if (referencedVariable?.valueType !== this.contributedNode.parameters.variable.entity.valueType) {
                return this.translateService.instant('presenter.assignment.variable_type_mismatch_error');
            }
            return null;
        };
    }

    private async setSelectedVariable() {
        const variable = this.contributedNode.parameters.variable.entity;
        const invalid =
            (await this.presenterAPI.symbolService.isSuppressed(variable.name)) ||
            !(await this.presenterAPI.symbolService.isRegisteredVariableName(variable.name));
        this.selectedVariableOption.set({
            label: variable.name,
            value: variable.name,
            invalid,
        });
    }

    setPopoverTranslations() {
        this.popoverTranslations.popoverHeader = this.translateService.instant('presenter.assignment.label.pick_variable');
        this.popoverTranslations.placeholderText = this.translateService.instant('presenter.assignment.label.pick_variable_placeholder');
        this.popoverTranslations.createNewOption = this.translateService.instant('presenter.assignment.label.create_new_option');
        this.popoverTranslations.createInputLabel = this.translateService.instant('presenter.assignment.label.name');
    }

    setValidators() {
        this.expressionValidators.set([
            (input) => {
                if ((input as string).length === 0) {
                    return this.translateService.instant('presenter.assignment.empty_expression_error');
                }
                return null;
            },
        ]);

        this.variableNameValidator = getVariableNameValidator.bind(this)();
    }

    async setNewVariable(varName: string) {
        this.contributedNode.parameters.variable.entity = await this.presenterAPI.symbolService.generateVariable(
            varName,
            this.contributedNode.parameters.variable.entity.valueType ?? VariableValueType.STRING,
        );
        this.saveNode();
    }

    variableDropdownOpen() {
        this.variableDropdown.set(
            this.contributedNode.parameters.variable.entity.reference
                ? { label: this.translateService.instant('presenter.assignment.variable_dropdown.new'), icon: 'plus' }
                : { label: this.translateService.instant('presenter.assignment.variable_dropdown.rename'), icon: 'pencil' },
        );
    }

    async selectVariable(selectedVariableOption: unknown) {
        const selectedVariable = selectedVariableOption as DropdownOption;

        if (selectedVariable.label === this.contributedNode.parameters.variable.entity.name) {
            return;
        }
        const variable = this.variables().find((variable) => variable.name === selectedVariable.label);
        if (!variable) {
            return;
        }
        this.contributedNode.parameters.variable.entity = { ...structuredClone(variable), reference: true } as URVariable;

        if (variable.valueType === VariableValueType.WAYPOINT) {
            this.contributedNode.parameters.waypointType = WaypointType.Teach;
        }
        this.saveNode();
    }

    setTabInputValue($event: TabInputValue) {
        const variable = this.contributedNode.parameters.variable;
        variable.selectedType = $event.selectedType;

        if (variable.selectedType === 'VALUE') {
            switch (variable.entity.valueType) {
                case 'integer':
                    variable.value = parseInt($event.value as string, 10);
                    break;
                case 'float':
                    variable.value = parseFloat($event.value as string);
                    break;
                default:
                    variable.value = String($event.value);
            }
        } else {
            variable.value = String($event.value);
        }

        this.saveNode();
    }

    getWaypointSources() {
        return [
            {
                label: this.translateService.instant('presenter.assignment.label.teach'),
                value: WaypointType.Teach,
            },
            {
                label: this.translateService.instant('presenter.assignment.label.expression'),
                value: WaypointType.Expression,
            },
        ];
    }

    setType(valueType: VariableValueType) {
        let newValue: string | number = '';

        const variable = this.contributedNode.parameters.variable;

        if (valueType === 'waypoint') {
            this.contributedNode.parameters.waypointType = WaypointType.Teach;
        }
        if (valueType === 'float' || valueType === 'integer') {
            newValue = 0;
        }
        this.contributedNode.parameters.variable = new TabInputModel<URVariable>(
            { ...variable.entity, valueType },
            SelectedInput.VALUE,
            newValue,
        );

        this.saveNode();
        this.cd.detectChanges();
    }

    public async openMoveScreen() {
        window.parent.performance.mark('setWaypointStart');
        const waypoint = this.contributedNode.parameters.waypoint;
        const options: MoveScreenOptions = {
            moveScreenTarget: 'waypoint',
            moveScreenTargetLabel: this.contributedNode.parameters.variable.entity.name,
            frame: this.contributedNode.parameters.waypoint?.frame,
            tcp: this.contributedNode.parameters.waypoint?.tcp,
        };
        if (isWaypoint(waypoint)) {
            options.position = waypoint;
        }

        const newWaypoint = await this.presenterAPI.robotMoveService.openMoveScreen(options);
        if (isWaypoint(newWaypoint)) {
            this.contributedNode.parameters.waypoint = newWaypoint;
            this.saveNode();
        }
    }

    public setWaypointSource($event: unknown) {
        const option = $event as DropdownOption & { value: WaypointType };
        this.contributedNode.parameters.waypointType = option.value;
        this.saveNode();
    }
}
