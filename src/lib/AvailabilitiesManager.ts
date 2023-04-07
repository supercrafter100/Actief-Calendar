import { ExternalCalendar } from "../types/DatabaseTypes";
import { decryptPassword } from "../util/Crypto";
import parseExternalICalCalendar from "../util/ICalParser";
import logToDiscordWebhook from "../util/LogToWebhook";
import CalendarManager from "./CalendarManager";
import Database from "./Database";

export default class AvailabilitiesManager {

    private _database: Database;
    constructor(database: Database) {
        this._database = database;
    }

    public async refreshAvailabilities() {
        const externalUrls = await this._database.getAllExternalCalendars();
        for (const calendar of externalUrls) {
            await this.refreshAvailability(calendar);
        }
    }

    private async refreshAvailability(calendar: ExternalCalendar) {
        const icalEvents = await parseExternalICalCalendar(calendar.url);
        const relevantEvents = icalEvents
            .filter(event => event.dtstart.value.getTime() >= Date.now())
            .sort((a, b) => a.dtstart.value.getTime() - b.dtstart.value.getTime());

        const userData = await this._database.getUserById(calendar.accountId);
        const localCalendar = await CalendarManager.GetCalendar(userData.route, userData.email, decryptPassword(userData.password), this._database);
        if (!localCalendar) throw new Error("Local calendar was null!");

        const { token, cookies } = await localCalendar.getAccessToken();
        if (!token || !cookies) throw new Error("Token or cookies were undefined. Did the login fail?");

        const availabilities = await localCalendar.actiefApi.getAvailabilities(token);

        // Check if the availability of a day from our relevant
        // events matches one that already exists on that same day
        // if so, we have to edit that existing availability with the
        // updated start and end time

        for (const event of relevantEvents) {
            // Check if we have activity to update
            const existingAvailability = availabilities.find(availability => datesAreOnSameDay(new Date(availability.from), event.dtstart.value));
            if (existingAvailability) continue; // Already handled

            // Create the availability
            const result = await localCalendar.actiefApi.registerNewAvailability(token, event.dtstart.value, event.dtend.value);
            if (result) {
                const webhook = await this._database.getWebhookForUser(calendar.accountId);
                await logToDiscordWebhook(webhook.url, `New availability found on ${event.dtstart.value.getUTCDate()}/${event.dtstart.value.getUTCMonth() + 1}/${event.dtstart.value.getUTCFullYear()}`)
            }
        }
    }
}

function datesAreOnSameDay(first: Date, second: Date) {
    return first.getFullYear() === second.getFullYear() &&
        first.getMonth() === second.getMonth() &&
        first.getDate() === second.getDate();
}