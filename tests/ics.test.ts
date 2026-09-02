import { describe, expect, test } from 'vitest';
import { buildGoogleCalendarUrl, buildIcs } from '@/lib/calendar/ics';

const evento = {
  title: 'XV Años de Valentina',
  description: 'Misa, recepción y baile',
  location: 'Templo de San José, Calle 5 #12',
  start: new Date('2026-11-14T02:00:00.000Z'),
  durationMinutes: 90,
};

describe('buildIcs', () => {
  test('produces a valid calendar envelope', () => {
    const ics = buildIcs(evento);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
  });

  test('writes start and end in UTC basic format', () => {
    const ics = buildIcs(evento);

    expect(ics).toContain('DTSTART:20261114T020000Z');
    expect(ics).toContain('DTEND:20261114T033000Z');
  });

  test('escapes commas so the location does not split into fields', () => {
    const ics = buildIcs(evento);

    expect(ics).toContain('LOCATION:Templo de San José\\, Calle 5 #12');
  });
});

describe('buildGoogleCalendarUrl', () => {
  test('links to the Google Calendar event composer with the right window', () => {
    const url = new URL(buildGoogleCalendarUrl(evento));

    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe('XV Años de Valentina');
    expect(url.searchParams.get('dates')).toBe('20261114T020000Z/20261114T033000Z');
  });
});
