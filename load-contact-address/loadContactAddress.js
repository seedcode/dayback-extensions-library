// Load Contact Address v1.0

// Purpose:
// Looks up the Contact's address when the Event is related to a contact
// and fills in the Event address with the value if an address is found
// This action, as is, just works in Salesforce.

// Action Type: On Field Change
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

	// Please edit the run function if you need to modify your SOQL query

	//----------- End Configuration -------------------
} catch (error) {
	reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
	// params is passed in when the Contact is selected
	// Since this could be a Lead, we need to make sure it's a Contact

	if (
		params &&
		params.data &&
		params.data.field === 'contact' &&
		params.data.objectName === 'Contact'
	) {
		// Perform SOQL query for the specified Contact's Mailing Address
		// retrieve our canvas client object for authentication
		var client = fbk.client();

		// retrieve our canvas context object for REST links/urls
		var context = fbk.context();

		// retrieve the query URL from context
		var url = context.links.queryUrl;

		// SOQL Select Statement Fields;
		var select = 'SELECT+MailingAddress+FROM+Contact';

		// SOQL Where Clause
		var where = "WHERE+Id+=+'" + params.data.value + "'";

		// SOQL query
		var query = select + '+' + where;

		// final URL for GET
		var finalUrl = url + '?q=' + query;

		// build settings object for Ajax call to Salesforce
		var settings = {};
		settings.client = client;
		settings.contentType = 'application/json';
		settings.success = processResult;

		// Use canvas function to query
		Sfdc.canvas.client.ajax(finalUrl, settings);
	} else {
		// Action fired, but not a Contact selection, continue event.
		action.callbacks.confirm();
	}

	// Callback for ajax call

	function processResult(data) {
		// update location field and map based on result
		var result = '';
		if (data.status === 200 && data.payload && data.payload.totalSize > 0) {
			var address = data.payload.records[0].MailingAddress;
			if (address) {
				result = address.street ? address.street : '';
				result += address.city ? ' ' + address.city : '';
				result += address.state ? ' ,' + address.state : '';
			}
		}

		// update popover
		editEvent.location = result;
		$scope.updateMap(result);

		// continue field selection now that async operation is completed.
		action.callbacks.confirm();
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
