
/**
 * @typedef {Object} TimeZoneInfo
 * @property {number} offset - Offset in minutes from UTC
 * @property {string} name - Full name of the time zone
 * @property {string} offsetString - Formatted offset string (e.g., GMT+10:00)
 * @property {string} offsetStringPlain - Plain offset string without GMT/UTC prefix
 * @property {Array<string>|string} [ids] - List of IANA time zone identifiers
 */


/**
 * Get formatted parts of a date based on options
 * @param {Object} options - Intl.DateTimeFormat options
 * @param {Date} date - Date object to format (default is a fixed date)
 * @returns {Object<string, string>} - An object with formatted parts
 */
function getFormattedParts(options, date = new Date('2026-01-01T00:00:00Z')) {
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const partsList = formatter.formatToParts(date);
    const parts = {};
    for (const part of partsList) {
        parts[part.type] = part.value;
    }
    return parts;
}

/**
 * Get time zone information including name and offset
 * @param {string} timeZone - IANA time zone identifier
 * @returns {TimeZoneInfo} - An object containing offset, name, and offsetString
 */
function getTimeZoneInfo(timeZone) {
    const name = getFormattedParts({ timeZoneName: 'long', timeZone }).timeZoneName;
    const timeZoneOffset = getFormattedParts({ timeZoneName: 'longOffset', timeZone }).timeZoneName;

    const offsetMatch = timeZoneOffset.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);
    let offset = 0;
    if (offsetMatch) {
        const hours = parseInt(offsetMatch[1], 10);
        const minutes = parseInt(offsetMatch[2] || '0', 10);
        offset = Math.round(100 * (hours + minutes / 60))
    }

    let offsetStringPlain = timeZoneOffset.replace("GMT", "").replace("UTC", "");
    if (offsetStringPlain === "") {
        offsetStringPlain = "+00:00";
    }
    return {
        offset,
        name,
        offsetString: timeZoneOffset,
        offsetStringPlain
    };
}

/**
 * @type {Object<string, TimeZoneInfo>}
 */
const TimeZonesByName = {
    
}

// Build an object of time zones grouped by name
const zones = Intl.supportedValuesOf("timeZone");
zones.forEach(id => {
    const {name, offset, offsetString, offsetStringPlain} = getTimeZoneInfo(id);
    if (name !== offsetString) {   
        if (!(name in TimeZonesByName)) {
            TimeZonesByName[name] = {
                name, ids: [], offset, offsetString, offsetStringPlain
            }
        }
        let saved = TimeZonesByName[name];
        saved.ids.push(id);
    }
});

// Create a sorted list of time zones (sorted by name)
const TimeZoneList = Object.values(TimeZonesByName);
TimeZoneList.sort((a, b) => a.name.localeCompare(b.name) );


export { TimeZonesByName, TimeZoneList, getFormattedParts, getTimeZoneInfo };