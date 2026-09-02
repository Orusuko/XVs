export type CalendarEvent = {
  title: string;
  description: string;
  location: string;
  start: Date;
  durationMinutes: number;
};

function toBasicUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function endOf({ start, durationMinutes }: CalendarEvent): Date {
  return new Date(start.getTime() + durationMinutes * 60_000);
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export function buildIcs(event: CalendarEvent): string {
  const uid = `${toBasicUtc(event.start)}-${Math.random().toString(36).slice(2, 10)}@xv-invitaciones`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//XV Invitaciones//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toBasicUtc(new Date())}`,
    `DTSTART:${toBasicUtc(event.start)}`,
    `DTEND:${toBasicUtc(endOf(event))}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `LOCATION:${escapeText(event.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function buildGoogleCalendarUrl(event: CalendarEvent): string {
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', event.title);
  url.searchParams.set('details', event.description);
  url.searchParams.set('location', event.location);
  url.searchParams.set('dates', `${toBasicUtc(event.start)}/${toBasicUtc(endOf(event))}`);

  return url.toString();
}
