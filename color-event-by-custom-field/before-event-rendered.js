// Change event background color v1.0
//
// Purpose:
// Set Event background color based on Custom Field Value
//
// Action Type: Before Event Rendered
// Prevent Default Action: No
//
// More info on custom actions here:
// https://docs.dayback.com/article/140-custom-app-actions

// Declare globals
const globals = { action, params, dbk, seedcodeCalendar, utilities };

const options = {};
const inputs = {};

try {
	//----------- Configuration -------------------

	// Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)
	// Leave this set to 0 to avoid unexpected behavior

	options.runTimeout = 0;

	// Define the Calendar Sources that should be
	// scanned for specific Custom Field values

	inputs.calendarToCheck = ['Events'];

	// Set the Custom Field that contains information
	// that can be used to style an Event. Set this to the
	// "Store in Field" name of your Custom Field

	inputs.eventColorCustomField = 'Event_Color__c';

	// If we find events where this Custom Field is defined,
	// we will set the event.color property to the value of the 
	// Custom Field, which will change the background color of 
	// the event on the calendar. You can use any valid CSS 
	// color value in your Custom Field, including hex codes 
	// (e.g. #FF0000), rgb values (e.g. rgb(255,0,0)), or 
	// color names (e.g. red).

	//----------- End Configuration -------------------
} catch (error) {
	reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {

	// Check if the event being rendered belongs to a calendar we want to check
	if (inputs.calendarToCheck.includes(event.schedule.name)) {
		// Get the Custom Field ID for the specified Custom Field name and calendar
		let colorFieldId = dbk.getCustomFieldIdByName(
			inputs.eventColorCustomField,
			event.schedule
		);

		// If the Custom Field is defined for this event, set the event color to the value of the Custom Field
		if (colorFieldId && event[colorFieldId] && event[colorFieldId] !== '') {
			event.color = event[colorFieldId];
		}
	}
}

//----------- Run function wrapper and helpers - you shouldn’t need to edit below this line. -------------------

// Variables used for helper functions below
var timeout;

// Execute the run function as defined above
try {
	if (
		!options.restrictedToAccounts ||
		!options.restrictedToAccounts.length ||
		(options.restrictedToAccounts &&
			options.restrictedToAccounts.indexOf(inputs.account) > -1)
	) {
		if (action.preventDefault && options.runTimeout) {
			timeoutCheck();
		}
		run();
	} else if (action.preventDefault) {
		confirmCallback();
	}
} catch (error) {
	reportError(error);
}

// Run confirm callback when preventDefault is true. Used for async actions
function confirmCallback() {
	cancelTimeoutCheck();
	if (action.callbacks.confirm) {
		action.callbacks.confirm();
	}
}

// Run cancel callback when preventDefault is true. Used for async actions
function cancelCallback() {
	cancelTimeoutCheck();
	if (action.callbacks.cancel) {
		action.callbacks.cancel();
	}
}

// Check if the action has run within the specified time limit when preventDefault is enabled
function timeoutCheck() {
	timeout = setTimeout(
		function () {
			var error = {
				name: 'Timeout',
				message:
					'The action was unable to execute within the allotted time and has been stopped',
			};
			reportError(error, true);
		},
		options && options.runTimeout ? options.runTimeout * 1000 : 0
	);
}

function cancelTimeoutCheck() {
	if (timeout) {
		clearTimeout(timeout);
	}
}

// Function to report any errors that occur when running this action
// Follows standard javascript error reporter format of an object with name and message properties
function reportError(error) {
	var errorTitle = 'Error Running Custom Action';
	var errorMessage =
		'<p>There was a problem running the action "<span style="white-space: nowrap">' +
		action.name +
		'</span>"</p><p>Error: ' +
		error.message +
		'.</p><p>This may result in unexpected behavior of the calendar.</p>';
	if (action.preventDefault && action.category !== event && timeout) {
		confirmCallback();
	} else {
		cancelCallback();
	}

	setTimeout(function () {
		utilities.showModal(
			errorTitle,
			errorMessage,
			null,
			null,
			'OK',
			null,
			null,
			null,
			true,
			null,
			true
		);
	}, 1000);
}


