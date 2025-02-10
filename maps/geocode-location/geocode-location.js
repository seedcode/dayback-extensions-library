// Purpose: Creates and sets a geocode value in the event based on location
// Action Type: Before Event Save, Button Action
// Prevent Default Action: No
// Requires: Map core functions
// Version: v1.0.0

// @ts-ignore
const globals = {dbk, seedcodeCalendar, utilities, editEvent};

const globalPrefix = 'dbk_maps_';

// Global imports
const geocodeLocation = globals.seedcodeCalendar.get(
	`${globalPrefix}geocodeLocation`
);

/** @typedef {{lat: string, lng: string}} Geocode */
/** @typedef {{location: string, geocode: Geocode}} EditEvent */

geocodeLocation(globals.editEvent.location)
	.then((/** @type {Geocode} */ geocode) => {
		globals.editEvent.geocode = geocode;
	})
	.catch((/** @type {Error} */ err) => {
		globals.utilities.showModal('Error Geocoding Location', err, 'OK');
	});
