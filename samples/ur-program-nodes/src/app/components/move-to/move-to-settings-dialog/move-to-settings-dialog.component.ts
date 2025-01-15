import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
    MoveToBlendSettings,
    MoveToSpeedSettings,
    MoveToTransformSettings,
    WaypointTabInputModel,
} from '@universal-robots/contribution-api';
import { WebComponentDialogComponent } from '@universal-robots/contribution-api/angular';
import { SelectedInput } from '@universal-robots/ui-models';
import { Movement_Optimove } from '../move-to.constants';
import { MoveToDialogModel } from './move-to-dialog.model';

@Component({
    templateUrl: './move-to-settings-dialog.component.html',
    styleUrls: ['./move-to-settings-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoveToSettingsDialogComponent implements WebComponentDialogComponent<MoveToDialogModel, MoveToDialogModel>, OnInit {
    @Input()
    inputData!: MoveToDialogModel;

    @Output()
    outputDataChange = new EventEmitter<MoveToDialogModel>();

    @Output()
    canSave = new EventEmitter<boolean>();

    activeTab = 'speed';
    referenceLabel = signal<string>('');

    constructor(private readonly translateService: TranslateService) {}

    ngOnInit() {
        this.outputDataChange.emit(this.inputData);
        this.referenceLabel.set(this.getReferenceLabel());
    }

    onLinkChanged(event: string) {
        this.activeTab = event;
    }

    onSpeedSettingsChanged($event: MoveToSpeedSettings) {
        this.inputData.advanced.speed = $event;
        this.outputDataChange.emit(this.inputData);
    }

    onWaypointChange($event: WaypointTabInputModel) {
        this.inputData.waypoint = $event;
        this.referenceLabel.set(this.getReferenceLabel());
        this.outputDataChange.emit(this.inputData);
    }

    getReferenceLabel() {
        let result = '';
        if (!this.inputData.waypoint || this.inputData.variable.selectedType !== SelectedInput.VALUE) {
            return this.translateService.instant('presenter.move-to.label.active_tcp');
        }
        const selectedFrame = this.inputData.waypoint.frame;
        const selectedTcp = this.inputData.waypoint.tcp;
        if (selectedFrame) {
            result = selectedFrame;
        }
        if (selectedTcp) {
            result = `${result}, ${selectedTcp.name}`;
        } else {
            result = `${result}, ${this.translateService.instant('presenter.move-to.label.active_tcp')}`;
        }
        return result;
    }

    onTransformSettingsChanged($event: MoveToTransformSettings) {
        this.inputData.advanced.transform = $event;
        this.outputDataChange.emit(this.inputData);
    }

    onBlendSettingsChanged($event: MoveToBlendSettings) {
        this.inputData.advanced.blend = $event;
        this.outputDataChange.emit(this.inputData);
    }

    protected readonly Movement_Optimove = Movement_Optimove;
}
