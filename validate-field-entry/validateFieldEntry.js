// Validate Field Entry v1.2

// Purpose:
// Verifies that specified additional fields have a value entered
// Prevents saving the event if the specified additional field's value is empty

// Action Type: Before Event Save
// Prevent Default Action: Yes

// More info on Before Event Save actions and objects here:
// https://www.seedcode.com/pmwiki/index.php?n=DayBackOnline.CustomActionObjects#BeforeSave

// Declare globals

var options = {};
var inputs = {};

try {
	//----------- Configuration -------------------

	// Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)

	options.runTimeout = 0;

	// Adds the names of the fields to the list to be validated
	// Replace 'MyField' with your mapped field name
	// You can add other fieldfs by separating them with a comma
	//
	// Note that that this action only validates to ensure that
	// these fields are not empty before we can save an
	// event. If you needt o add more advanced rules you will
	// need to define those rules in the run function below

	inputs.listOfFieldsToValidate = ['MyField1', 'MyField2'];

	//----------- End Configuration -------------------
} catch (error) {
	reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
	var emptyFields = '';
	var emptyField;

	// Check each field to validate for an empty value
	inputs.listOfFieldsToValidate.forEach(function (currentField) {
		emptyField = validateField(editEvent, currentField);
		if (emptyField !== false) {
			emptyFields += emptyFields === '' ? emptyField : ', ' + emptyField;
		}
	});

	// Save the event if all the fields have values in them
	if (emptyFields === '') {
		// returning true so our action does not prevent the default behavior (save)
		return action.callbacks.confirm();
	}

	// Show alert and prompt to save or revert
	// More info on the showModal function here:
	// https://www.seedcode.com/pmwiki/index.php?n=DayBackOnline.CustomActionObjects#utilities.showModal
	utilities.showModal(
		'Additional field value is empty',
		'The following fields have empty values: ' +
			emptyFields +
			'.  Would you like to continue saving the event?',
		'Cancel',
		function () {
			// More info on the action object here:
			// https://www.seedcode.com/pmwiki/index.php?n=DayBackOnline.CustomActionObjects#action
			action.callbacks.cancel();
		},
		'Save',
		function () {
			// More info on the action object here:
			// https://www.seedcode.com/pmwiki/index.php?n=DayBackOnline.CustomActionObjects#action
			action.callbacks.confirm();
		}
	);

	// Function to validate an event field. Returns the field label if the value is empty
	function validateField(editEvent, fieldName) {
		var fieldID = getFieldIDByMappedName(editEvent, fieldName);
		if (fieldID) {
			var fieldValue = editEvent[fieldID];
			if (
				!fieldValue ||
				fieldValue === '' ||
				(Array.isArray(fieldValue) && fieldValue.length === 0)
			) {
				return getFieldDisplayName(editEvent, fieldID);
			}
		}
		return false;
	}

	// Returns the ID of the field from its mapped field name
	function getFieldIDByMappedName(event, fieldName) {
		// More info on the event.schedule object here:
		// https://www.seedcode.com/pmwiki/index.php?n=DayBackOnline.CustomActionObjects#event.schedule
		if (event.schedule.fieldMap) {
			for (var field in event.schedule.fieldMap) {
				if (event.schedule.fieldMap[field] === fieldName) {
					return field;
				}
			}
			return null;
		} else {
			return null;
		}
	}

	// Returns the display name of the specified field
	function getFieldDisplayName(event, fieldID) {
		var displayName = fieldID;

		// More info on the event.schedule object here:
		// https://www.seedcode.com/pmwiki/index.php?n=DayBackOnline.CustomActionObjects#event.schedule
		if (
			event.schedule.customFields &&
			event.schedule.customFields[fieldID]
		) {
			displayName = event.schedule.customFields[fieldID].name;
		} else if (
			event.schedule.labelMap &&
			event.schedule.labelMap[fieldID]
		) {
			displayName = event.schedule.labelMap[fieldID];
		}

		return displayName;
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
