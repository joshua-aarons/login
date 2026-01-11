


const example = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//My Website//EN
BEGIN:VEVENT
UID:${crypto.randomUUID()}@mywebsite.com
DTSTAMP:${formatDateUTC(new Date())}
DTSTART:20260201T150000Z
DTEND:20260201T160000Z
SUMMARY:My Dynamic Event
DESCRIPTION:This event was generated dynamically.
LOCATION:Online
END:VEVENT
END:VCALENDAR`