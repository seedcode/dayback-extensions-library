// Open Harvest App v1.1

// Purpose:
// The following button action will launch a time
// tracking modal using the Harvest app. You will
// need to modify the code to reflect the URL
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

	// Configure the Harvest App url. The app action
	// will attach the Event ID and Event Title as the
	// external_item_id and external_item_name paramameter automatically

	inputs.harvestURL =
		'https://platform.harvestapp.com/platform/timer?app_name=DayBack&closable=false&permalink=https%3A%2F%2Fdayback.com%2Fitem%2F1';

	//----------- End Configuration -------------------
} catch (error) {
	reportError(error);
}

// ----------- The action itself: you likely don't need to change this code ------------

// Action code goes inside this function
function run() {
	// Create modal dialog html to render our widget
	var modalHTML =
		'<div class="modal fade" id="harvestModal-' +
		event.eventID +
		'" tabindex="-1" role="dialog">' +
		'<div class="modal-dialog" role="document" style="width: 402px;">' +
		'<div class="modal-content">' +
		'<div class="modal-header">' +
		'<button type="button" id="closeModal-' +
		event.eventID +
		'" class="close"><span aria-hidden="true">&times;</span></button>' +
		'</div>' +
		'<div class="modal-body" style="text-align: center; padding: 0">' +
		'<iframe src="' +
		inputs.harvestURL +
		'&external_item_id=' +
		event.eventID +
		'&external_item_name=' +
		encodeURIComponent(event.titleEdit) +
		'" style="height: 400px; width: 400px; border: none; outline: none;">' +
		'</iframe>' +
		'</div>' +
		'<div class="modal-footer" style="text-align: center;">' +
		'<button type="button" id="closeModal-' +
		event.eventID +
		'-Btn" class="btn btn-default">Close</button>' +
		'</div>' +
		'</div>' +
		'</div>' +
		'</div>';

	// Append modal dialog html to body element if it doesn't exist
	if (!$('#harvestModal-' + event.eventID).length) {
		$('body').append(modalHTML);
	}

	// Assign our modal element to a variale for easy referencing
	var harvestModal = $('#harvestModal-' + event.eventID);

	// Create modal dialog
	harvestModal.modal();

	// Attach event listener to our modal so we can run a function when it closes
	//
	// ** Currently not used **
	//
	//  harvestModal.on('hidden.bs.modal', function (e) {
	//     ... run a routine after modal closes ...
	//  });

	// Attach event listener to close model when clicking the close button
	$(
		'#closeModal-' +
			event.eventID +
			', #closeModal-' +
			event.eventID +
			'-Btn'
	).on('click', function (e) {
		e.stopPropagation();
		closeModal();
	});

	//Function to close the modal
	function closeModal() {
		harvestModal.modal('hide');
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
