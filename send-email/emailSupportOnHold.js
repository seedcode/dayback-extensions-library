// Email Support On Hold Status v1.5

// Purpose:
// Opens a new email in the default mail client with details of an event
// This takes effect when an event has been changed to the status specified
//
// Action Type: Event Action
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

	options.runTimeout = 0;

	// Array of account emails for whom this action will run. Leave blank to allow the action to run for everyone.
	// Example: ['person@domain.com', 'someone@domain.com']

	options.restrictedToAccounts = [];

	// Configure the status code change which should trigger the email

	inputs.emailOnStatus = 'On Hold';

	// Configure the Base URL. If you are not in Salesforce you can leave the following
	// default setting.
	//
	// Salesforce Users Only:
	// ----------------------
	//
	// You will need to remove the default setting, and replace it with the following
	// line of code instead, then change the URL to reseble the base URL of your server:
	//
	//      inputs.baseURL = 'https://yourserver.com/apex/DayBack?sfdc.tabName=01r1a000000dGry';
	//
	// This URL can be found by entering Classic mode, clicking the DayBack tab, and copying
	// the URL from your browser's address bar

	inputs.baseURL = location.href.split('?')[0];

	// Modify the emailTo address or emailSubject contents as desired

	inputs.emailTo = 'support@seedcode.com';

	//----------- End Configuration -------------------
} catch (error) {
	reportError(error);
}

// ----------- The action itself: -------------------
//
// If you want to change the contents of email, you may need to modify
// the following section of code
//
// ---------------------------------------------------

// Action code goes inside this function
function run() {
	// Start or continue the query arguments according to the base URL

	var baseURL = inputs.baseURL;
	baseURL = baseURL.includes('?') ? baseURL + '%26' : baseURL + '%3F';

	var description = editEvent.description;
	var linkToEvent = 'Link to event: ' + baseURL + 'id=' + event.eventID;

	var emailSubject =
		'The following event has been set to ' +
		event.status +
		': ' +
		event.titleEdit;

	// For Salesforce empty fields, don't show the default "undefined" string

	if (!description || description === 'undefined') {
		description = '';
	}

	// Construct your mailto link

	var finalURL =
		'mailto:' +
		inputs.emailTo +
		'?subject=' +
		emailSubject +
		'&body=' +
		description +
		'%0A%0A' +
		linkToEvent;

	// Check if the event status has been set to "On Hold"

	if (
		!revertObject.status.includes(inputs.emailOnStatus) &&
		event.status.includes(inputs.emailOnStatus)
	) {
		// Open the mailto link

		open(finalURL);
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
