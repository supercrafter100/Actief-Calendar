export interface User {
    id: number;
    email: string;
    password: string;
    route: string;
}

export interface ExternalCalendar {
    id: number;
    url: string;
    accountId: number;
}

export interface Webhook {
    id: number;
    url: string;
    accountId: number;
}