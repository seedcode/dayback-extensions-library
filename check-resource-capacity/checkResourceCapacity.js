// Check Resource Capacity v1.0

// Purpose:
// This function enforces daily limits on a resource established in the below config object
// e.g. The resource 'Jason Young' cannot have more than 8 events scheduled per day

// Action Type: Before Event save
// Prevent Default Action: Yes

// More info on Before Event Save actions and objects here:
// https://docs.dayback.com/article/20-event-actions

// Declare globals

var options = {};
var inputs = {};

try {
	//----------- Configuration -------------------

	// Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)

	options.runTimeout = 0;

	// Specify the limits for each resource

	inputs.config = {
		'Jason Young': 8,
		'Tanner Ellen': 8,
		'John Sindelar': 12,
	};

	//----------- End Configuration -------------------
} catch (error) {
	reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
	// Grab the capacity configuration
	var config = inputs.config;

	// gather values from event we're trying to save
	var resource = editEvent.resource[0];
	var start = editEvent.start.format('YYYY-MM-DD');
	var stop = editEvent.end.format('YYYY-MM-DD');

	// retrieve the limit from the config object
	var limit = config[resource];

	// etrieve values from context for SOQL query
	// specify the object name we're testing for capacity

	var objectName = event.schedule.objectName;
	var objectNameForDialog = objectName.replace('__c', '');

	// retrieve Salesforce field names from our field mapping
	var fieldMap = event.schedule.fieldMap;
	var resourceField = fieldMap.resource;
	var startField = fieldMap.start;
	var endField = fieldMap.end;

	// new moment objects for start and stop
	var mStart = moment(moment(start).format('YYYY-MM-DD'));
	var mStop = moment(moment(stop).format('YYYY-MM-DD'));

	// retrieve our canvas client object for authentication
	var client = fbk.client();

	// retrieve our canvas context object for REST links/urls
	var context = fbk.context();

	// retrieve the query URL from context
	var url = context.links.queryUrl;

	// create SOQL statement
	var soql =
		'SELECT+ID,' +
		startField +
		',' +
		endField +
		'+FROM+' +
		objectName +
		'+WHERE+' +
		startField +
		'+<=+' +
		stop +
		'+AND+' +
		endField +
		'>=+' +
		start +
		'+AND+' +
		resourceField +
		"+=+'" +
		resource +
		"'";
	// make sure this event isn't included in the query
	if (editEvent.eventID) {
		soql += "+AND+Id<>'" + editEvent.eventID + "'";
	}

	// final URL for GET
	var finalUrl = url + '?q=' + soql;

	// build settings object for Ajax call to Salesforce
	var settings = {};
	settings.client = client;
	settings.contentType = 'application/json';
	settings.success = callback;

	// Use canvas function to query
	Sfdc.canvas.client.ajax(finalUrl, settings);

	function callback(data) {
		// existing spots retrieved for this resource
		if (data.status !== 200) {
			alert('Error looking up Events For This Resource');
			return;
		}
		var records = data.payload.records;
		// new moment object to represent each day in the range.
		var starting = mStart.clone();
		var dif = mStop.diff(starting);
		var errorMessage = [];
		var resultData = {};
		while (dif >= 0) {
			resultData[starting.format('YYYY-MM-DD')] = 0;
			for (var i = 0; i < records.length; i++) {
				// loop through all records to see which ones spen this day.
				var thisRecordStart = moment(records[i][startField]);
				var thisRecordEnd = moment(records[i][endField]);
				// if this record occurs on this day, add to today bucket
				if (
					starting.isBetween(thisRecordStart, thisRecordEnd) ||
					starting.isSame(thisRecordStart) ||
					starting.isSame(thisRecordEnd)
				) {
					resultData[starting.format('YYYY-MM-DD')]++;
				}
			}
			// if we're over capacity for this bucket, then create an error message of dates
			if (resultData[starting.format('YYYY-MM-DD')] + 1 > limit) {
				errorMessage.push(starting.format('YYYY-MM-DD'));
			}
			// incrament our while loop
			starting.add(1, 'days');
			dif = mStop.diff(starting);
		}
		if (errorMessage.length > 0) {
			// we're over the limit somewhere. Throw error and kill transaction
			utilities.showModal(
				'Resource Over Limit',
				'This ' +
					objectNameForDialog +
					' puts this resource over capacity on the following dates:\n' +
					errorMessage.join(', '),
				'OK',
				function () {
					action.callbacks.cancel();
				}
			);
		} else {
			// not over the limit anywhere.
			action.callbacks.confirm();
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
