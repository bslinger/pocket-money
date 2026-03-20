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
        badgeClasses: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
    },
    responsibility: {
        label: 'Responsibility',
        description: "Counts toward the weekly allowance. Pocket money is only released when all responsibility chores are done.",
        badgeClasses: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
    },
    no_reward: {
        label: 'No reward',
        description: 'A reminder chore with no payment or tracking attached.',
        badgeClasses: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
    },
};
