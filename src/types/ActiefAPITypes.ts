export interface EventsResponse {
    events: Event[];
}

export interface UserResponse {
    sub: string;
    preferred_username: string;
    given_name: string;
    family_name: string;
    name: string;
}

export interface Event {
    label: string;
    calendarTypeDefinitionId: number;
    isAllDayEvent: boolean;
    from: string;
    until: string;
    type: number;
}