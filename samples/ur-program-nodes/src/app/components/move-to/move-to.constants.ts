import { Acceleration, AngularAcceleration, AngularSpeed, Speed, TabInputModel } from '@universal-robots/contribution-api';
import { SelectedInput } from '@universal-robots/ui-models';

export const MoveConstraints = {
    moveJ: {
        speed: { lowerLimit: 0.01, upperLimit: 6.28318531, unit: 'rad/s' },
        acceleration: { lowerLimit: 0.01, upperLimit: 80, unit: 'rad/s^2' },
    },
    moveL: {
        speed: { lowerLimit: 0.00001, upperLimit: 3, unit: 'm/s' },
        acceleration: { lowerLimit: 0.00001, upperLimit: 150, unit: 'm/s^2' },
    },
};

export const getDefaultJointSpeed = () =>
    new TabInputModel<AngularSpeed>({ value: 1.04719755, unit: 'rad/s' }, SelectedInput.VALUE, 1.04719755);

export const getDefaultLinearSpeed = () => new TabInputModel<Speed>({ value: 0.25, unit: 'm/s' }, SelectedInput.VALUE, 0.25);

export const getDefaultJointAcceleration = () =>
    new TabInputModel<AngularAcceleration>({ value: 1.3962633999999998, unit: 'rad/s^2' }, SelectedInput.VALUE, 1.3962633999999998);

export const getDefaultLinearAcceleration = () => new TabInputModel<Acceleration>({ value: 1.2, unit: 'm/s^2' }, SelectedInput.VALUE, 1.2);
export const Active_TCP = 'Active TCP' as const;

export const getDefaultMotionValue = () => Movement_Optimove;

export const getDefaultOptiMoveSpeed = () => 30;

export const getDefaultOptiMoveAcceleration = () => 9;

export const Movement_Optimove = 'OptiMove' as const;

export const Movement_Classic = 'Classic' as const;
