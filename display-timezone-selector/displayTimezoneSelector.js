// Display Timezone Selector v1.0

// Purpose:
// Displays a timezone selector in DayBack's Settings sidebar
// and adds a timezone dispay to the right of the date
// in the caledar header

// Loads a specific set of possible timezones for users to
// pick from instead of the huge list of all tiemzones

// Set this as a "Before Calendar Rendered" App Action
// Prevent Default Action: No

// More info on custom app actions here:
// https://docs.dayback.com/article/140-custom-app-actions

// Declare globals
var options = {};
var inputs = {};

try {
	//----------- Configuration -------------------

	// Options specified for this action

	// Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)
	options.runTimeout = 8;

	// Array of account emails for whom this action will run. Leave blank to allow the action to run for everyone.
	// Example: ['person@domain.com', 'someone@domain.com']
	options.restrictedToAccounts = [];

	// Set config property to show timezone list
	inputs.showInTimezone = true;

	// Optional: set a currently selected timezone. Leave blank to use
	// "auto" which employs the user's current timezone
	inputs.clientTimezone = 'America/New_York';

	// Optional: set list of possible timezones for users to
	// pick from instead of the huge list of all tiemzones
	inputs.timezonesAvailable =
		'America/Los_Angeles, America/Denver, America/Chicago, America/New_York, Europe/Dublin, Asia/Colombo, Africa/Johannesburg, Asia/Tokyo';

	// Enable the next line if calling this after the calendar has
	// rendered, as you might when calling from a button action or
	// when clicking on a resource folder
	// inputs.initializeCalendar = true;

	//----------- End Configuration -------------------
} catch (error) {
	reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
	var config = seedcodeCalendar.get('config');

	config.showInTimezone = inputs.showInTimezone;
	config.clientTimezone = inputs.clientTimezone;
	config.timezonesAvailable = inputs.timezonesAvailable;

	if (inputs.initializeCalendar) {
		seedcodeCalendar.init('initCalendar');
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
