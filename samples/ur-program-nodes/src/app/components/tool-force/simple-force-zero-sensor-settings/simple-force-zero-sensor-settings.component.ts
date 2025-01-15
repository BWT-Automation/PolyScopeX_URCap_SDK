import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TabInputModel, ToolForceZeroSensor } from '@universal-robots/contribution-api';
import { TabInputValue } from '@universal-robots/ui-models';

@Component({
    selector: 'ur-simple-force-zero-sensor-settings',
    templateUrl: './simple-force-zero-sensor-settings.component.html',
    styleUrls: ['./simple-force-zero-sensor-settings.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleForceZeroSensorSettingsComponent {
    @Input() zeroSensor!: TabInputModel<ToolForceZeroSensor>;
    @Output() zeroSensorSettingsChanged = new EventEmitter<TabInputModel<ToolForceZeroSensor>>();

    getZeroSensor() {
        return TabInputModel.getTabInputValue(this.zeroSensor);
    }

    setZeroSensor($event: TabInputValue) {
        this.zeroSensor.value = $event.value;
        this.zeroSensorSettingsChanged.emit(this.zeroSensor);
    }

    setZeroSensorEnabledValue($event: boolean) {
        this.zeroSensor.entity.enabled = $event;
        this.zeroSensorSettingsChanged.emit(this.zeroSensor);
    }
}
