// Create Internal URL v1.6

// Purpose:
// Gets a list of active filters and builds a URL to share
// your current view with internal users of the organization

// Action Type: Button Action
// Open in new window: No

// More info on button actions here:
// https://docs.dayback.com/article/5-custom-actions#resources

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

	//Change this value to false if you do not want the link to open a specific event

	inputs.linkToEvent = true;

	//----------- End Configuration -------------------
} catch (error) {
	reportError(error);
}

// ----------- The action itself: you likely don't need to modify the following -------------------

// Action code goes inside this function
function run() {
	var baseURL = inputs.baseURL;
	var sourceList = seedcodeCalendar.get('schedules');
	var statusList = seedcodeCalendar.get('statuses');
	var resourceList = seedcodeCalendar.get('resources');
	var contactList = seedcodeCalendar.get('contacts');
	var projectList = seedcodeCalendar.get('projects');
	var startDate = seedcodeCalendar
		.get('view')
		.intervalStart.format('YYYY-MM-DD');
	var calendarView = seedcodeCalendar.get('view').name;
	var textFilter = '';

	// Start or continue the query arguments according to the base URL
	var calendarURL = baseURL.includes('?') ? baseURL + '&' : baseURL + '?';

	// Add the view and date data to URL
	calendarURL = calendarURL + 'view=' + calendarView + '&date=' + startDate;

	// Adding the event ID to the base URL if requested.
	if (inputs.linkToEvent) {
		calendarURL = calendarURL + '&id=' + event.eventID;
	}

	// Populating the text filter if it exists.
	if (seedcodeCalendar.get('textFilters')) {
		textFilter = '&filterText=' + seedcodeCalendar.get('textFilters');
	}

	//A dd the required filter parameters to the URL
	calendarURL = encodeURI(
		calendarURL +
			getActiveFilterItemsString('source', sourceList) +
			getActiveFilterItemsString('filterStatuses', statusList) +
			getActiveFilterItemsString('filterResources', resourceList) +
			getActiveFilterItemsString('filterContacts', contactList) +
			getActiveFilterItemsString('filterProjects', projectList) +
			textFilter
	);

	// Copy the link to the clipboard
	copyToClipboard(calendarURL);

	// Show notification that link has been copied to clipboard
	utilities.showModal(
		'A link to the filtered calendar has been copied to your clipboard',
		'',
		'OK',
		null
	);

	// Returns a formatted string of active values
	// from the input array for a DayBack URL

	function getActiveFilterItemsString(flag, filterArray) {
		var returnString = '';

		if (filterArray) {
			filterArray.forEach(function (currentItem) {
				if (currentItem.status && currentItem.status.selected) {
					returnString += '&' + flag + '=' + currentItem.name;
				}
			});
		}
		return returnString;
	}

	// Copies the input to Clipboard
	function copyToClipboard(stringToCopy) {
		// create new temp input object
		var tempInput = $('<input>')
			.val(stringToCopy)
			.appendTo('body')
			.select();
		document.execCommand('copy');

		// Remove the temp input object it as its not needed anymore
		tempInput.remove();
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
