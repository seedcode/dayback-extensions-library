// DayBack Cascading Events v1
// License: MIT

// Purpose:
// Looks for future events related by the defined criteria on lines 21-128 and
// adjusts them according to the change in the current event

// Action Type: On Event Save Action
// Open in new window: No
// Prevent Default Action: Yes

// More info on custom actions here:
// https://docs.dayback.com/article/5-custom-actions

// Declare globals

var options = {};
var inputs = {};

try {
	//----------- Configuration -------------------

	// Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)

	options.runTimeout = 0;

	// Define the options for the cascading behavior
	//
	// Please see blog post for more information about how to set up cascading events
	// https://dayback.com/cascading-events/

	inputs.cascadeOptions = {
		// If using this event action with multiselect,
		// enable these two lines to specify mutlSelected events
		// as the linked events

		selectedEvents: seedcodeCalendar.get('multiSelect'),

		// ---------------------------------------------------------------
		// Define the criteria for what defines a "linked" event
		// These criteria stack, so each filter must return true for
		// an event to be considered linked
		// ---------------------------------------------------------------

		// Should all events in the same calendar source be considered linked
		calendarSource: true,

		// Should linked events be limited to the same type (Basecamp Specific: Scheduled/Todo)
		sameTypeOnly: false,

		// Property Filters
		// ----------------
		//
		// Here you can define what makes a linked event based on a property of the event
		// This can be based on any valid properties of the event object
		// For each property you can define two options (resource being the exception with 3).
		//
		// 1. anyMatch - This should be set to true if you only want to consider all events
		//    with matching values in this property as "linked" and don't want to specify groups
		//
		// 2. matchingGroups - An array that contains one or more property values
		//    Use this to specify values for that property that should be considered linked
		//    Keep in mind that some properties are strings and others are arrays
		//    Details on event properties here:
		//    https://docs.dayback.com/article/124-action-objects-methods#editEvent
		//
		// 3. cascadeChangedResource (resource only) - Set to true to cascade even if resource was changed
		//    This will cascade events for the new resource when an event is dragged between resource columns
		//
		// The customFields object is a JSON object where the field name is the key
		// and the value is an array just like the matchingGroups array in the other fields
		// Each entry in this array is a separate match condition for that field
		// For picklists fields where multiselect is allowed, enter each match as an array of strings
		// as in the 'My picklist custom Field' example below
		//
		// Below are some filter examples:
		//
		//   propertyFilters: {
		//      resource: {
		//          anyMatch: false,
		//          matchingGroups: [
		//              ['KC Embrey'],
		//              ['KC Embrey', 'John Sindelar'],
		//              ['KC Embrey', 'Tanner Ellen']
		//          ],
		//          cascadeChangedResource: true
		//      },
		//      description: {
		//          anyMatch: true,
		//          matchingGroups: null
		//      },
		//      titleEdit: {
		//          anyMatch: false,
		//          matchingGroups: [
		//              'Service Call',
		//              'Consultation'
		//          ]
		//      },
		//      done: {
		//          anyMatch: false,
		//          matchingGroups: [
		//              'true'
		//          ]
		//      }
		//      customFields: {
		//          'My custom Field Label': [
		//              'Green',
		//              'Blue',
		//              'Yellow'
		//          ],
		//          'Another custom Field': [
		//              'Loud',
		//              'Soft',
		//              'Medium'
		//          ],
		//          'My picklist custom Field': [
		//              ['Salespeople'],
		//              ['Service Techs'],
		//              ['Administrators','Salespeople']
		//          ]
		//      }
		//  };

		propertyFilters: {
			resource: null,
			status: null,
			contactID: null,
			contactName: null,
			projectID: null,
			projectName: {
				anyMatch: true,
				matchingGroups: null,
			},
			location: null,
			tags: null,
			allDay: null,
			titleEdit: null,
			description: null,
			done: null,
			customFields: null,
		},
	};

	//----------- End Configuration -------------------
} catch (error) {
	reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
	//----------- You shouldn’t need to edit below this line -------------------

	// Grab the cascading options configuration
	var cascadeOptions = inputs.cascadeOptions;

	// Exit here if there are selected events as that is handled by DayBack core now
	if (cascadeOptions.selectedEvents) {
		return true;
	}

	var updatingModalDiv;
	var updatingTimeout;
	var curDelta;
	var diffDays = 0;
	var isUndo = false;
	var updatingModalStyle = {
		height: 'auto',
		width: '400px',
	};
	var updatingModalContentStyle = {
		background: 'rgba(0,0,0,0.75)',
		color: 'white',
	};
	var revertMessage =
		'<span class="message-icon-separator success">' +
		'<i class="fa fa-lg fa-check"></i>' +
		'</span>' +
		'<span translate>Linked Events Updated</span>' +
		'<span class="message-separator"> | </span>' +
		'<span translate>Undo</span>' +
		'<span class="message-icon-separator" style="opacity: 0.8;"><i class="fa fa-lg fa-undo"></i></span>';

	var linkedEventCount;
	var linkedEvents = {};
	var updatedEventCount = 0;
	var allDayChanged =
		changesObject.hasOwnProperty('allDay') &&
		changesObject.allDay !== revertObject.allDay;
	var config = seedcodeCalendar.get('config');
	var helpers = seedcodeCalendar.get('actionHelpers');
	config.suppressEditEventMessages = true;

	// Calculate the delta to apply to events
	if (
		cascadeOptions.propertyFilters.resource &&
		cascadeOptions.propertyFilters.resource.cascadeChangedResource &&
		changesObject.resource
	) {
		curDelta = changesObject.end
			? changesObject.end.clone().diff(changesObject.start.clone())
			: null;
	} else {
		if (!allDayChanged && changesObject.end) {
			diffDays = changesObject.end
				.clone()
				.startOf('day')
				.diff(revertObject.end.clone().startOf('day'), 'days');
			curDelta = event.allDay
				? changesObject.end
						.clone()
						.startOf('day')
						.diff(revertObject.end.clone().startOf('day'))
				: changesObject.end.clone().diff(revertObject.end.clone());
		} else if (changesObject.start) {
			diffDays = changesObject.start
				.clone()
				.startOf('day')
				.diff(revertObject.start.clone().startOf('day'), 'days');
			curDelta =
				allDayChanged || event.allDay
					? changesObject.start
							.clone()
							.startOf('day')
							.diff(revertObject.start.clone().startOf('day'))
					: changesObject.start
							.clone()
							.diff(revertObject.start.clone());
		}
	}

	// Continue to normal save if there is no date/time change, this is a new event, event changed schedules, or this is an undo save
	if (
		(!curDelta && !allDayChanged) ||
		!event.eventID ||
		changesObject.hasOwnProperty('eventSource') ||
		options.isUndo
	) {
		config.suppressEditEventMessages = false;
		action.callbacks.confirm();
	} else {
		CheckForLinkedEvents();
	}

	// Checks an individual source for upcoming events
	// that match the requested notification interval
	function CheckForLinkedEvents() {
		var calendarView = seedcodeCalendar.get('view');

		// Get all events on calendar
		var clientEvents = seedcodeCalendar
			.get('element')
			.fullCalendar('clientEvents')
			.sort(function (a, b) {
				return a.start > b.start ? 1 : -1;
			});

		var filtersSet = false;
		for (var key in cascadeOptions.propertyFilters) {
			if (cascadeOptions.propertyFilters[key]) {
				filtersSet = true;
				break;
			}
		}

		if (clientEvents) {
			for (var i = 0; i < clientEvents.length; i++) {
				// Always add the user modified event to events to update
				if (
					clientEvents[i].eventID === event.eventID ||
					(clientEvents[i].eventID !== event.eventID &&
						// Only continue if there is at least one positive filter option
						(cascadeOptions.calendarSource ||
							cascadeOptions.sameTypeOnly ||
							filtersSet) &&
						// Only consider events that are visible
						config.eventShown(clientEvents[i], true, false) &&
						// Only consider events that are within the current calendar view range
						clientEvents[i].start >= calendarView.start &&
						clientEvents[i].end <= calendarView.end &&
						// Only consider events that are starting at the same time or after the changed event
						clientEvents[i].start >= revertObject.start &&
						// Only consider events that meet the user defined criteria
						verifyFilterMatch(event, clientEvents[i]) &&
						// Only consider all day events if the original event has changed at least one day
						(!clientEvents[i].allDay || diffDays !== 0))
				) {
					// Event should be considered linked and added to those to be updated
					linkedEvents[clientEvents[i].eventID] = createCascadeObject(
						clientEvents[i]
					);
				}
			}

			promptForLinkedEvents('Would you like to update linked events?');
		} else {
			config.suppressEditEventMessages = false;
			action.callbacks.confirm();
		}
	}

	function promptForLinkedEvents(message) {
		// Override save behavior if more than the user-modified event affected
		if (Object.keys(linkedEvents).length > 1) {
			// Changes to all day status will not affect linked events
			if (diffDays === 0 && allDayChanged) {
				config.suppressEditEventMessages = false;
				utilities.showModal(
					'All day status changed',
					"This item's all day status was modified. Linked events will not be updated.",
					'ok',
					action.callbacks.confirm,
					null,
					null
				);
			} else {
				// Prompt user asking if they'd like to update the linked events
				utilities.showModal(
					'Update Linked Events',
					message,
					'no',
					function () {
						config.suppressEditEventMessages = false;
						action.callbacks.confirm();
					},
					'yes',
					processLinkedEvents
				);
			}
		} else {
			config.suppressEditEventMessages = false;
			action.callbacks.confirm();
		}
	}

	function processLinkedEvents() {
		showUpdatingModal('Updating Linked Events...');
		linkedEventCount = Object.keys(linkedEvents).length;

		// Prevent this action from running multiple times during this process
		action.preventAction = true;

		for (var key in linkedEvents) {
			setUpdatingTimeout(
				'Error occurred during save. Reverting changes.',
				true
			);
			updateLinkedEvent(linkedEvents[key]);
		}
	}

	function setUpdatingTimeout(message, revert) {
		clearTimeout(updatingTimeout);
		updatingTimeout = setTimeout(function () {
			helpers.showMessage(message, 0, 3000, 'error');
			if (revert && updatedEventCount > 0) {
				revertChanges(true);
			} else {
				clearUpdatingModal();
			}
		}, 10000);
	}

	function recordFailedEdit(callback, targetEvent, error) {
		verifyFinished(targetEvent, null, null, null, null, error);
	}

	function verifyFinished(
		updatedEvent,
		changesObject,
		revertObject,
		options,
		revertFunc,
		error
	) {
		var failedEvents;
		var matchingEvent = linkedEvents[updatedEvent.eventID];
		if (updatedEvent && matchingEvent) {
			updatedEventCount += 1;

			if (error) {
				matchingEvent.error =
					error.error && error.error.message
						? error.error.message
						: error.message
						? error.message
						: error.ERRORCODE
						? error.ERRORCODE + ' - ' + error.DESCRIPTION
						: error.errorCode
						? error.errorCode
						: 'Unknown';
			} else {
				matchingEvent.updated = true;
				matchingEvent.sourceEvent = updatedEvent;
			}

			if (updatedEventCount >= linkedEventCount) {
				clearTimeout(updatingTimeout);

				clearUpdatingModal();

				if (isUndo) {
					helpers.showMessage('Changes Reverted', 0, 3000);
				} else {
					failedEvents = Object.keys(linkedEvents)
						.filter(function (key) {
							return linkedEvents[key].error;
						})
						.map(function (key) {
							return linkedEvents[key];
						});
					if (failedEvents.length > 0) {
						// One or more updates failed, revert all changes
						utilities.showModal(
							'Error during save',
							failedEvents[0].error +
								'. Changes will be reverted.',
							'continue',
							revertChanges
						);
					} else {
						// show a custom undo modal
						helpers.showMessage(
							revertMessage,
							0,
							5000,
							null,
							revertChanges
						);
					}
				}
				setTimeout(function () {
					action.preventAction = false;
					config.suppressEditEventMessages = false;
				}, 50);
			}
		} else {
			clearUpdatingModal();
			if (isUndo) {
				helpers.showMessage(
					'Error during save - Unexpected result from editEvent function',
					0,
					5000,
					'error'
				);
				setTimeout(function () {
					action.preventAction = false;
					config.suppressEditEventMessages = false;
				}, 50);
			} else {
				utilities.showModal(
					'Error during save',
					'Unexpected result from editEvent function. Changes will be reverted.',
					'continue',
					revertChanges
				);
			}
		}
	}

	function revertChanges(showError) {
		isUndo = true;

		showUpdatingModal('Reverting Changes...');
		if (showError) {
			setUpdatingTimeout(
				false,
				'Error during undo - Timeout. Changes will be reverted.'
			);
		}
		curDelta = -curDelta;
		diffDays = -diffDays;

		linkedEventCount = Object.keys(linkedEvents)
			.filter(function (key) {
				return linkedEvents[key].updated;
			})
			.map(function (key) {
				return linkedEvents[key];
			}).length;

		updatedEventCount = 0;

		if (linkedEventCount > 0) {
			for (var key in linkedEvents) {
				if (linkedEvents[key].updated) {
					updateLinkedEvent(linkedEvents[key]);
				}
			}
		} else {
			clearUpdatingModal();
			setTimeout(function () {
				action.preventAction = false;
				config.suppressEditEventMessages = false;
			}, 50);
		}
	}

	function updateLinkedEvent(linkedEvent) {
		action.preventAction = true;
		config.suppressEditEventMessages = true;
		helpers.updateEvent(
			linkedEvent.sourceEvent,
			isUndo
				? linkedEvent.revertChangesArray
				: linkedEvent.eventChangesArray,
			recordFailedEdit,
			verifyFinished,
			linkedEvent.options
		);
	}

	// Function for modal window
	function showUpdatingModal(message) {
		if (!document.getElementById('linkedEventsUpdatingModalDiv')) {
			var headerObject = document.createElement('h4');
			var headerDiv = document.createElement('div');
			var modalContentObject = document.createElement('div');
			var modalMainDiv = document.createElement('div');
			updatingModalDiv = document.createElement('div');
			updatingModalDiv.className = 'modal fade in';
			updatingModalDiv.style.display = 'block';
			modalMainDiv.className = 'modal-dialog';
			Object.assign(modalMainDiv.style, updatingModalStyle);
			modalContentObject.className = 'modal-content';
			Object.assign(modalContentObject.style, updatingModalContentStyle);
			headerDiv.className = 'pad-large text-center';
			headerObject.innerText = message;
			headerDiv.appendChild(headerObject);
			modalContentObject.appendChild(headerDiv);
			modalMainDiv.appendChild(modalContentObject);
			updatingModalDiv.appendChild(modalMainDiv);
			updatingModalDiv.id = 'linkedEventsUpdatingModalDiv';
			document.body.appendChild(updatingModalDiv);
		}
	}

	// Function for clearing modal window
	function clearUpdatingModal() {
		// Remove the updating modal div
		updatingModalDiv = document.getElementById(
			'linkedEventsUpdatingModalDiv'
		);
		if (updatingModalDiv) {
			document.body.removeChild(updatingModalDiv);
		}
	}

	function isMatch(value1, value2, convertToString) {
		if (Array.isArray(value1)) {
			return (
				Array.isArray(value1) &&
				Array.isArray(value2) &&
				value1.every(function (element) {
					return value2.indexOf(element) > -1;
				}) &&
				value2.every(function (element) {
					return value1.indexOf(element) > -1;
				})
			);
		} else {
			return convertToString
				? value1 && value2 && value1.toString() === value2.toString()
				: value1 == value2;
		}
	}

	// Creates an object based on the event passed used for the updateLinkedEvent function
	function createCascadeObject(eventObject) {
		var options = {
			endShifted: false,
			isCustomAction: true,
		};

		// Event IS the user modified event
		if (event.eventID === eventObject.eventID) {
			options.endShifted = !event.beforeDrop;

			return {
				sourceEvent: eventObject,
				editEvent: event.beforeDrop ? null : editEvent,
				options: options,
				eventChangesArray: changesObject,
				revertChangesArray: createRevertChangesArray(
					revertObject,
					changesObject
				),
			};
		}

		// Event is NOT the user modified event
		else {
			return {
				sourceEvent: eventObject,
				revertChangesArray: {
					start: eventObject.start.clone(),
					end: eventObject.end.clone(),
				},
				eventChangesArray: {
					start: eventObject.allDay
						? eventObject.start.clone().add(diffDays, 'days')
						: eventObject.start.clone().add(curDelta),
					end: eventObject.allDay
						? eventObject.end.clone().add(diffDays, 'days')
						: eventObject.end.clone().add(curDelta),
				},
			};
		}
	}

	function createRevertChangesArray(revertObject, changesObject) {
		result = {};
		for (var prop in changesObject) {
			if (moment.isMoment(revertObject[prop])) {
				result[prop] = revertObject[prop].clone();
			} else {
				result[prop] = revertObject[prop];
			}
		}
		return result;
	}

	// Verifies that the specified filters match before considering an event linked
	function verifyFilterMatch(compareEvent, linkedEvent) {
		result = true;
		if (
			cascadeOptions.calendarSource &&
			linkedEvent.schedule.id !== compareEvent.schedule.id
		) {
			result = false;
		}

		if (
			cascadeOptions.sameTypeOnly &&
			linkedEvent.type !== compareEvent.type
		) {
			result = false;
		}

		// Loop through and verify event object filters
		if (result) {
			for (var filter in cascadeOptions.propertyFilters) {
				if (result && cascadeOptions.propertyFilters[filter]) {
					if (
						filter === 'customFields' &&
						Object.keys(cascadeOptions.propertyFilters.customFields)
							.length > 0
					) {
						result = checkCustomFieldsMatch(
							compareEvent,
							linkedEvent
						);
					} else {
						result = checkFilterMatch(
							compareEvent,
							linkedEvent,
							filter
						);
					}
				}
			}
		}

		return result;

		function checkCustomFieldsMatch(compareEvent, linkedEvent) {
			var matchResult = true;
			var customFieldID;
			for (var customField in cascadeOptions.propertyFilters
				.customFields) {
				customFieldID = getCustomFieldIDFromName(customField);
				if (!matchResult) {
					return false;
				} else if (customFieldID) {
					matchResult = checkMatchingGroups(
						cascadeOptions.propertyFilters.customFields[
							customField
						],
						linkedEvent,
						compareEvent,
						customFieldID
					);
				}
			}
			return matchResult;
		}

		function checkFilterMatch(compareEvent, linkedEvent, filter) {
			var matchResult = true;

			// Verify the values of the two objects match
			if (cascadeOptions.propertyFilters[filter].anyMatch) {
				matchResult = isMatch(
					compareEvent[filter],
					linkedEvent[filter]
				);
			}

			// Verify that the elements in the property array match one of the matchingGroups
			else if (cascadeOptions.propertyFilters[filter].matchingGroups) {
				matchResult = checkMatchingGroups(
					cascadeOptions.propertyFilters[filter].matchingGroups,
					linkedEvent,
					compareEvent,
					filter
				);
			}

			return matchResult;
		}

		function checkMatchingGroups(
			matchingGroups,
			linkedEvent,
			compareEvent,
			filter
		) {
			var matchResult = true;
			for (var i = 0; i < matchingGroups.length; i++) {
				matchResult =
					isMatch(matchingGroups[i], compareEvent[filter], true) &&
					isMatch(matchingGroups[i], linkedEvent[filter], true);
				if (matchResult) {
					break;
				}
			}
			return matchResult;
		}

		function getCustomFieldIDFromName(fieldName) {
			var customFields = event.schedule.customFields;
			for (var key in customFields) {
				if (customFields[key].name === fieldName) {
					return customFields[key].id;
				}
			}
			return false;
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
