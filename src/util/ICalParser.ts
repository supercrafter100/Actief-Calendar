import ical from 'cal-parser';

interface Event {
    created: Date,
    dtend: { value: Date, params: { tzid: string } },
    dtstamp: Date,
    dtstart: { value: Date, params: { tzid: string } },
    'last-modified': Date,
    sequence: { value: string },
    summary: { value: string },
    uid: { value: string },
    url: { value: string, params: { value: string } }

}

export default async function parseExternalICalCalendar(url: string) {
    const contents = await fetch(url)
        .then((res) => res.text());
    const data = ical.parseString(contents);
    return data.events as Event[];
}