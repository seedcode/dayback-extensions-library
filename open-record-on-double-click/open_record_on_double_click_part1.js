// Open Record On Double Click v1.0 - Part 1
//
// Purpose:
// Double clicking an event will open up the native
// Salesforce or Filemaker record. Single clicking
// will open the native DayBack popover
//
// Action Type: After Events Rendered
// Prevent Default Action: No
//
// More info on custom actions here:
// https://docs.dayback.com/article/140-custom-app-actions

// Declare globals

var options = {};
var inputs = {};

try {
	//----------- Configuration -------------------

	// Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)
	// Leave this set to 0 to avoid unexpected behavior

	options.runTimeout = 0;

	// Double Click Action:
	// --------------------

	// The code below will run when an event is double-clicked.
	// If you want Double Click to run on certain calendars, you
	// you can first check the contents of the variable 'calendarName'
	// to determine if a record should open.// Open Record On Double Click v1.0 - Part 1
	//
	// Purpose:
	// Double clicking an event will open up the native
	// Salesforce or Filemaker record. Single clicking
	// will open the native DayBack popover
	//
	// Action Type: After Events Rendered
	// Prevent Default Action: No
	//
	// More info on custom actions here:
	// https://docs.dayback.com/article/140-custom-app-actions

	// Declare globals

	var options = {};
	var inputs = {};

	try {
		//----------- Configuration -------------------

		// Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)
		// Leave this set to 0 to avoid unexpected behavior

		options.runTimeout = 0;

		// Double Click Action:
		// --------------------

		// The code below will run when an event is double-clicked.
		// If you want Double Click to run on certain calendars, you
		// you can first check the contents of the variable 'calendarName'
		// to determine if a record should open.

		options.runOnDoubleClick = (calendarName, eventID) => {
			// Opens up the native Salesforce record for the event
			fbk.publish('dbk.navigate', {url: '/' + eventID, new: true});
		};

		//----------- End Configuration -------------------
	} catch (error) {
		reportError(error);
	}

	//----------- The action itself: you may not need to edit this. -------------------

	// Action code goes inside this function
	function run() {
		// Get all events

		var clientEvents = seedcodeCalendar
			.get('element')
			.fullCalendar('clientEvents');

		// Loop through events

		clientEvents.forEach((event) => {
			// Get all on-screen elements that represent the event
			let divs = document.querySelectorAll(
				'[data-id="' + event._id + '"]'
			);

			// Loop through each event and add a double click handler
			// that runs your own double click function, then closes
			// the popover in the background

			divs.forEach((d) => {
				if (d.dataset.hasOwnProperty('dblclickhandler')) {
					return;
				}

				d.dataset.dblclickhandler = 1;

				d.addEventListener('dblclick', (e) => {
					seedcodeCalendar.init('dblclickrunning', true);

					setTimeout(() => {
						seedcodeCalendar.init('dblclickrunning', false);
					}, 500);

					options.runOnDoubleClick(
						event.schedule.name,
						event.eventID
					);

					$timeout(function () {
						$rootScope.$broadcast('closePopovers');
					}, 250);
				});
			});
		});
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

	options.runOnDoubleClick = (calendarName, recordId) => {
		// Opens up the native Salesforce record for the event
		fbk.publish('dbk.navigate', {url: '/' + recordId, new: true});
	};

	//----------- End Configuration -------------------
} catch (error) {
	reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
	// Get all events

	var clientEvents = seedcodeCalendar
		.get('element')
		.fullCalendar('clientEvents');

	// Loop through events

	clientEvents.forEach((event) => {
		// Get all on-screen elements that represent the event
		let divs = document.querySelectorAll('[data-id="' + event._id + '"]');

		// Loop through each event and add a double click handler
		// that runs your own double click function, then closes
		// the popover in the background

		divs.forEach((d) => {
			if (d.dataset.hasOwnProperty('dblclickhandler')) {
				return;
			}

			d.dataset.dblclickhandler = 1;

			d.addEventListener('dblclick', (e) => {
				seedcodeCalendar.init('dblclickrunning', true);

				setTimeout(() => {
					seedcodeCalendar.init('dblclickrunning', false);
				}, 500);

				options.runOnDoubleClick(event.schedule.name, event.eventID);

				$timeout(function () {
					$rootScope.$broadcast('closePopovers');
				}, 250);
			});
		});
	});
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
