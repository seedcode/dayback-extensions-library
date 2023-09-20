// Filter Resources with Events v1.3 - Part 2

// Purpose:
// Adds and manages button to enable accompanying filterResourcesWithEvents.js action

// Action Type: After Calendar Rendered
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

	// No configuration options necessary

	//----------- End Configuration -------------------
} catch (error) {
	reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
	//Clear flag used in accompanying events rendered action in case coming from settings tab
	seedcodeCalendar.init('resourceRefresh', false);

	var viewName = seedcodeCalendar.get('view')
		? seedcodeCalendar.get('view').name
		: '';
	var cbContainer = document.getElementById(
		'filter-resources-with-events-container'
	);
	var enable = localStorage
		? localStorage.getItem('filterResourcesWithEvents') === 'true'
		: !!seedcodeCalendar.get('filterResourcesWithEvents');
	var maxRetries = 20;
	var retries = 0;
	var rootButtonContainer;
	var cbEnable;
	var cbDisable;

	//Create button to toggle this feature on and off
	if (!cbContainer) {
		queueButtonCreation();
	}

	function queueButtonCreation() {
		rootButtonContainer = document.querySelector(
			'.calendar-button-container'
		);

		if (rootButtonContainer) {
			cbContainer = document.createElement('div');
			cbContainer.id = 'filter-resources-with-events-container';
			cbContainer.classList = 'filter-resources-button-container';
			if (
				viewName.includes('Resource') ||
				(viewName.includes('Horizon') &&
					seedcodeCalendar.get('config').horizonBreakoutField ===
						'resource')
			) {
				cbContainer.style.display = 'block';
			} else {
				cbContainer.style.display = 'none';
			}
			cbEnable = document.createElement('div');
			cbEnable.id = 'filter-resources-with-events-enable';
			cbEnable.classList =
				'filter-resources-button filter-resources-button-enable fa fa-group fa-lg';
			cbEnable.style.display = enable ? 'none' : 'block';
			cbEnable.onclick = toggleFilterResourcesWithEvents;
			cbContainer.append(cbEnable);
			cbDisable = document.createElement('div');
			cbDisable.id = 'filter-resources-with-events-disable';
			cbDisable.classList =
				'filter-resources-button filter-resources-button-disable fa fa-group fa-lg';
			cbDisable.style.display = enable ? 'block' : 'none';
			cbDisable.onclick = toggleFilterResourcesWithEvents;
			cbContainer.append(cbDisable);
			rootButtonContainer.append(cbContainer);
			seedcodeCalendar.init('filterResourcesWithEvents', enable);
		} else {
			retries++;
			if (retries <= maxRetries) {
				setTimeout(queueButtonCreation, 200);
			}
		}
	}

	function toggleFilterResourcesWithEvents() {
		var enable = !seedcodeCalendar.get('filterResourcesWithEvents');
		var resourceFilters = seedcodeCalendar.get('resources');
		seedcodeCalendar.init('filterResourcesWithEvents', enable);
		cbEnable.style.display = enable ? 'none' : 'block';
		cbDisable.style.display = enable ? 'block' : 'none';
		if (enable) {
			seedcodeCalendar.init('resourceRefresh', 'clear');
			for (var i = 0; i < resourceFilters.length; i++) {
				resourceFilters[i].status.selected = false;
			}
		}
		dbk.resetResources();
		if (localStorage) {
			localStorage.setItem('filterResourcesWithEvents', enable);
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
