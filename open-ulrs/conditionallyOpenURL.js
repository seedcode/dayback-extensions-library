// Conditionally Open URL v1.0

// Purpose:
// This button action will open the URL stored in
// the location field. If no URL is found, it will
// display an error message dialogue
//
// Action Type: Button Action
// Open In New Window: No

// More info on custom App Actions here:
// https://docs.dayback.com/article/140-custom-app-actions

// Declare globals
var options = {};
var inputs = {};

try {
	//----------- Configuration -------------------

	// Options specified for this action

	// Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)

	options.runTimeout = 0;

	// Array of account emails for whom this action will run. Leave blank to allow the action to run for everyone.
	// Example: ['person@domain.com', 'someone@domain.com']

	options.restrictedToAccounts = [];

	// Define the variable you want to scan for a URL

	inputs.scanVariable = event.location;

	// Configure the dialogue message that will be displayed when location field does not contain a URL

	inputs.dialogTitle = 'Location Not Found';

	inputs.dialogMessage = 'The location does not include a URL';

	//----------- End Configuration -------------------
} catch (error) {
	reportError(error);
}

// ----------- The action itself: -------------------

// Action code goes inside this function
function run() {
	// Define where we are reading ups numbers from
	var searchText = inputs.scanVariable;

	// Is there a url in the searchText field?
	var isURL = searchText.indexOf('http') !== -1;

	// open url or show disalog
	if (isURL) {
		open(searchText, '_blank');
	} else {
		// utilities.showModal(title, message, cancelButtonText, cancelFunction, confirmButtonText, confirmFunction)
		utilities.showModal(
			inputs.dialogTitle,
			inputs.dialogMessage,
			'',
			'',
			'OK',
			utilities.showModal('hide')
		);
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
