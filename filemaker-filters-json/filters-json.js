// Pull Filters from FileMaker in JSON format v1.01

// Purpose:
// Pulls resource or status filters from a table in FileMaker and displays them in DayBack Calendar.
// Action Type: On Resources Fetched/On Statuses Fetched
// Prevent Default Action: Yes

// Do not enable this action for "Shares", only for App.

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

	//The name of the script which builds the filter data from FileMaker
	inputs.scriptName = 'Sample Resources JSON - DayBack';

	//Specify 'resources' or 'statuses'
	inputs.filterType = 'resources';

	//The currently signed in account email
	inputs.account = seedcodeCalendar.get('config').account;

	//----------- End Configuration -------------------
} catch (error) {
	reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
	var filterItems = [];
	var item;

	if (utilities.getDBKPlatform() === 'dbkfmjs') {
		dbk.performFileMakerScript(inputs.scriptName, null, function (result) {
			if (result && result.payload) {
				for (var i = 0; i < result.payload.length; i++) {
					item = result.payload[i];
					dbk.mutateFilterField(item);
					filterItems.push(item);
				}
			}

			filterItems = dbk.filterFieldSort(filterItems);
			seedcodeCalendar.init(inputs.filterType, filterItems);

			confirmCallback();
		});
	} else {
		confirmCallback();
	}
}

//----------- Run function wrapper and helpers - you shouldnÃ¢â‚¬â„¢t need to edit below this line. -------------------

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
