import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnChanges,
    Signal,
    SimpleChanges,
    computed,
    inject,
    signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, firstValueFrom, map, mergeMap, of, switchMap } from 'rxjs';
import {
    Current,
    ProgramPresenterAPI,
    SignalAnalogDomainValueEnum,
    SignalDirectionEnum,
    SignalValueTypeEnum,
    Source,
    Signal as SourceSignal,
    Voltage,
} from '@universal-robots/contribution-api';
import { DropdownOption } from '@universal-robots/ui-models';
import { CommonProgramPresenterComponent } from '../common-program-presenter.component';
import { SampleSetNode } from './set.node';

type SourceDropdownOption = DropdownOption & { groupId: string; groupIdName: string; value: string };

@Component({
    templateUrl: './set.component.html',
    styleUrls: ['./set.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetComponent extends CommonProgramPresenterComponent<SampleSetNode> implements OnChanges {
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

    localPresenterAPI = signal<ProgramPresenterAPI | undefined>(undefined);
    selectedSignalOutput = signal<SampleSetNode['parameters']['signalOutput'] | undefined>(undefined);
    selectedSourceSignal = computed(() =>
        this.signals()?.find((sourceSignal) => sourceSignal.signalID === this.selectedSignalOutput()?.signalID),
    );
    selectedSourceOption = computed(() => this.sourcesOptions()?.find((option) => option.value === this.selectedSignalOutput()?.sourceID));

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
                        direction: SignalDirectionEnum.OUT,
                    });
                }
                return of({});
            }),
        ),
        { initialValue: {} },
    );
    signals = toSignal(
        combineLatest([toObservable(this.selectedSignalOutput), toObservable(this.localPresenterAPI)]).pipe(
            mergeMap(([selectedSignalOutput, presenterAPI]) => {
                if (!selectedSignalOutput) {
                    return [];
                }
                const { groupId, sourceID } = selectedSignalOutput;
                if (presenterAPI && groupId && sourceID) {
                    return firstValueFrom(
                        presenterAPI.sourceService.sourceSignals(groupId, sourceID, {
                        direction: SignalDirectionEnum.OUT,
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
        combineLatest([toObservable(this.selectedSignalOutput), toObservable(this.localPresenterAPI)]).pipe(
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
        const signalID = this.selectedSignalOutput()?.signalID;
        const domains = this.domains();
        if (signalID && domains && Object.hasOwnProperty.call(domains, signalID)) {
            return Reflect.get(domains, signalID) as SignalAnalogDomainValueEnum;
        }
        return undefined;
    });
    selectedSignalType = computed(
        () => this.signals()?.find((signal) => signal.signalID === this.selectedSignalOutput()?.signalID)?.valueType,
    );

    selectedSignalOption = computed(() => {
        if (this.selectedSourceSignal()?.valueType === this.selectedSignalOutput()?.signalValueType) {
            return this.selectedSignalType() === this.SignalValueType.FLOAT
                ? ((this.selectedSignalOutput()?.value as Voltage | Current)?.value ?? this.selectedSignalOutput()?.value ?? undefined)
                : (this.selectedSignalOutput()?.value ?? undefined);
        }
        return undefined;
    });

    public SignalValueType = SignalValueTypeEnum;
    public valueValidators = [this.validateValue.bind(this)];

    public digitalValueOptions = [true, false];

    translateService = inject(TranslateService);
    cd = inject(ChangeDetectorRef);

    async ngOnChanges(changes: SimpleChanges) {
        await super.ngOnChanges(changes);

        if (changes.presenterAPI) {
            this.localPresenterAPI.set(changes.presenterAPI.currentValue);
        }

        if (changes.contributedNode) {
            this.selectedSignalOutput.set(changes.contributedNode.currentValue.parameters.signalOutput);
        }
    }

    public signalLabelFactory = (signal: SourceSignal) => {
        return signal?.name || signal.signalID;
    };

    getValueLabel = (value: boolean) => {
        return value ? this.translateService.instant('high') : this.translateService.instant('low');
    };

    public async setSourceID($event: SourceDropdownOption) {
        if (!this.contributedNode.parameters.signalOutput) {
            return;
        }
        this.contributedNode.parameters.signalOutput.sourceID = $event.value;
        this.contributedNode.parameters.signalOutput.groupId = $event.groupId;
        this.contributedNode.parameters.signalOutput.signalID = undefined;
        this.contributedNode.parameters.signalOutput.value = undefined;
        this.saveNode();
    }

    public setSignalID($event: SourceSignal) {
        if (!this.contributedNode.parameters.signalOutput) {
            return;
        }
        this.contributedNode.parameters.signalOutput.signalID = $event.signalID;
        this.contributedNode.parameters.signalOutput.signalValueType = $event.valueType;
        switch ($event.valueType) {
            case SignalValueTypeEnum.FLOAT:
                if (this.domain() === SignalAnalogDomainValueEnum.CURRENT) {
                    this.contributedNode.parameters.signalOutput.value = {
                        value: this.CURRENT_CONSTRAINTS.lowerLimit,
                        unit: this.CURRENT_CONSTRAINTS.unit,
                    };
                } else if (this.domain() === SignalAnalogDomainValueEnum.VOLTAGE) {
                    this.contributedNode.parameters.signalOutput.value = {
                        value: this.VOLTAGE_CONSTRAINTS.lowerLimit,
                        unit: this.VOLTAGE_CONSTRAINTS.unit,
                    };
                } else {
                    this.contributedNode.parameters.signalOutput.value = 0;
                }
                break;
            case SignalValueTypeEnum.BOOLEAN:
                this.contributedNode.parameters.signalOutput.value = true;
                break;
            case SignalValueTypeEnum.REGISTER:
                this.contributedNode.parameters.signalOutput.value = 0;
                break;
        }
        this.saveNode();
    }

    public setAnalogValue($event: string) {
        const value = parseFloat($event);
        if (this.contributedNode.parameters.signalOutput) {
            switch (this.domain()) {
                case SignalAnalogDomainValueEnum.CURRENT:
                    this.contributedNode.parameters.signalOutput.value = { value, unit: this.CURRENT_CONSTRAINTS.unit };
                    break;
                case SignalAnalogDomainValueEnum.VOLTAGE:
                    this.contributedNode.parameters.signalOutput.value = { value, unit: this.VOLTAGE_CONSTRAINTS.unit };
                    break;
                default:
                    this.contributedNode.parameters.signalOutput.value = value;
            }
            this.contributedNode.parameters.signalOutput.signalValueType = SignalValueTypeEnum.FLOAT;
            this.saveNode();
        }
    }

    setRegisterValue($event: string) {
        if (this.contributedNode.parameters.signalOutput) {
            this.contributedNode.parameters.signalOutput.value = Number($event);
            this.contributedNode.parameters.signalOutput.signalValueType = SignalValueTypeEnum.REGISTER;
            this.saveNode();
        }
    }

    public setDigitalValue(value: boolean) {
        if (!this.contributedNode.parameters.signalOutput) {
            return;
        }
        this.contributedNode.parameters.signalOutput.value = value;
        this.contributedNode.parameters.signalOutput.signalValueType = SignalValueTypeEnum.BOOLEAN;
        this.saveNode();
    }

    public getAnalogUnit() {
        if (this.domain() === SignalAnalogDomainValueEnum.CURRENT) {
            return this.CURRENT_CONSTRAINTS.unit;
        }
        if (this.domain() === SignalAnalogDomainValueEnum.VOLTAGE) {
            return this.VOLTAGE_CONSTRAINTS.unit;
        }
        return null;
    }

    public validateValue(val: number) {
        if (this.domain() === SignalAnalogDomainValueEnum.CURRENT) {
            return this.getRangeErrorString(val, this.CURRENT_CONSTRAINTS);
        }
        if (this.domain() === SignalAnalogDomainValueEnum.VOLTAGE) {
            return this.getRangeErrorString(val, this.VOLTAGE_CONSTRAINTS);
        }
        return null;
    }
}
