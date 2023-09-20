// Set Calendars to Read Only by User v1.0

// Purpose:
// Sets specified calendars to read-only based on the logged in user

// Action Type: After Events Rendered
// Prevent Default Action: No

// More info on Custom App Actions here
// https://docs.dayback.com/article/140-custom-app-actions

// Select Resource To Current User v1.0

// Purpose:
// Sets the resource selection to match the currently logged in user
// Action Type: Before Calendar Rendered
// Prevent Default Action: No

// More info on custom App Actions here:
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

	// define which calendars are read only for specific users.
	inputs.readOnlyConfig = {
		'jason@daybackjason.com': ['Events', 'Campaigns'],
	};

	//----------- End Configuration -------------------
} catch (error) {
	reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
	// get loaded schedules
	var schedules = seedcodeCalendar.get('schedules');

	// get config for username.
	var config = seedcodeCalendar.get('config');

	// dayback account name. In salesforce this is the salesforce username (email format).
	var userName = config.account;

	// pull array from our readOnlyConfig object based on logged in username.
	var readOnlySchedules = inputs.readOnlyConfig[userName];

	// loop through our schedules and mark any specified in readOnlySchedules as not editable
	if (readOnlySchedules) {
		for (var i = 0; i < readOnlySchedules.length; i++) {
			for (var c = 0; c < schedules.length; c++) {
				if (readOnlySchedules[i] === schedules[c].name) {
					schedules[c].editable = false;
					console.log('here');
				}
			}
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
