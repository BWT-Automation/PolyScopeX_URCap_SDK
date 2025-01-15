import { ChangeDetectionStrategy, Component, computed, EventEmitter, input, Output } from '@angular/core';
import { FrameName, TabInputModel, ToolForceFrame } from '@universal-robots/contribution-api';

@Component({
    selector: 'ur-simple-force-reference-settings',
    templateUrl: './simple-force-reference-settings.component.html',
    styleUrls: ['./simple-force-reference-settings.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleForceReferenceSettingsComponent {
    @Output() selectedFrameChanged = new EventEmitter<TabInputModel<ToolForceFrame>>();
    selectedFrame = input.required<TabInputModel<ToolForceFrame>>();
    frames = input.required<FrameName[]>();
    selectedFrameDropdown = computed(() => {
        const savedFrame = this.selectedFrame().entity.frameName;
        return this.frames().find((frame) => frame === savedFrame) ?? { label: savedFrame, invalid: true };
    });

    public setFrame(frameName: FrameName) {
        const frame: TabInputModel<ToolForceFrame> = { ...this.selectedFrame() };
        frame.entity.frameName = frameName;
        this.selectedFrameChanged.emit(frame);
    }
}
