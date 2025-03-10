// Purpose: Creates and sets a geocode value in the event based on location when the event is being saved
// Action Type: Before Event Save
// Prevent Default Action: Yes
// Requires: Map core functions
// Version: v1.0.0

// @ts-ignore
const globals = {dbk, seedcodeCalendar, utilities, editEvent, event, action};

const globalPrefix = 'dbk_maps_';

// Global imports
const geocodeLocation = globals.seedcodeCalendar.get(
	`${globalPrefix}geocodeLocation`
);

/** @typedef {{lat: string, lng: string}} Geocode */
/** @typedef {{location: string, geocode: Geocode}} EditEvent */

// Geocode the event if this is not from a drag and drop
geocodeEvent();

async function geocodeEvent() {
	if (globals.editEvent.location === globals.event.location) {
		// The location has not changed so don't do anything
		globals.action.callbacks.confirm();
		return;
	} else if (!globals.editEvent.location) {
		// The location has changed and is being removed so clear the geocode
		globals.editEvent.geocode = '';
		globals.action.callbacks.confirm();
		return;
	}

	// The location has changed and was set to something so try to geocode it
	try {
		const geocode = await geocodeLocation(globals.editEvent.location);
		globals.editEvent.geocode = geocode;
	} catch (err) {
		globals.utilities.showModal('Error Geocoding Location', err, 'OK');
	}
	globals.action.callbacks.confirm();
}
