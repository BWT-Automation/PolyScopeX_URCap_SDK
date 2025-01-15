import { ChangeDetectionStrategy, Component, computed, EventEmitter, input, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
    convertValue,
    EndEffector,
    FrameName,
    OrientationAxes,
    PoseAxis,
    PositionAxes,
    PositionAxis,
    RobotSettings,
    TCP,
    TCPName,
    URVariable,
    valueRawConverter,
    WaypointTabInputModel,
} from '@universal-robots/contribution-api';
import { DropdownOption, TabInputValue } from '@universal-robots/ui-models';
import { m, rad, Unit } from '@universal-robots/utilities-units';
import { Active_TCP } from '../move-to.constants';

type TcpDropdownOption = Omit<DropdownOption, 'value'> & {
    endEffectorName?: string;
    label: string;
    id: string;
    tcp?: TCPName;
    invalid?: boolean;
};

@Component({
    selector: 'ur-move-to-reference-settings',
    templateUrl: './reference-settings.component.html',
    styleUrls: ['./reference-settings.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferenceSettingsComponent {
    endEffectors = input.required<EndEffector[]>();
    variables = input.required<Array<URVariable>>();
    settings = input.required<RobotSettings>();
    waypoint = input.required<WaypointTabInputModel>();
    frames = input.required<FrameName[]>();
    selectedFrame = computed(() => {
        const savedFrame = this.waypoint().frame;
        return this.frames().find((frame) => frame === savedFrame) ?? { label: savedFrame, invalid: true };
    });
    tcpOptions = computed(() => [
        {
            endEffectorName: 'Robot',
            label: this.translateService.instant('presenter.move-to.label.active_tcp'),
            id: Active_TCP,
        },
        ...this.endEffectors().flatMap((cv) =>
            cv.tcps.map((tcp) => ({
                endEffectorName: cv.name,
                label: tcp.name,
                id: tcp.id,
                tcp,
            })),
        ),
    ]);
    selectedTcp = computed<TcpDropdownOption>(() => {
        const savedTcp = this.waypoint().tcp;
        // option for
        if (!savedTcp) {
            return { label: this.translateService.instant('presenter.move-to.label.active_tcp'), id: Active_TCP };
        }
        return this.findSelectedTcp(savedTcp);
    });
    displayWaypoint = computed<WaypointTabInputModel>(() => {
        const poseEntries: WaypointTabInputModel['pose'] = Object.entries(this.waypoint().pose).reduce((previousValue, [axis, pose]) => {
            if (pose.selectedType === 'VALUE') {
                const unit = this.settings().units[PositionAxes.includes(axis as PositionAxis) ? 'LENGTH' : 'PLANE_ANGLE'];
                previousValue[axis as PositionAxis] = {
                    ...previousValue[axis as PositionAxis],
                    value: valueRawConverter(pose.entity, unit as Unit),
                };
            }
            return previousValue;
        }, structuredClone(this.waypoint().pose));
        return {
            ...this.waypoint(),
            pose: {
                ...poseEntries,
            },
        };
    });
    @Output()
    waypointChange = new EventEmitter<WaypointTabInputModel>();

    positionAxes = PositionAxes;
    orientationAxes = OrientationAxes;

    constructor(private readonly translateService: TranslateService) {}

    public setFrame(frame: FrameName) {
        const waypoint: WaypointTabInputModel = { ...this.waypoint(), frame };
        this.waypointChange.emit(waypoint);
    }

    setPoseValue(axis: string, tabInputValue: TabInputValue) {
        let entity;
        if (tabInputValue.selectedType === 'VALUE') {
            const unitType = PositionAxes.includes(axis as PositionAxis) ? 'LENGTH' : 'PLANE_ANGLE';
            const fromUnit = this.settings().units[unitType].label;
            const toUnit = unitType === 'LENGTH' ? m.label : rad.label;
            entity = convertValue({ value: parseFloat(tabInputValue.value.toString()), unit: fromUnit }, toUnit);
        }
        const waypoint: WaypointTabInputModel = {
            ...this.waypoint(),
            pose: {
                ...this.waypoint().pose,
                [axis]: {
                    ...this.waypoint().pose[axis as PoseAxis],
                    ...tabInputValue,
                    value: entity?.value ?? tabInputValue.value,
                    entity,
                },
            },
        };
        this.waypointChange.emit(structuredClone(waypoint));
    }

    public setTcp(option: TcpDropdownOption) {
        // if it's not a known tcp, it's the active tcp
        const knownTcp = this.endEffectors()
            .flatMap((cv) => cv.tcps)
            .find((tcp) => tcp.name === option?.label) as TCP;

        const waypoint: WaypointTabInputModel = {
            ...this.waypoint(),
            tcp: knownTcp && { name: knownTcp.name, id: knownTcp.id },
        };
        this.waypointChange.emit(waypoint);
    }

    private findSelectedTcp(savedTcp: TCPName): TcpDropdownOption {
        const tcp = this.endEffectors()
            .flatMap((cv) => cv.tcps)
            .find((tcp) => tcp.id === savedTcp?.id);
        const source = tcp || savedTcp;
        return { label: source.name, id: source.id, invalid: !tcp };
    }
}
