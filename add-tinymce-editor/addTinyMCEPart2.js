// Add TinyMCE Text Editor - Part 2 - v1.0
//
// Purpose:
// Allows you to modify an event property in a rich text editor
//
// Note:
// Requires the 'addTineMCEPart1.js' app action to load the editor
//
// Action Type: Button action
//
// More info on custom button actions here:
// https://docs.dayback.com/article/5-custom-actions

// Declare globals

var options = {};
var inputs = {};

try {
	//----------- Configuration -------------------

	// Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)
	// Leave this set to 0 to avoid unexpected behavior

	options.runTimeout = 0;

	//C hange this to the NAME OF the event field you'd like to edit with the rich text editor
	inputs.fieldToEdit = 'description';

	// The title of the modal window
	inputs.modalTitle = 'Modify Event Description';

	// The confirmation button text
	inputs.modalConfirmText = 'Save';

	// The cancel button text
	inputs.modalCancelText = 'Cancel';

	//----------- End Configuration -------------------
} catch (error) {
	reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function

function run() {
	//----------- You shouldn’t need to edit below this line -------------------

	//Show a modal to edit the description value
	showInputModal(
		inputs.modalTitle,
		editEvent[inputs.fieldToEdit],
		null,
		inputs.modalConfirmText,
		function (result) {
			editEvent[inputs.fieldToEdit] = result;
		},
		inputs.modalCancelText
	);

	function showInputModal(
		title,
		inputValue,
		inputPlaceholder,
		confirmButtonText,
		confirmFunction,
		cancelButtonText,
		cancelFunction,
		warning,
		modalContainer
	) {
		var confirmButtonStyle = warning
			? 'btn-danger dbk_button_danger'
			: 'btn-success dbk_button_success';
		var cancelButton = cancelButtonText
			? '<button ng-click="popover.config.cancelFunction();" class="btn btn-xs btn-secondary">' +
			  cancelButtonText +
			  '</button>'
			: '';
		var confirmButton = confirmButtonText
			? '<button ng-click="popover.config.confirmFunction();" class="btn btn-xs  ' +
			  confirmButtonStyle +
			  '">' +
			  confirmButtonText +
			  '</button>'
			: '';

		var template =
			'<div style="background: rgba(0,0,0,0.75); color: white;"><div class="pad-large text-center">' +
			'<h4>' +
			title +
			'</h4>' +
			'<div class="pad">' +
			'<textarea class="form-control" id="inputModalInput" rows="8" placeholder="' +
			inputPlaceholder +
			'">' +
			inputValue +
			'</textarea>' +
			'</div>' +
			'<div class="pad">' +
			cancelButton +
			' ' +
			confirmButton +
			'</div>' +
			'</div>' +
			'</div>';

		var config = {
			container: modalContainer
				? modalContainer
				: document.querySelector('#calendar-container')
				? '#calendar-container'
				: '#app-container',
			type: 'modal', // modal or popover
			destroy: true,
			width: 600,
			height: 600,
			confirmFunction: runConfirmFunction,
			cancelFunction: runCancelFunction,
			onShow: injectTinyMCE,
			onShown: '',
			onHide: removeTinyMCE,
			onHidden: removeTinyMCE,
			show: true,
		};

		var popover = utilities.popover(config, template);
		setTimeout(injectTinyMCE, 5);

		function runConfirmFunction() {
			if (confirmFunction) {
				confirmFunction(
					tinyMCE && tinyMCE.activeEditor
						? tinyMCE.activeEditor.getContent({format: 'raw'})
						: document.getElementById('inputModalInput').value
				);
			}
			config.show = false;
		}

		function runCancelFunction() {
			if (cancelFunction) {
				cancelFunction();
			}
			config.show = false;
		}

		function injectTinyMCE() {
			if (typeof tinyMCE !== 'undefined' && tinyMCE) {
				tinyMCE.init({
					selector: '#inputModalInput',
					menubar: false,
				});
			} else {
				utilities.showModal(
					'Error loading tinyMCE',
					'tinyMCE is required to use this custom action. Please add the "injectTinyMCE" app action to your group',
					'ok'
				);
			}
		}

		function removeTinyMCE() {
			tinyMCE.remove('#inputModalInput');
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
