export interface EventsResponse {
    events: Event[];
}

export interface Event {
    label: string;
    calendarTypeDefinitionId: number;
    isAllDayEvent: boolean;
    from: string;
    until: string;
    type: number;
}