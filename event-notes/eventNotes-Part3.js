// Event Notes - Part 3 v1.00
//
// Purpose:
// Adds event notes feature to events in large pill view.
// This component prevents event pills from being clicked if
// an event notes action initated a click over the event
// pill. Additionally, it paints a chat icon next to the
// Custom Fields label to inform the user that there is an
// note available inside the Custom Fields. This may
// be necessary if display rules prevent notes icons from
// displaying in event pills.
//
// Note: This app action must be added to every calendar.
// for which you intend to create notes.
//
// Action Type: On Event Click
// Prevent Default Action: Yes
// For events that are: Editable, Read Only
//
// More info on custom actions here:
// https://docs.dayback.com/article/140-custom-app-actions

// Declare globals

var options = {};
var inputs = {};

try {
	//----------- Configuration -------------------

	// Seconds to wait to allow this action to run before reporting an error

	options.runTimeout = 8;

	// Define the Field Name of the Custom Field that contains notes for each calendar
	//
	// If you have multiple sources and all share the same field name, simply
	// declare this as a string variable:
	//
	//      inputs.notesFieldName = 'notes';
	//
	// If you have multiple sources, with a different field names for each
	// source, declare an object containing the calendar name, and the field
	// name that it applicable to that calendar:
	//
	//      inputs.notesFieldName = {
	//           'Marketing': 'notesFieldName1',
	//           'Sales': 'notesFieldName1',
	//      }

	inputs.notesFieldName = {
		'SeedCode Shared': 'notes',
	};

	//----------- End Configuration -------------------
} catch (error) {
	reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
	let editNotes = document.querySelector(
		'.tooltip.tooltip-custom .editNotes'
	);
	let disableEventClick = seedcodeCalendar.get('disableEventClick');

	if (editNotes || disableEventClick == true) {
		cancelCallback();
	} else {
		confirmCallback();
		repaintEventPopover();
	}

	function repaintEventPopover() {
		let notesText = getNotesText(event);
		var retries = 40;

		if (notesText != '') {
			checkPopoup();
		}

		function checkPopoup() {
			let customFields = document.querySelector(
				'.edit-container [content="Custom Fields"]>span[ng-bind="content"]'
			);
			if (customFields) {
				customFields.innerHTML =
					'<i class="fa fa-comment notesChatIconIcon"></i> ' +
					customFields.innerHTML;
				retries = 0;
			} else if (retries > 0) {
				retries--;
				setTimeout(checkPopoup, 50);
			}
		}
	}

	// ----- Helper Function -----

	// Get notes text from the correct custom field name for the given schedule

	function getNotesFieldId(event) {
		let fieldName;

		if (typeof inputs.notesFieldName !== 'object') {
			fieldName = inputs.notesFieldName;
		} else if (
			typeof inputs.notesFieldName === 'object' &&
			inputs.notesFieldName.hasOwnProperty(event.schedule.name)
		) {
			fieldName = inputs.notesFieldName[event.schedule.name];
		} else {
			return;
		}

		return dbk.getCustomFieldIdByName(fieldName, event.schedule);
	}

	function getNotesText(event) {
		let fieldId = getNotesFieldId(event);
		return event.hasOwnProperty(fieldId) ? event[fieldId] : '';
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
