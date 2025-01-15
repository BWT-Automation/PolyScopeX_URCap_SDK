import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, OnChanges, signal, Signal, SimpleChanges } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, firstValueFrom, map, mergeMap, of, switchMap } from 'rxjs';
import {
    floatOperators,
    ProgramPresenterAPI,
    registerOperator,
    registerOperators,
    SignalAnalogDomainValueEnum,
    SignalDirectionEnum,
    SignalValueTypeEnum,
    Source,
    Signal as SourceSignal,
    TabInputModel,
    Time,
} from '@universal-robots/contribution-api';
import { DropdownOption, SelectedInput, TabInputValue } from '@universal-robots/ui-models';
import { s } from '@universal-robots/utilities-units';
import { CommonProgramPresenterComponent } from '../common-program-presenter.component';
import { SampleWaitNode } from './wait.node';

type SourceDropdownOption = DropdownOption & { groupId: string; groupIdName: string };
@Component({
    templateUrl: './wait.component.html',
    styleUrls: ['./wait.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaitComponent extends CommonProgramPresenterComponent<SampleWaitNode> implements OnChanges {
    localPresenterAPI = signal<ProgramPresenterAPI | undefined>(undefined);
    selectedSignalInput = signal<SampleWaitNode['parameters']['signalInput'] | undefined>(undefined);
    selectedSourceSignal = computed(() =>
        this.signals()?.find((sourceSignal) => sourceSignal.signalID === this.selectedSignalInput()?.signalID),
    );
    selectedSourceOption = computed(() => this.sourcesOptions()?.find((option) => option.value === this.selectedSignalInput()?.sourceID));

    // RegisterOpereator dropdown selection
    registerOperator = computed(() => {
        const valueType = this.selectedSignalType();
        const signalValueType = this.selectedSignalInput()?.signalValueType;
        if (valueType !== signalValueType) {
            return undefined;
        }
        return this.selectedSignalInput()?.registerOperator;
    });

    // Signal value input
    signalValue = computed(() => {
        const valueType = this.selectedSignalType();
        const signalValue = this.selectedSignalInput()?.value;
        const signalValueType = this.selectedSignalInput()?.signalValueType;

        if (!valueType || valueType !== signalValueType) {
            return undefined;
        }
        if (signalValueType === SignalValueTypeEnum.BOOLEAN && typeof signalValue !== 'boolean') {
            return true;
        }
        if (valueType === SignalValueTypeEnum.REGISTER && typeof signalValue !== 'number') {
            return undefined;
        }
        return signalValue;
    });
    variables = toSignal(
        toObservable(this.localPresenterAPI).pipe(switchMap((presenterAPI) => presenterAPI?.symbolService.variables() ?? of([]))),
    );

    sourceNodeLabels: Signal<{ [groupId: string]: string }> = toSignal(
        toObservable(this.localPresenterAPI).pipe(switchMap((presenterAPI) => presenterAPI?.sourceService.sourceNodeLabels() ?? of({}))),
        { initialValue: {} },
    );
    sourcesOptions = computed(() => {
        const options: Array<SourceDropdownOption> = [];
        Object.entries(this.sources()).forEach(([groupId, sources]) => {
            options.push(
                ...sources.map((source) => ({
                    label: groupId === 'robot' ? this.translateService.instant(source.sourceID) : source.name || source.sourceID,
                    value: source.sourceID,
                    groupId,
                    groupIdName:
                        groupId === 'robot'
                            ? this.translateService.instant(`communication.nodes.robot.title`)
                            : this.sourceNodeLabels()[groupId] || groupId,
                })),
            );
        });
        return options;
    });
    sources: Signal<{ [groupId: string]: Array<Source> }> = toSignal(
        toObservable(this.localPresenterAPI).pipe(
            switchMap((presenterAPI) => {
                if (presenterAPI) {
                    return presenterAPI.sourceService.sources({
                        direction: SignalDirectionEnum.IN,
                    });
                }
                return of({});
            }),
        ),
        { initialValue: {} },
    );
    signals = toSignal(
        combineLatest([toObservable(this.selectedSignalInput), toObservable(this.localPresenterAPI)]).pipe(
            mergeMap(([selectedSignalInput, presenterAPI]) => {
                if (!selectedSignalInput) {
                    return [];
                }
                const { groupId, sourceID } = selectedSignalInput;
                if (presenterAPI && groupId && sourceID) {
                    return firstValueFrom(
                        presenterAPI.sourceService.sourceSignals(groupId, sourceID, {
                        direction: SignalDirectionEnum.IN,
                        }),
                    );
                }
                return [];
            }),
            map((signals) => {
                return signals.filter((signal) =>
                    [SignalValueTypeEnum.BOOLEAN, SignalValueTypeEnum.FLOAT, SignalValueTypeEnum.REGISTER].some(
                        (valueType) => valueType === signal.valueType,
                    ),
                );
            }),
        ),
    );
    domains: Signal<{ [signalID: string]: SignalAnalogDomainValueEnum } | undefined> = toSignal(
        combineLatest([toObservable(this.selectedSignalInput), toObservable(this.localPresenterAPI)]).pipe(
            mergeMap(([selectedSignalInput, presenterAPI]) => {
                const sourceId = selectedSignalInput?.sourceID;
                if (presenterAPI && sourceId) {
                    return presenterAPI.sourceService.getAnalogSignalDomains(sourceId);
                }
                return of({});
            }),
        ),
    );
    domain = computed(() => {
        const signalID = this.selectedSignalInput()?.signalID;
        const domains = this.domains();
        if (signalID && domains && Object.hasOwnProperty.call(domains, signalID)) {
            return Reflect.get(domains, signalID) as SignalAnalogDomainValueEnum;
        }
        return undefined;
    });
    selectedSignalType = computed(
        () => this.signals()?.find((signal) => signal.signalID === this.selectedSignalInput()?.signalID)?.valueType,
    );

    readonly s = s;
    readonly CURRENT_CONSTRAINTS = {
        lowerLimit: 4,
        upperLimit: 20,
        unit: 'mA',
    };
    readonly VOLTAGE_CONSTRAINTS = {
        lowerLimit: 0,
        upperLimit: 10,
        unit: 'V',
    };
    private readonly SINGLE_DAY_IN_SECONDS = 86400;
    readonly TIME_CONSTRAINTS = {
        lowerLimit: 0.01,
        upperLimit: this.SINGLE_DAY_IN_SECONDS,
        unit: s.label,
    };

    public timeValidators = [(val: number) => this.validateTime(val)];

    public SignalValueType = SignalValueTypeEnum;
    public analogValueValidators = [(val: number) => this.validateAnalogValue(val)];
    public typeSelection: DropdownOption[];
    public digitalValueOptions: DropdownOption[];
    readonly floatOperators = floatOperators;
    readonly registerOperators = registerOperators;

    constructor(
        protected readonly translateService: TranslateService,
        protected readonly cd: ChangeDetectorRef,
    ) {
        super(translateService, cd);
        this.typeSelection = [
            {
                label: this.translateService.instant('presenter.wait.label.time'),
                value: 'time',
            },
            {
                label: this.translateService.instant('presenter.wait.label.signalInput'),
                value: 'signalInput',
            },
        ];
        this.digitalValueOptions = [
            {
                label: this.translateService.instant('high'),
                value: true,
            },
            {
                label: this.translateService.instant('low'),
                value: false,
            },
        ];
    }

    async ngOnChanges(changes: SimpleChanges) {
        await super.ngOnChanges(changes);
        if (changes.contributedNode?.isFirstChange()) {
            await this.initParamType();
            this.cd.detectChanges();
        }

        if (changes.presenterAPI) {
            this.localPresenterAPI.set(changes.presenterAPI.currentValue);
        }

        if (changes.contributedNode) {
            this.selectedSignalInput.set(changes.contributedNode.currentValue.parameters.signalInput);
        }
    }

    private async initParamType() {
        if (this.contributedNode.parameters.type === 'signalInput') {
            delete this.contributedNode.parameters.time;

            if (!this.contributedNode.parameters.signalInput) {
                this.contributedNode.parameters.signalInput = {};
                return;
            }
        } else if (this.contributedNode.parameters.type === 'time') {
            delete this.contributedNode.parameters.signalInput;
            if (!this.contributedNode.parameters.time) {
                this.contributedNode.parameters.time = new TabInputModel<Time>(
                    {
                        value: 1,
                        unit: s.label,
                    },
                    SelectedInput.VALUE,
                    1,
                );
            }
        }
    }

    async setType({ value }: DropdownOption) {
        if (value !== this.contributedNode.parameters.type) {
            this.contributedNode.parameters.type = value as 'time' | 'signalInput';
            await this.initParamType();
            this.saveNode();
        }
    }

    public getTime() {
        if (!this.contributedNode.parameters.time)
            return {
                selectedType: SelectedInput.VALUE,
                value: '1',
            };

        return TabInputModel.getTabInputValue<Time>(this.contributedNode.parameters.time);
    }

    public setTime($event: TabInputValue): void {
        if (this.contributedNode.parameters.time) {
            const time = this.contributedNode.parameters.time;
            TabInputModel.setTabInputValue(time, $event);
            time.entity.value = Number($event.value);
            this.contributedNode.parameters.time = time;
            this.saveNode();
        }
    }

    public async setSourceID($event: SourceDropdownOption) {
        if (!this.contributedNode.parameters.signalInput) {
            return;
        }
        this.contributedNode.parameters.signalInput.sourceID = $event.value as string;
        this.contributedNode.parameters.signalInput.groupId = $event.groupId;
        this.contributedNode.parameters.signalInput.signalID = undefined;
        this.contributedNode.parameters.signalInput.value = undefined;

        this.saveNode();
    }

    public setSignalID($event: SourceSignal) {
        if (!this.contributedNode.parameters.signalInput) {
            return;
        }
        this.contributedNode.parameters.signalInput.signalID = $event.signalID;
        if ($event.valueType === SignalValueTypeEnum.FLOAT) {
            this.contributedNode.parameters.signalInput.floatOperator = '>';
            if (this.domain() === SignalAnalogDomainValueEnum.CURRENT) {
                this.contributedNode.parameters.signalInput.value = {
                    value: this.CURRENT_CONSTRAINTS.lowerLimit,
                    unit: this.CURRENT_CONSTRAINTS.unit,
                };
            } else if (this.domain() === SignalAnalogDomainValueEnum.VOLTAGE) {
                this.contributedNode.parameters.signalInput.value = {
                    value: this.VOLTAGE_CONSTRAINTS.lowerLimit,
                    unit: this.VOLTAGE_CONSTRAINTS.unit,
                };
            } else {
                this.contributedNode.parameters.signalInput.value = 0;
            }
        } else if ($event.valueType === SignalValueTypeEnum.BOOLEAN) {
            this.contributedNode.parameters.signalInput.value = true;
            this.contributedNode.parameters.signalInput.registerOperator = undefined;
        } else if ($event.valueType === SignalValueTypeEnum.REGISTER) {
            this.contributedNode.parameters.signalInput.registerOperator = undefined;
            this.contributedNode.parameters.signalInput.value = undefined;
        }
        this.contributedNode.parameters.signalInput.signalValueType = $event.valueType;
        this.saveNode();
    }

    public signalLabelFactory = (signal: SourceSignal) => {
        return signal?.name || signal.signalID;
    };

    public getValueLabel() {
        const value = this.contributedNode.parameters.signalInput?.value;
        if (typeof value === 'boolean') {
            return value ? this.translateService.instant('high') : this.translateService.instant('low');
        }

        if (!value) {
            return;
        }

        if (typeof value === 'number') {
            return `${value}`;
        }

        return `${value.value} ${value.unit}`;
    }

    public setAnalogValue($event: string) {
        if ($event && this.contributedNode.parameters.signalInput) {
            const value = parseFloat($event);
            if (this.domain() === SignalAnalogDomainValueEnum.CURRENT) {
                this.contributedNode.parameters.signalInput.value = { value, unit: this.CURRENT_CONSTRAINTS.unit };
            } else if (this.domain() === SignalAnalogDomainValueEnum.VOLTAGE) {
                this.contributedNode.parameters.signalInput.value = { value, unit: this.VOLTAGE_CONSTRAINTS.unit };
            } else {
                this.contributedNode.parameters.signalInput.value = value;
            }
            this.saveNode();
        }
    }

    public setDigitalValue($event: DropdownOption | unknown) {
        if (!this.contributedNode.parameters.signalInput) {
            return;
        }

        const dropDownOption = $event as DropdownOption;
        const signalInput = this.contributedNode.parameters.signalInput;

        signalInput.value = typeof dropDownOption?.value === 'boolean' ? dropDownOption.value : false;
        signalInput.signalValueType = SignalValueTypeEnum.BOOLEAN;

        this.saveNode();
    }

    public setRegisterValue($event: string) {
        if (!this.contributedNode.parameters.signalInput) {
            return;
        }
        this.contributedNode.parameters.signalInput.value = Number($event);
        this.contributedNode.parameters.signalInput.signalValueType = SignalValueTypeEnum.REGISTER;
        this.saveNode();
    }

    public setAnalogOperator($event: string) {
        if (!this.contributedNode.parameters.signalInput) {
            return;
        }
        if ($event === '>' || $event === '<') {
            this.contributedNode.parameters.signalInput.floatOperator = $event;
            this.saveNode();
        }
    }
    public setRegisterOperator($event: registerOperator) {
        if (!this.contributedNode.parameters.signalInput) {
            return;
        }
        this.contributedNode.parameters.signalInput.registerOperator = $event;
        this.contributedNode.parameters.signalInput.signalValueType = SignalValueTypeEnum.REGISTER;
        this.saveNode();
    }

    public getAnalogUnit() {
        if (this.domain() === SignalAnalogDomainValueEnum.CURRENT) {
            return this.CURRENT_CONSTRAINTS.unit;
        }
        if (this.domain() === SignalAnalogDomainValueEnum.VOLTAGE) {
            return this.VOLTAGE_CONSTRAINTS.unit;
        }
        return undefined;
    }

    public validateAnalogValue(val: number) {
        if (this.domain() === SignalAnalogDomainValueEnum.CURRENT) {
            return this.getRangeErrorString(val, this.CURRENT_CONSTRAINTS);
        }
        if (this.domain() === SignalAnalogDomainValueEnum.VOLTAGE) {
            return this.getRangeErrorString(val, this.VOLTAGE_CONSTRAINTS);
        }
        return undefined;
    }

    public validateTime(val: number) {
        return this.getRangeErrorString(val, this.TIME_CONSTRAINTS);
    }
}
