import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TabInputModel, ToolForceFrame, ToolForceZeroSensor } from '@universal-robots/contribution-api';
import { WebComponentDialogComponent } from '@universal-robots/contribution-api/angular';
import { SimpleForceDialogModel } from './simple-force-dialog.model';

@Component({
    templateUrl: './simple-force-settings-dialog.component.html',
    styleUrls: ['./simple-force-settings-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleForceSettingsDialogComponent
    implements WebComponentDialogComponent<SimpleForceDialogModel, SimpleForceDialogModel>, OnInit
{
    @Input() inputData!: SimpleForceDialogModel;
    @Output() outputDataChange = new EventEmitter<SimpleForceDialogModel>();
    @Output() canSave = new EventEmitter<boolean>();

    activeTab = 'reference';
    referenceLabel = signal<string>('');
    zeroSensorLabel = signal<string>('');

    constructor(private readonly translateService: TranslateService) {}

    ngOnInit() {
        this.outputDataChange.emit(this.inputData);
        this.zeroSensorLabel.set(this.getZeroSensorLabel());
        this.referenceLabel.set(this.getReferenceLabel());
    }

    onLinkChanged(event: string) {
        this.activeTab = event;
    }

    onZeroSensorSettingsChanged($event: TabInputModel<ToolForceZeroSensor>) {
        this.inputData.zeroSensor = $event;
        this.zeroSensorLabel.set(this.getZeroSensorLabel());
        this.outputDataChange.emit(this.inputData);
    }

    onSelectedFrameChanged($event: TabInputModel<ToolForceFrame>) {
        this.inputData.selectedFrame = $event;
        this.referenceLabel.set(this.getReferenceLabel());
        this.outputDataChange.emit(this.inputData);
    }

    getZeroSensorLabel() {
        if (!this.inputData.zeroSensor.entity.enabled) {
            return '';
        }
        return `${this.inputData.zeroSensor.value} sec`;
    }

    getReferenceLabel() {
        return this.inputData.selectedFrame.entity.frameName;
    }
}
