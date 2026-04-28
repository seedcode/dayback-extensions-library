// Set Filters by View v1.0
// Salesforce only

// Purpose:
// Sets the resource filters based on the current view when resources are mapped to the Owner.Name field
// When the user lands on a Resource view they and all resources sharing the same folder are selected
// When the user lands on any view but Resources just they are selected as the resource.

// Action Type: App Action - After View Changed
// Prevent Default Action: No

// More info on App Actions Here:
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

	// No configuration objects exist for this action
	// If you need to change the login, you may do so by changing the run function

	//----------- End Configuration -------------------
} catch (error) {
	reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
	// retrieve the current user name from the canvas context object
	var currentUser = fbk.context().user.fullName;
	var currentView = seedcodeCalendar.get('view');

	if (currentView.name.indexOf('Resource') !== -1) {
		//we're on a resource view select the current users team/folder
		selectFolder(getUserFolderId(currentUser));
	} else {
		//we're not on resource view, selece just th current user
		selectUser(currentUser);
	}

	//function for selecting the user and deslecting everybody else
	function selectUser(user) {
		var resources = seedcodeCalendar.get('resources');
		for (var i = 0; i < resources.length; i++) {
			if (resources[i].name === user) {
				resources[i].status.selected = true;
			} else {
				resources[i].status.selected = false;
			}
		}
		//reset columns/rows
		dbk.resetResources();
	}

	//function for selecting all users in the current user's folder
	function selectFolder(Id) {
		var resources = seedcodeCalendar.get('resources');
		for (var i = 0; i < resources.length; i++) {
			if (resources[i].folderID === Id) {
				resources[i].status.selected = true;
			} else {
				resources[i].status.selected = false;
			}
		}
		//reset columns/rows
		dbk.resetResources();
	}

	//function for identifying current user's folderId
	function getUserFolderId(user) {
		var resources = seedcodeCalendar.get('resources');
		for (var i = 0; i < resources.length; i++) {
			if (resources[i].name === user) {
				return resources[i].folderID;
			}
		}
		return false;
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
