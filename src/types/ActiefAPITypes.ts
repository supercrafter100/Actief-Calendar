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

export interface AvailabilitiesResponse {
    id: number;
    from: string;
    until: string;
    hoursFrom: number;
    minutesFrom: number;
    hoursUntil: number;
    minutesUntil: number;
    calendarTypeDefinition: {
        id: number;
        label: string;
        calendarTypeDefinition: number;
    };
    calendarDefinition: {
        id: number;
        businessUnit: number;
        name: string;
        label: string;
        orderNr: number;
        backOfficeServiceCode: string;
        calenderTypeDefinitionId: number;
        canReduceTimesheetHours: boolean;
        showForEmployerPersona: boolean;
        showOnManualTimesheet: boolean;
        calendarTypeDefinition: number;
        minValue: number;
        maxValue: number;
    };
    candidateCalendarType: number;
    recurringPeriod: number;
    documents: any[];
    isApprovedByCompany: boolean;
}