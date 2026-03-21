export type ChoreRewardType = 'earns' | 'responsibility' | 'no_reward';

export interface ChoreTypeInfo {
    label: string;
    description: string;
    badgeClasses: string;
}

export const CHORE_TYPE_INFO: Record<ChoreRewardType, ChoreTypeInfo> = {
    earns: {
        label: 'Earns',
        description: 'A cash reward is paid each time this chore is completed and approved.',
        badgeClasses: 'bg-wattle-50 text-wattle-600 border-wattle-200',
    },
    responsibility: {
        label: 'Responsibility',
        description: "Counts toward the weekly allowance. Pocket money is only released when all responsibility chores are done.",
        badgeClasses: 'bg-eucalyptus-50 text-eucalyptus-600 border-eucalyptus-200',
    },
    no_reward: {
        label: 'No reward',
        description: 'A reminder chore with no payment or tracking attached.',
        badgeClasses: 'bg-bark-100 text-bark-600 border-bark-200',
    },
};
