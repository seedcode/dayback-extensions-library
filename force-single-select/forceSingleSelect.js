// Force Single Select v1.0

// Purpose:
// Forces Single Selection for the status and/or resource fields
// Particularily useful on mobile where multi-select is the default behavior
// and the field only supports a single value

// Action Type: On Field Change
// Prevent Default Action: Yes
//
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

	// Array of fields to force single select, possible values are resource and status
	inputs.fieldsToEnforce = ['status', 'resource'];

	// Enforce this function on mobile only?
	inputs.mobileOnly = false;

	// Any input data for the action should be specified here

	//----------- End Configuration -------------------
} catch (error) {
	reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
	if (params && params.data) {
		forceSingleSelect();
	}

	function forceSingleSelect() {
		var mobileCheck = inputs.mobileOnly ? environment.isMobileDevice : true;

		if (
			inputs.fieldsToEnforce.filter(checkField).length > 0 &&
			mobileCheck
		) {
			$timeout(function () {
				if (params.data.selected) {
					editEvent[params.data.field] = [params.data.value];
					if (params.data.label) {
						editEvent[params.data.field + 'Label'] = [
							params.data.label,
						];
					}
				} else {
					editEvent[params.data.field] = [];
					if (params.data.label) {
						editEvent[params.data.field + 'Label'] = [];
					}
				}
				cancelCallback();
			}, 0);
		} else {
			confirmCallback();
		}

		function checkField(field) {
			if (field === params.data.field) {
				return true;
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
	if (action.preventDefault && timeout) {
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
