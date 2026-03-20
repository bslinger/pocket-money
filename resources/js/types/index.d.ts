export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
}

export interface ActiveFamily {
    id: string;
    name: string;
    currency_name: string;
    currency_symbol: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
        isParent: boolean;
        activeFamily: ActiveFamily | null;
        userFamilies: { id: string; name: string }[];
    };
};
