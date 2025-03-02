export interface EventsResponse {
    events: Event[];
}

export interface Event {
    name: string;
    start: Date;
    end: Date;
    location: string;
}
