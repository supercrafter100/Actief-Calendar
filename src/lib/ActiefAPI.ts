import { load } from 'cheerio';
import { Event, EventsResponse } from '../types/ActiefAPITypes';
import { base64URLEncode, GenerateCodeVerifier, sha256 } from '../util/Util';

export default class ActiefAPI {
    /**
     * Log into the actief website
     * @param username The username of the user to login with
     * @param password The password of the user to login with
     * @returns A promise that resolves to the session cookies
     */
    public async login(
        username: string,
        password: string
    ): Promise<string | undefined> {
        const bookUUrl = 'https://app.booku.be/Staff';
        const redirect = await fetch(bookUUrl, {
            redirect: 'manual',
        });

        if (redirect.status !== 302) {
            console.log('Failed to redirect at intial request');
            return undefined;
        }

        let originalCookies = '';
        for (const [name, cookie] of redirect.headers.entries()) {
            if (name === 'set-cookie') {
                originalCookies += cookie.split(';')[0] + '; ';
            }
        }

        const authorizeUrl = redirect.headers.get('Location') as string;
        const secondRedirect = await fetch(authorizeUrl, {
            redirect: 'manual',
        });

        if (secondRedirect.status !== 302) {
            console.log('Failed to redirect at second request');
            return undefined;
        }
        let cookies = '';
        const loginUrl = secondRedirect.headers.get('Location') as string;
        for (const [name, cookie] of secondRedirect.headers.entries()) {
            if (name === 'set-cookie') {
                cookies += cookie.split(';')[0] + '; ';
            }
        }

        const state = loginUrl.split('state=')[1];
        // Post to this url with login details
        const res = await fetch('https://account.booku.app' + loginUrl, {
            method: 'POST',
            body: new URLSearchParams({
                username: username,
                password: password,
                action: 'default',
                state: state,
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                cookie: cookies,
            },
        });

        const html = await res.text();
        const $ = load(html);

        // Find all inputs and make a key-value with the key being the name in the input and value being the value
        const inputs: { [key: string]: string } = {};
        $('input').each((_, elem) => {
            const input = $(elem);
            inputs[input.attr('name') as string] = input.attr(
                'value'
            ) as string;
        });

        // Post to this url with the inputs to https://app.booku.be/
        const appRequest = await fetch('https://app.booku.be/', {
            method: 'POST',
            body: new URLSearchParams(inputs),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                cookie: originalCookies,
            },
            redirect: 'manual',
        });

        if (appRequest.status !== 302) {
            console.log('Failed to redirect at app request');
            return undefined;
        }

        for (const [name, cookie] of appRequest.headers.entries()) {
            if (name === 'set-cookie') {
                originalCookies += cookie.split(';')[0] + '; ';
            }
        }

        return originalCookies;
    }

    public async getCalenderEvents(cookies: string): Promise<EventsResponse> {
        // TODO: https://app.booku.be/Staff/Registration/GetInvitations?start=2025-02-24&end=2025-04-07&_=1740772832974
        const res = await fetch('https://app.booku.be/Staff/Registration', {
            headers: {
                cookie: cookies,
            },
        }).then((res) => res.text());

        const $ = load(res);

        const events = $(
            'body > div.wrapper > div.content-container > div > section > div:nth-child(2) > div > div > div.box-body > div.hidden-lg > div'
        ).map(async (_, elem) => {
            const event = $(elem);
            const time = event.find('small').text();
            const name = event.find('h3').text().trim();
            const location = event
                .find('p')
                .toArray()
                .map((p) => $(p).text())
                .join(' ');

            const details = event.find('a').attr('href');
            const shiftName = await this.getShiftName(
                cookies,
                details as string
            );
            const regex =
                /(.*){2} (\d{2}-\d{2}-\d{4}) (\d{2}:\d{2}).+(\d{2}:\d{2})/g;
            const matches = regex.exec(time);
            if (matches) {
                const startStr = `${matches[2]}T${matches[3]}:00`;
                const endStr = `${matches[2]}T${matches[4]}:00`;

                const formattedStartDate = startStr.replace(
                    /(\d{2})-(\d{2})-(\d{4})/,
                    '$3-$2-$1'
                );
                const formattedEndDate = endStr.replace(
                    /(\d{2})-(\d{2})-(\d{4})/,
                    '$3-$2-$1'
                );
                const start = new Date(formattedStartDate);
                const end = new Date(formattedEndDate);

                return {
                    name: name.split(' ')[1] + ' - ' + shiftName,
                    start: start,
                    end: end,
                    location: location,
                } as Event;
            }

            return {
                name: 'unknown',
                start: new Date(),
                end: new Date(),
                location: location,
            };
        });

        const actualEvents = (await Promise.all(events.toArray())).filter(
            (event) => event.name !== 'unknown'
        );
        return { events: actualEvents };
    }

    public async getShiftName(cookies: string, url: string) {
        const page = await fetch('https://app.booku.be/' + url, {
            headers: {
                cookie: cookies,
            },
        }).then((res) => res.text());

        const $ = load(page);
        const name = $('#InfoBlokken > div:nth-child(1) > div:nth-child(6)')
            .text()
            .trim();

        return name;
    }
}
