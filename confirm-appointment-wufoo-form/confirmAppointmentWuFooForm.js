// Confirm Appointment WuForm v1.1

// Purpose:
// Shows a simple wufoo form that lets a share recipient click on an event and respond
// This shows how to pass event data to a wufoo form via URL Modifications
// Documented here: https://help.wufoo.com/articles/en_US/kb/URL-Modifications
//
// Action Type: On Event Click
// Prevent Default Action: Yes

// More info on Event Actions here:
// https://docs.dayback.com/article/20-event-actions

// Declare globals

var options = {};
var inputs = {};

try {
	//----------- Configuration -------------------

	// Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)

	options.runTimeout = 0;

	// Grab the event date and time: you don't need to edit these lines

	inputs.eventDate = moment('[[start]]').format('L');
	inputs.eventTime = moment('[[start]]').format('LTS Z');

	// -480 is the offset, in minutes for PST from UTC time.
	// you may want to change this if you are converting to another time
	// Note that the offset varies with daylights savings
	// so we should use moment-timezone.js instead and specify the
	// destination zone by name.

	inputs.eventInPST = moment.utc('[[start]]').utcOffset(-480).format('LTS');

	// URL for the logo to show at the top of the form
	// Be sure to use https

	inputs.formLogo =
		'http://dayback.com/wp-content/uploads/2015/12/gantthalo.png';

	// wufoo form url, including the API key and prefix for URL Modifications
	// Documented here: https://help.wufoo.com/articles/en_US/kb/URL-Modifications

	inputs.formURL = 'https://seedcode.wufoo.com/forms/qceg19q0ijbh1t/def/';

	// Prefill the following fields.
	// Field ids/numbers can be found in the form's API reference
	// Documented here: https://help.wufoo.com/articles/en_US/kb/URL-Modifications

	inputs.formFieldsToFill =
		'field10=' +
		inputs.eventDate +
		'&field11=' +
		inputs.eventTime +
		'&field13=' +
		inputs.eventInPST;

	// NOTE - a number of attributes of the form, such as the name of the submit button
	// and the form CSS are managed in wufoo.

	//----------- End Configuration -------------------
} catch (error) {
	reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
	// Create modal dialog html to render our form
	var modalHTML =
		'<div class="modal fade" id="wufooModal-[[eventID]]" tabindex="-1" role="dialog">' +
		'<div class="modal-dialog" role="document" style="width: 402px;">' +
		'<div class="modal-content">' +
		'<div class="modal-header">' +
		'<button type="button" id="closeModal-[[eventID]]" class="close"><span aria-hidden="true">&times;</span></button>' +
		'<img src="' +
		inputs.formLogo +
		'" style="display: block; margin-left: auto; margin-right: auto; height: 60px;">' +
		'</div>' +
		'<div class="modal-body" style="text-align: center; padding: 0">' +
		'<iframe src="' +
		inputs.formURL +
		inputs.formFieldsToFill +
		'" style="height: 400px; width: 400px; border: none; outline: none;">' +
		'</iframe>' +
		'</div>' +
		'<div class="modal-footer" style="text-align: center;">' +
		'<button type="button" id="closeModal-[[eventID]]-Btn" class="btn btn-default">Close</button>' +
		'</div>' +
		'</div>' +
		'</div>' +
		'</div>';

	//Append modal dialog html to body element if it doesn't exist
	if (!$('#wufooModal-[[eventID]]').length) {
		$('body').append(modalHTML);
	}

	//Assign our modal element to a variale for easy referencing
	var wufooModal = $('#wufooModal-[[eventID]]');

	//Create modal dialog
	wufooModal.modal();

	//Attach event listener to our modal so we can run a function when it closes *Currently not used*
	//wufooModal.on('hidden.bs.modal', function (e) {
	//Run a routine after modal closes
	//});

	//Attach event listener to close model when clicking the close button
	$('#closeModal-[[eventID]], #closeModal-[[eventID]]-Btn').on(
		'click',
		function (e) {
			e.stopPropagation();
			closeModal();
		}
	);

	//Function to close the modal
	function closeModal() {
		wufooModal.modal('hide');
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
