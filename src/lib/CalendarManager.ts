import ActiefAPI from './ActiefAPI';
import { ICalCalendar } from 'ical-generator';
import Database from './Database';
import logToDiscordWebhook from '../util/LogToWebhook';

export default class CalendarManager {
    public static Calendars = new Map<string, CalendarManager>();
    public static async GetCalendar(
        id: string,
        username: string,
        password: string,
        database: Database
    ) {
        if (CalendarManager.Calendars.has(id))
            return CalendarManager.Calendars.get(id);

        const calendar = new CalendarManager(username, password, database);
        await calendar.refreshCalendar();
        CalendarManager.Calendars.set(id, calendar);
        return calendar;
    }

    public static async RefreshCalendars() {
        for (const calendar of CalendarManager.Calendars.values()) {
            await calendar.refreshCalendar();
        }
    }

    private _username: string;
    private _password: string;
    private _database: Database;
    public actiefApi = new ActiefAPI();

    public calendar = new ICalCalendar();

    constructor(username: string, password: string, database: Database) {
        this._username = username;
        this._password = password;
        this._database = database;
    }

    public async getCookies() {
        return await this.actiefApi.login(this._username, this._password);
    }

    public async getUpcomingCalendarEvents() {
        const cookies = await this.actiefApi.login(
            this._username,
            this._password
        );

        if (!cookies) return;

        const events = await this.actiefApi.getCalenderEvents(cookies);
        return events.events.map((event) => ({
            start: event.start,
            end: event.end,
            summary: `${event.name}`,
        }));
    }

    public async refreshCalendar() {
        const events = await this.getUpcomingCalendarEvents();
        if (!events) return;

        const user = await this._database.getUserByEmail(this._username);
        const webhook = await this._database.getWebhookForUser(user.id);

        const existingEvents = this.calendar.events();
        const accumulatedAdditions: Date[] = [];

        for (const event of events) {
            if (
                existingEvents.some((ev) =>
                    datesAreOnSameDay(
                        new Date(ev.start() as string),
                        new Date(event.start)
                    )
                )
            )
                continue;

            this.calendar.createEvent({
                start: event.start,
                end: event.end,
                summary: event.summary,
            });

            if (new Date(event.start).getTime() > Date.now()) {
                accumulatedAdditions.push(new Date(event.end));
            }
        }

        for (const event of existingEvents) {
            if (!events.some((ev) => ev.start === event.start())) {
                // Slice the event out of the calendar events
                this.calendar
                    .events()
                    .splice(this.calendar.events().indexOf(event), 1);
            }
        }

        if (accumulatedAdditions.length) {
            logToDiscordWebhook(
                webhook.url,
                `New contract${accumulatedAdditions.length == 1 ? '' : 's'} ${
                    accumulatedAdditions.length == 1 ? 'has' : 'have'
                } been made for the following date${
                    accumulatedAdditions.length == 1 ? '' : 's'
                }:\n\n ${accumulatedAdditions
                    .map(
                        (addition) =>
                            `• \`${addition.getDate()}/${
                                addition.getMonth() + 1
                            }/${addition.getFullYear()}\``
                    )
                    .join('\n')}`
            );
        }
    }
}

function datesAreOnSameDay(first: Date, second: Date) {
    return (
        first.getFullYear() === second.getFullYear() &&
        first.getMonth() === second.getMonth() &&
        first.getDate() === second.getDate()
    );
}
