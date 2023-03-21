import ActiefAPI from "./ActiefAPI";
import { ICalCalendar } from "ical-generator";

export default class CalendarManager {

    private static Calendars = new Map<string, CalendarManager>();
    public static async GetCalendar(id: string, username: string, password: string) {
        if (this.Calendars.has(id)) return this.Calendars.get(id);

        const calendar = new CalendarManager(username, password);
        await calendar.refreshCalendar();
        this.Calendars.set(id, calendar);
        return calendar;
    }

    public static async RefreshCalendars() {
        for (const calendar of this.Calendars.values()) {
            await calendar.refreshCalendar();
        }
    }

    private _username: string;
    private _password: string;
    private _actiefApi = new ActiefAPI();

    public calendar = new ICalCalendar();

    constructor(username: string, password: string) {
        this._username = username;
        this._password = password;
    }

    private async getAccessToken() {
        const cookies = await this._actiefApi.login(this._username, this._password);
        if (!cookies) {
            return { code: undefined, cookies: undefined }
        }

        const { code, code_verifier } = await this._actiefApi.AuthorizeClient(cookies);
        const token = await this._actiefApi.getAccessToken(cookies, code, code_verifier);

        return { token, cookies };
    }

    private async getCalendarEventsForYear() {
        const first = new Date(2023, 0, 1);
        const last = new Date(first.getFullYear() + 1, 0, 1);

        const { token, cookies } = await this.getAccessToken();
        if (!token || !cookies) return;

        const events = await this._actiefApi.getCalenderEvents(cookies, token, first, last);
        return events;
    }

    public async refreshCalendar() {
        const events = await this.getCalendarEventsForYear();
        if (!events) return;

        this.calendar.clear();
        for (const event of events.events) {
            if (event.type !== 90000) continue;

            this.calendar.createEvent({
                start: event.from,
                end: event.until,
                summary: event.label
            })
        }
    }
}