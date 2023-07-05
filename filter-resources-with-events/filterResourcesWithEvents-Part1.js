// Filter Resources with Events Action v1.3 - Part 1

// Purpose:
// Filters the calendar for only resources with events in the date range
// Only enabled in resource views

// Action Type: After Events Rendered
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
	var calendarConfig = seedcodeCalendar.get('config');
	var calendarView = seedcodeCalendar.get('view');
	var clientEvents = seedcodeCalendar
		.get('element')
		.fullCalendar('clientEvents');
	var resourceFilters = seedcodeCalendar.get('resources');
	var resourceList = [];
	var resourceRefresh = seedcodeCalendar.get('resourceRefresh');

	//Verify this feature should be shown or not first
	checkFilterResourcesButton();

	//If feature is toggled on, update resource filters
	if (seedcodeCalendar.get('filterResourcesWithEvents') && isResourceView()) {
		if (
			!resourceRefresh &&
			(params.data.fromViewStateChange || params.data.fromScheduleChange)
		) {
			seedcodeCalendar.init('resourceRefresh', 'clear');
			for (var i = 0; i < resourceFilters.length; i++) {
				resourceFilters[i].status.selected = false;
			}
			dbk.resetResources();
		} else if (resourceRefresh === 'clear') {
			seedcodeCalendar.init('resourceRefresh', true);
			if (clientEvents) {
				for (var e = 0; e < clientEvents.length; e++) {
					if (
						//Only consider events that are visible
						calendarConfig.eventShown(
							clientEvents[e],
							true,
							false
						) &&
						//Only consider events that are within the current calendar view range
						clientEvents[e].end >= calendarView.start &&
						clientEvents[e].start <= calendarView.end
					) {
						var eventResources = clientEvents[e].resource;
						for (var r = 0; r < eventResources.length; r++) {
							if (!resourceList.includes(eventResources[r])) {
								resourceList.push(eventResources[r]);
							}
						}
					}
				}

				for (var i = 0; i < resourceFilters.length; i++) {
					resourceFilters[i].status.selected = resourceList.includes(
						resourceFilters[i].name
					);
				}

				dbk.resetResources();
			}
		} else {
			seedcodeCalendar.init('resourceRefresh', false);
		}
	}

	//Function to check whether or not the button for this feature should be enabled
	function checkFilterResourcesButton() {
		var cbContainer = document.getElementById(
			'filter-resources-with-events-container'
		);

		if (cbContainer && isResourceView()) {
			cbContainer.style.display = 'block';
		} else if (cbContainer) {
			cbContainer.style.display = 'none';
		}
	}

	function isResourceView() {
		return (
			calendarView &&
			(calendarView.name.includes('Resource') ||
				(calendarView.name.includes('Horizon') &&
					seedcodeCalendar.get('config').horizonBreakoutField ===
						'resource'))
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
