export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    parent_title?: string | null;
}

export interface ActiveFamily {
    id: string;
    name: string;
    currency_name: string;
    currency_symbol: string;
    parents_count: number;
    kids_count: number;
}

export interface SubscriptionStatus {
    active: boolean;
    on_trial: boolean;
    trial_ends_at: string | null;
    subscribed: boolean;
    frozen: boolean;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
        isParent: boolean;
        activeFamily: ActiveFamily | null;
        userFamilies: { id: string; name: string }[];
        viewingAsSpender: { id: string; name: string } | null;
        subscription: SubscriptionStatus | null;
    };
};
