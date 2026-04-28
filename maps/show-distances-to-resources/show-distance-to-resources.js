// Purpose: Shows the distance from an event to a resource if the resource has a location
// Action Type: Button
// Requires: Map core functions, Map core resource buttons
// Version: v1.0.0

// Configuration ===========================>

const views = ['basicResourceHor', 'agendaResourceHor']; // The DayBack views where this action is allowed to run

// End Configuration

// @ts-ignore
const globals = {dbk, seedcodeCalendar, utilities, editEvent};

const globalPrefix = 'dbk_maps_';

// Global imports
const getResourceDistances = globals.seedcodeCalendar.get(
	`${globalPrefix}getResourceDistances`
);
const renderResourceDistances = globals.seedcodeCalendar.get(
	`${globalPrefix}renderResourceDistances`
);

/** @typedef {{format: Function, diff: Function}} Moment */
/** @typedef {{lat: string, lng: string}} Geocode */
/** @typedef {{start: Moment, end: Moment, location: string, geocode: Geocode}} EditEvent */

const view = globals.seedcodeCalendar.get('view');

if (!views.includes(view.name)) {
	globals.utilities.showModal(
		'Unsupported view',
		'Please switch to a supported view and try again. You’ll see the map icon beside each resource on a supported view.',
		'OK'
	);
} else if (!globals.editEvent.geocode && !globals.editEvent.location) {
	globals.utilities.showModal(
		'Missing required data',
		'A location or geocode is required for the event',
		'OK'
	);
} else {
	getResourceDistances(
		globals.editEvent.geocode || globals.editEvent.location,
		globals.editEvent.start
	)
		.then((/** @type {unknown} */ resourceDistances) => {
			renderResourceDistances(resourceDistances);
		})
		.catch((/** @type {Error} */ err) => {
			globals.utilities.showModal('Could not get distances', err, 'OK');
		});
}
