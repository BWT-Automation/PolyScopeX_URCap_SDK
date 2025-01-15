import { ChangeDetectionStrategy, Component, computed, EventEmitter, input, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { convertValue, MoveToSpeedSettings, MoveType, URVariable, Value, valueRawConverter } from '@universal-robots/contribution-api';
import { DropdownOption, InputValidator, SelectedInput, TabInputValue } from '@universal-robots/ui-models';
import { Acceleration, AngularSpeed, CONCEPT_UNITS, Unit, UnitEnum, Units } from '@universal-robots/utilities-units';
import { getConvertedTabInputValue } from '../../tabinput-helper';
import { getRangeErrorString } from '../../validator-helper';
import { MoveConstraints, Movement_Classic, Movement_Optimove } from '../move-to.constants';

@Component({
    selector: 'ur-move-to-speed-settings',
    templateUrl: './speed-settings.component.html',
    styleUrls: ['./speed-settings.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeedSettingsComponent {
    speedSettings = input.required<MoveToSpeedSettings>();
    moveType = input.required<MoveType>();
    units = input.required<Units>();
    variables = input.required<URVariable[]>();

    @Output()
    speedSettingsChanged = new EventEmitter<MoveToSpeedSettings>();

    speedUnit = computed(() => (this.moveType() === 'moveJ' ? this.units().ANGULAR_SPEED : this.units().SPEED));
    accelerationUnit = computed(() => (this.moveType() === 'moveJ' ? this.units().ANGULAR_ACCELERATION : this.units().ACCELERATION));
    convertedSpeed = computed(() =>
        getConvertedTabInputValue(this.speedSettings().speed, (value: Value) =>
            valueRawConverter(value, this.speedUnit() as Unit<AngularSpeed>),
        ),
    );
    convertedAcceleration = computed(() =>
        getConvertedTabInputValue(this.speedSettings().acceleration, (value: Value) =>
            valueRawConverter(value, this.accelerationUnit() as Unit<Acceleration>),
        ),
    );

    motionValueOptions: DropdownOption[];

    constructor(private readonly translateService: TranslateService) {
        this.motionValueOptions = [
            {
                value: Movement_Optimove,
                label: this.translateService.instant('presenter.move-to.label.optimove'),
            },
            {
                value: Movement_Classic,
                label: this.translateService.instant('presenter.move-to.label.classic'),
            },
        ];
    }

    setMotionValue(motionValue: DropdownOption) {
        this.speedSettingsChanged.emit({ ...this.speedSettings(), motionValue: motionValue.value as string });
    }

    setSpeed($event: TabInputValue) {
        const inputValue = $event.value;

        const SI_UNIT = this.moveType() === 'moveJ' ? 'rad/s' : 'm/s';

        const speed = { ...structuredClone(this.speedSettings().speed), selectedType: $event.selectedType };
        if ($event.selectedType === SelectedInput.VALUE) {
            const convertedSpeed = convertValue({ value: Number(inputValue), unit: this.speedUnit().label }, SI_UNIT);
            speed.entity = convertedSpeed;
            speed.value = convertedSpeed.value;
        } else {
            speed.value = inputValue;
        }

        this.speedSettingsChanged.emit({
            ...this.speedSettings(),
            speed,
        });
    }

    setAcceleration($event: TabInputValue) {
        const inputValue = $event.value;

        const SI_UNIT = this.moveType() === 'moveJ' ? 'rad/s^2' : 'm/s^2';

        const acceleration = { ...structuredClone(this.speedSettings().acceleration), selectedType: $event.selectedType };
        if ($event.selectedType === SelectedInput.VALUE) {
            const convertedAcceleration = convertValue({ value: Number(inputValue), unit: this.accelerationUnit().label }, SI_UNIT);
            acceleration.entity = convertedAcceleration;
            acceleration.value = convertedAcceleration.value;
        } else {
            acceleration.value = inputValue;
        }

        this.speedSettingsChanged.emit({
            ...this.speedSettings(),
            acceleration,
        });
    }

    setOptiMoveSpeed($event: number) {
        this.speedSettingsChanged.emit({ ...this.speedSettings(), optiMoveSpeed: $event });
        }

    setOptiMoveAcceleration($event: number) {
        this.speedSettingsChanged.emit({ ...this.speedSettings(), optiMoveAcceleration: $event });
    }

    public validateSpeed: InputValidator = (val: string | number) => {
        return getRangeErrorString(Number(val), MoveConstraints[this.moveType()].speed, this.units(), this.translateService);
    };

    public validateAcceleration: InputValidator = (val: string | number) => {
        return getRangeErrorString(Number(val), MoveConstraints[this.moveType()].acceleration, this.units(), this.translateService);
    };

    public getInputLabelText(unit: UnitEnum) {
        return this.translateService.instant('presenter.move.label.input_help') + ' ' + CONCEPT_UNITS[unit].symbol;
    }

    protected readonly Movement_Classic = Movement_Classic;
}
