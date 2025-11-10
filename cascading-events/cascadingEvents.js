// DayBack Cascading Events v1.1
// License: MIT
// Type: Event Action
// Name: Cascading Events

//Purpose:
//Looks for future events related by the defined criteria on lines 21-128 and
//adjusts them according to the change in the current event

//Action Type: On Event Save Action
//Open in new window: No
//Prevent Default Action: Yes

//More info on custom actions here:
//https://docs.dayback.com/article/5-custom-actions

(() => {
	// Declare global imports
	// prettier-ignore
	// @ts-ignore
	const globals = {action, dbk, seedcodeCalendar, utilities, moment, Sfdc, fbk, event, editEvent, changesObject, revertObject};

	const options = {};
	const inputs = {};

	const /** @type Object */ dbkEvent = globals.event;
	const /** @type Object */ dbkEditEvent = globals.editEvent;
	const /** @type Object */ dbkChangesObject = globals.changesObject;
	const /** @type Object */ dbkRevertObject = globals.revertObject;
	const sc = globals.seedcodeCalendar;

	try {
		//----------- Configuration -------------------

		// Options specified for this action

		/**
		 * Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)
		 * @type {number}
		 */
		options.runTimeout = 8;

		/**
		 * Array of account emails for whom this action will run. Leave blank to allow the action to run for everyone.
		 * Example: ['person@domain.com', 'someone@domain.com']
		 * @type {Array<string>}
		 */
		options.restrictedToAccounts = [];

		// Any input data for the action should be specified here

		/**
		 * The currently signed in account email
		 * @type {string}
		 */
		inputs.account = sc.get('config').account;

		//----------- End Configuration -------------------
	} catch (error) {
		reportError(error);
	}

	//----------- The action itself: you may not need to edit this. -------------------

	// Action code goes inside this function
	function run() {
		'use strict';

		//----------- Edit Here ---------------
		//Define the options for the cascading behavior
		const cascadeOptions = {
			//If using this event action with multiselect,
			//enable these two lines to specify those events as the linked events
			selectedEvents: sc.get('multiSelect'),

			/*
			Define below the criteria for what defines a "linked" event
			By Default, These criteria stack (AND), so each filter must return true for an event to be considered linked
			Alternative options are:
			- OR: Use this if you want to consider events linked if they match any of the criteria
			- ADVANCED: Use this if you want to define your own logic for what makes an event linked (For Example (resource and status) or (allDay and titleEdit))
			*/
			// filterLogic: 'AND', //Options are AND, OR, ADVANCED
			filterLogic: 'OR', //Options are AND, OR, ADVANCED
			// filterLogic: 'ADVANCED', //Options are AND, OR, ADVANCED
			// advancedFilterLogic: {}, //Used only if filterLogic is set to ADVANCED. Define your own logic here using property names as in the propertyFilters object below
			//advancedFilterLogic: {or: [{and: ['resource', 'status']}, {and: ['allDay', 'titleEdit']}]}, //Example logic for ADVANCED option

			//Should all events in the same calendar source be considered linked
			calendarSource: true,

			/*
			Property Filters
			Here you can define what makes a linked event based on a property of the event
			This can be based on any valid properties of the event object
			For each property you can define two options (resource being the exception with 3).
			
			1. anyMatch - This should be set to true if you only want to consider all events
			with matching values in this property as "linked" and don't want to specify groups

			2. matchingGroups - An array that contains one or more property values
			Use this to specify values for that property that should be considered linked
			Keep in mind that some properties are strings and others are arrays
			Details on event properties here: https://docs.dayback.com/article/124-action-objects-methods#editEvent

			3. cascadeChangedResource (resource only) - Set to true to cascade even if resource was changed
			This will cascade events for the new resource when an event is dragged between resource columns

			The customFields object is a JSON object where the field name is the key
			and the value is an array just like the matchingGroups array in the other fields
			Each entry in this array is a separate match condition for that field
			For picklists fields where multiselect is allowed, enter each match as an array of strings
			as in the 'My picklist custom Field' example below

			Below are some examples.

			resource: {
			anyMatch: false,
			matchingGroups: [
				['KC Embrey'],
				['KC Embrey', 'John Sindelar'],
				['KC Embrey', 'Tanner Ellen']
			],
			cascadeChangedResource: true
			},
			description: {
			anyMatch: true,
			matchingGroups: null
			},
			titleEdit: {
			anyMatch: false,
			matchingGroups: [
				'Service Call',
				'Consultation'
			]
			},
			customFields: {
			'My custom Field Label': [
				'Green',
				'Blue',
				'Yellow'
			],
			'Another custom Field': [
				'Loud',
				'Soft',
				'Medium'
			],
			'My picklist custom Field': [
				['Salespeople'],
				['Service Techs'],
				['Administrators','Salespeople']
			]
			}
			*/
			propertyFilters: {
				resource: {
					anyMatch: true,
					matchingGroups: null,
				},
				status: null,
				contactID: null,
				contactName: null,
				projectID: {
					anyMatch: true,
					matchingGroups: null,
				},
				projectName: null,
				location: null,
				tags: null,
				allDay: null,
				titleEdit: null,
				description: null,
				customFields: null,
			},
		};

		//----------- You shouldn’t need to edit below this line -------------------

		//Exit here if there are selected events as that is handled by DayBack core now
		if (cascadeOptions.selectedEvents) {
			return true;
		}

		let updatingModalDiv;
		let updatingTimeout;
		let curDelta;
		let diffDays = 0;
		let isUndo = false;
		const updatingModalStyle = {
			height: 'auto',
			width: '400px',
		};
		const updatingModalContentStyle = {
			background: 'rgba(0,0,0,0.75)',
			color: 'white',
		};
		const revertMessage =
			'<span class="message-icon-separator success">' +
			'<i class="fa fa-lg fa-check"></i>' +
			'</span>' +
			'<span translate>Linked Events Updated</span>' +
			'<span class="message-separator"> | </span>' +
			'<span translate>Undo</span>' +
			'<span class="message-icon-separator" style="opacity: 0.8;"><i class="fa fa-lg fa-undo"></i></span>';

		let linkedEventCount;
		const linkedEvents = {};
		let updatedEventCount = 0;
		const allDayChanged =
			dbkChangesObject.hasOwnProperty('allDay') &&
			dbkChangesObject.allDay !== dbkRevertObject.allDay;
		const config = sc.get('config');
		config.suppressEditEventMessages = true;
		let advancedFilterLogicErrorShown = false; // Track to avoid duplicate modals

		// Support advancedFilterLogic provided as a string when filterLogic is ADVANCED
		if (
			cascadeOptions.filterLogic &&
			cascadeOptions.filterLogic.toUpperCase() === 'ADVANCED' &&
			typeof cascadeOptions.advancedFilterLogic === 'string'
		) {
			try {
				cascadeOptions.advancedFilterLogic =
					parseAdvancedFilterExpression(
						cascadeOptions.advancedFilterLogic
					);
			} catch (e) {
				advancedFilterLogicErrorShown = true;
				globals.utilities.showModal(
					'Advanced Filter Logic Error',
					'Parsing error in advancedFilterLogic string: ' +
						(e && e.message ? e.message : e),
					'OK'
				);
				cascadeOptions.advancedFilterLogic = null; // Force no matches
			}
		}

		//Calculate the delta to apply to events
		if (
			cascadeOptions.propertyFilters.resource &&
			cascadeOptions.propertyFilters.resource.cascadeChangedResource &&
			dbkChangesObject.resource
		) {
			curDelta = dbkChangesObject.end
				? dbkChangesObject.end
						.clone()
						.diff(dbkChangesObject.start.clone())
				: null;
		} else {
			if (!allDayChanged && dbkChangesObject.end) {
				diffDays = dbkChangesObject.end
					.clone()
					.startOf('day')
					.diff(dbkRevertObject.end.clone().startOf('day'), 'days');
				curDelta = dbkEvent.allDay
					? dbkChangesObject.end
							.clone()
							.startOf('day')
							.diff(dbkRevertObject.end.clone().startOf('day'))
					: dbkChangesObject.end
							.clone()
							.diff(dbkRevertObject.end.clone());
			} else if (dbkChangesObject.start) {
				diffDays = dbkChangesObject.start
					.clone()
					.startOf('day')
					.diff(dbkRevertObject.start.clone().startOf('day'), 'days');
				curDelta =
					allDayChanged || dbkEvent.allDay
						? dbkChangesObject.start
								.clone()
								.startOf('day')
								.diff(
									dbkRevertObject.start.clone().startOf('day')
								)
						: dbkChangesObject.start
								.clone()
								.diff(dbkRevertObject.start.clone());
			}
		}

		//Continue to normal save if there is no date/time change, this is a new event, event changed schedules, or this is an undo save
		if (
			(!curDelta && !allDayChanged) ||
			!dbkEvent.eventID ||
			dbkChangesObject.hasOwnProperty('eventSource') ||
			options.isUndo
		) {
			config.suppressEditEventMessages = false;
			confirmCallback();
		} else {
			CheckForLinkedEvents();
		}

		//Checks an individual source for upcoming events
		//that match the requested notification interval
		function CheckForLinkedEvents() {
			const calendarView = sc.get('view');

			//Get all events on calendar
			const clientEvents = sc
				.get('element')
				.fullCalendar('clientEvents')
				.sort(function (a, b) {
					return a.start > b.start ? 1 : -1;
				});

			let filtersSet = false;
			for (const key in cascadeOptions.propertyFilters) {
				if (cascadeOptions.propertyFilters[key]) {
					filtersSet = true;
					break;
				}
			}

			if (clientEvents) {
				for (const clientEvent of clientEvents) {
					//Always add the user modified event to events to update
					if (
						clientEvent.eventID === dbkEvent.eventID ||
						(clientEvent.eventID !== dbkEvent.eventID &&
							//Only continue if there is at least one positive filter option
							(cascadeOptions.calendarSource || filtersSet) &&
							//Only consider events that are visible
							config.eventShown(clientEvent, true, false) &&
							//Only consider events that are within the current calendar view range
							clientEvent.start >= calendarView.start &&
							clientEvent.end <= calendarView.end &&
							//Only consider events that are starting at the same time or after the changed event
							clientEvent.start >= dbkRevertObject.start &&
							//Only consider events that meet the user defined criteria
							verifyFilterMatch(event, clientEvent) &&
							//Only consider all day events if the original event has changed at least one day
							(!clientEvent.allDay || diffDays !== 0))
					) {
						//Event should be considered linked and added to those to be updated
						linkedEvents[clientEvent.eventID] =
							createCascadeObject(clientEvent);
					}
				}

				promptForLinkedEvents(
					'Would you like to update linked events?'
				);
			} else {
				config.suppressEditEventMessages = false;
				confirmCallback();
			}
		}

		function promptForLinkedEvents(message) {
			//Override save behavior if more than the user-modified event affected
			if (Object.keys(linkedEvents).length > 1) {
				cancelTimeoutCheck();
				//Changes to all day status will not affect linked events
				if (diffDays === 0 && allDayChanged) {
					config.suppressEditEventMessages = false;
					globals.utilities.showModal(
						'All day status changed',
						"This item's all day status was modified. Linked events will not be updated.",
						'ok',
						confirmCallback,
						null,
						null
					);
				} else {
					//Prompt user asking if they'd like to update the linked events
					globals.utilities.showModal(
						'Update Linked Events',
						message,
						'no',
						function () {
							config.suppressEditEventMessages = false;
							confirmCallback();
						},
						'yes',
						processLinkedEvents
					);
				}
			} else {
				config.suppressEditEventMessages = false;
				confirmCallback();
			}
		}

		function processLinkedEvents() {
			showUpdatingModal('Updating Linked Events...');
			linkedEventCount = Object.keys(linkedEvents).length;

			//Prevent this action from running multiple times during this process
			globals.action.preventAction = true;

			for (const key in linkedEvents) {
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
				globals.dbk.showMessage(message, 0, 3000, 'error');
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
			let failedEvents;
			const matchingEvent = linkedEvents[updatedEvent.eventID];
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
						globals.dbk.showMessage('Changes Reverted', 0, 3000);
					} else {
						failedEvents = Object.keys(linkedEvents)
							.filter(function (key) {
								return linkedEvents[key].error;
							})
							.map(function (key) {
								return linkedEvents[key];
							});
						if (failedEvents.length > 0) {
							//One or more updates failed, revert all changes
							globals.utilities.showModal(
								'Error during save',
								failedEvents[0].error +
									'. Changes will be reverted.',
								'continue',
								revertChanges
							);
						} else {
							//show a custom undo modal
							globals.dbk.showMessage(
								revertMessage,
								0,
								5000,
								null,
								revertChanges
							);
						}
					}
					setTimeout(function () {
						globals.action.preventAction = false;
						config.suppressEditEventMessages = false;
					}, 50);
				}
			} else {
				clearUpdatingModal();
				if (isUndo) {
					globals.dbk.showMessage(
						'Error during save - Unexpected result from editEvent function',
						0,
						5000,
						'error'
					);
					setTimeout(function () {
						globals.action.preventAction = false;
						config.suppressEditEventMessages = false;
					}, 50);
				} else {
					globals.utilities.showModal(
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
				for (const key in linkedEvents) {
					if (linkedEvents[key].updated) {
						updateLinkedEvent(linkedEvents[key]);
					}
				}
			} else {
				clearUpdatingModal();
				setTimeout(function () {
					globals.action.preventAction = false;
					config.suppressEditEventMessages = false;
				}, 50);
			}
		}

		function updateLinkedEvent(linkedEvent) {
			globals.action.preventAction = true;
			config.suppressEditEventMessages = true;
			globals.dbk.updateEvent(
				linkedEvent.sourceEvent,
				isUndo
					? linkedEvent.revertChangesArray
					: linkedEvent.eventChangesArray,
				recordFailedEdit,
				verifyFinished,
				linkedEvent.options
			);
		}

		//Function for modal window
		function showUpdatingModal(message) {
			if (!document.getElementById('linkedEventsUpdatingModalDiv')) {
				const headerObject = document.createElement('h4');
				const headerDiv = document.createElement('div');
				const modalContentObject = document.createElement('div');
				const modalMainDiv = document.createElement('div');
				updatingModalDiv = document.createElement('div');
				updatingModalDiv.className = 'modal fade in';
				updatingModalDiv.style.display = 'block';
				modalMainDiv.className = 'modal-dialog';
				Object.assign(modalMainDiv.style, updatingModalStyle);
				modalContentObject.className = 'modal-content';
				Object.assign(
					modalContentObject.style,
					updatingModalContentStyle
				);
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

		///Function for clearing modal window
		function clearUpdatingModal() {
			//Remove the updating modal div
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
					? value1 &&
							value2 &&
							value1.toString() === value2.toString()
					: value1 == value2;
			}
		}

		//Creates an object based on the event passed used for the updateLinkedEvent function
		function createCascadeObject(eventObject) {
			const options = {
				endShifted: false,
				isCustomAction: true,
			};

			//Event IS the user modified event
			if (dbkEvent.eventID === eventObject.eventID) {
				options.endShifted = !dbkEvent.beforeDrop;

				return {
					sourceEvent: eventObject,
					editEvent: dbkEvent.beforeDrop ? null : editEvent,
					options: options,
					eventChangesArray: changesObject,
					revertChangesArray: createRevertChangesArray(
						dbkRevertObject,
						changesObject
					),
				};
			}

			//Event is NOT the user modified event
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
			const result = {};
			for (const prop in changesObject) {
				if (globals.moment.isMoment(revertObject[prop])) {
					result[prop] = revertObject[prop].clone();
				} else {
					result[prop] = revertObject[prop];
				}
			}
			return result;
		}

		/**************** Advanced Filter Logic String Parser ****************
		 * Grammar:
		 *   EXPR := OR
		 *   OR   := AND (OR AND)*
		 *   AND  := FACTOR (AND FACTOR)*
		 *   FACTOR := IDENT | NOT FACTOR | ( EXPR )
		 * Operators: AND, OR, NOT (case-insensitive)
		 * Parentheses for grouping. Identifiers map to keys in propertyFilters.
		 * Output JSON mirrors manual structure: {and:[...]}, {or:[...]}, {not: expr}
		 *********************************************************************/
		function parseAdvancedFilterExpression(expr) {
			if (!expr || typeof expr !== 'string') {
				throw new Error('Expression must be a non-empty string');
			}
			const tokens = tokenize(expr);
			let position = 0;
			function peek() {
				return tokens[position];
			}
			function consume(expectedTypeOrValue) {
				const t = tokens[position];
				if (!t) throw new Error('Unexpected end of expression');
				if (
					expectedTypeOrValue &&
					t.type !== expectedTypeOrValue &&
					t.value !== expectedTypeOrValue
				) {
					throw new Error(
						'Expected ' +
							expectedTypeOrValue +
							' but found ' +
							(t.value || t.type)
					);
				}
				position += 1;
				return t;
			}
			function parseExpression() {
				return parseOr();
			}
			function parseOr() {
				let node = parseAnd();
				const group = [node];
				while (true) {
					const t = peek();
					if (t && t.type === 'OP' && t.value === 'OR') {
						consume();
						group.push(parseAnd());
					} else break;
				}
				return group.length > 1 ? {or: group} : node;
			}
			function parseAnd() {
				let node = parseFactor();
				const group = [node];
				while (true) {
					const t = peek();
					if (t && t.type === 'OP' && t.value === 'AND') {
						consume();
						group.push(parseFactor());
					} else break;
				}
				return group.length > 1 ? {and: group} : node;
			}
			function parseFactor() {
				const t = peek();
				if (!t) throw new Error('Unexpected end of expression');
				if (t.type === 'OP' && t.value === 'NOT') {
					consume();
					return {not: parseFactor()};
				}
				if (t.type === 'LPAREN') {
					consume('LPAREN');
					const inner = parseExpression();
					if (!peek() || peek().type !== 'RPAREN') {
						throw new Error('Missing closing parenthesis');
					}
					consume('RPAREN');
					return inner;
				}
				if (t.type === 'IDENT') {
					consume();
					return t.value;
				}
				throw new Error('Unexpected token: ' + t.value);
			}
			function tokenize(str) {
				const result = [];
				const re = /\s+|([()])|(AND|OR|NOT)\b|([A-Za-z0-9_\.\-]+)/gi;
				let m;
				while ((m = re.exec(str)) !== null) {
					if (m[0].trim() === '') continue; // whitespace
					if (m[1]) {
						result.push({
							type: m[1] === '(' ? 'LPAREN' : 'RPAREN',
							value: m[1],
						});
					} else if (m[2]) {
						result.push({type: 'OP', value: m[2].toUpperCase()});
					} else if (m[3]) {
						result.push({type: 'IDENT', value: m[3]});
					}
				}
				return result;
			}
			const ast = parseExpression();
			if (position < tokens.length) {
				throw new Error(
					'Unexpected token near: ' + tokens[position].value
				);
			}
			return ast;
		}

		//Verifies that the specified filters match before considering an event linked
		function verifyFilterMatch(compareEvent, linkedEvent) {
			// Base gating checks (schedule and type). These must be true regardless of filter logic
			if (
				cascadeOptions.calendarSource &&
				linkedEvent.schedule.id !== compareEvent.schedule.id
			) {
				return false;
			}

			// Collect individual property filter results
			const filterResults = {}; // { filterName: boolean }
			let anyFiltersDefined = false;
			for (const filterName in cascadeOptions.propertyFilters) {
				const filter = cascadeOptions.propertyFilters[filterName];
				if (
					!filter ||
					(typeof filter === 'object' &&
						!Object.values(filter).some(Boolean))
				)
					continue; // skip undefined filters
				anyFiltersDefined = true;
				if (
					filterName === 'customFields' &&
					cascadeOptions.propertyFilters.customFields &&
					Object.keys(cascadeOptions.propertyFilters.customFields)
						.length > 0
				) {
					filterResults[filterName] = checkCustomFieldsMatch(
						compareEvent,
						linkedEvent
					);
				} else {
					filterResults[filterName] = checkFilterMatch(
						compareEvent,
						linkedEvent,
						filterName
					);
				}
			}

			// Helper to evaluate advanced logic specification (supports AND/OR/NOT and nested)
			function evaluateAdvanced(node) {
				if (typeof node === 'string') {
					return !!filterResults[node];
				}
				if (Array.isArray(node)) {
					return node.every(evaluateAdvanced); // implicit AND
				}
				if (node && typeof node === 'object') {
					if (node.not !== undefined) {
						return !evaluateAdvanced(node.not);
					}
					if (node.and) {
						return node.and.every(evaluateAdvanced);
					}
					if (node.or) {
						return node.or.some(evaluateAdvanced);
					}
				}
				if (!advancedFilterLogicErrorShown) {
					advancedFilterLogicErrorShown = true;
					globals.utilities.showModal(
						'Advanced Filter Logic Error',
						'Unknown structure in advancedFilterLogic. No events will be cascaded. Please review your configuration.',
						'OK'
					);
				}
				return false;
			}

			let combinedResult = false; // Safer default: no filters defined => no cascade
			const logic = (cascadeOptions.filterLogic || 'AND').toUpperCase();
			if (anyFiltersDefined) {
				if (logic === 'AND') {
					combinedResult = Object.keys(filterResults).every(
						(key) => filterResults[key]
					);
				} else if (logic === 'OR') {
					combinedResult = Object.keys(filterResults).some(
						(key) => filterResults[key]
					);
				} else if (logic === 'ADVANCED') {
					combinedResult = evaluateAdvanced(
						cascadeOptions.advancedFilterLogic
					);
				}
			}

			return combinedResult;

			function checkCustomFieldsMatch(compareEvent, linkedEvent) {
				let matchResult = true;
				let customFieldID;
				for (const customField in cascadeOptions.propertyFilters
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
				let matchResult = true;

				//Verify the values of the two objects match
				if (cascadeOptions.propertyFilters[filter].anyMatch) {
					matchResult = isMatch(
						compareEvent[filter],
						linkedEvent[filter]
					);
				}

				//Verify that the elements in the property array match one of the matchingGroups
				else if (
					cascadeOptions.propertyFilters[filter].matchingGroups
				) {
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
				let matchResult = true;
				for (const group of matchingGroups) {
					matchResult =
						isMatch(group, compareEvent[filter], true) &&
						isMatch(group, linkedEvent[filter], true);
					if (matchResult) {
						break;
					}
				}
				return matchResult;
			}

			function getCustomFieldIDFromName(fieldName) {
				const customFields = dbkEvent.schedule.customFields;
				for (const key in customFields) {
					if (customFields[key].name === fieldName) {
						return customFields[key].id;
					}
				}
				return false;
			}
		}
	}

	//----------- Run function wrapper and helpers - you shouldn’t need to edit below this line. -------------------

	// Shared type definitions
	/**
	 * @typedef {Object} ActionError
	 * @property {string} name
	 * @property {string} message
	 */

	// constiables used for helper functions below
	let timeout;

	// Execute the run function as defined above
	try {
		if (
			!options.restrictedToAccounts ||
			!options.restrictedToAccounts.length ||
			(options.restrictedToAccounts &&
				options.restrictedToAccounts.indexOf(inputs.account) > -1)
		) {
			if (globals.action.preventDefault && options.runTimeout) {
				timeoutCheck();
			}
			run();
		} else if (globals.action.preventDefault) {
			confirmCallback();
		}
	} catch (error) {
		reportError(error);
	}

	/**
	 * Run confirm callback when preventDefault is true. Used for async actions
	 * @type {() => void}
	 */
	function confirmCallback() {
		cancelTimeoutCheck();
		if (globals.action.callbacks.confirm) {
			globals.action.callbacks.confirm();
		}
	}

	/**
	 * Run cancel callback when preventDefault is true. Used for async actions
	 * @type {() => void}
	 */
	function cancelCallback() {
		cancelTimeoutCheck();
		if (globals.action.callbacks.cancel) {
			globals.action.callbacks.cancel();
		}
	}

	/**
	 * Check if the action has run within the specified time limit when preventDefault is enabled
	 * @type {() => void}
	 */
	function timeoutCheck() {
		timeout = setTimeout(
			function () {
				const error = {
					name: 'Timeout',
					message:
						'The action was unable to execute within the allotted time and has been stopped',
				};
				reportError(error);
			},
			options && options.runTimeout ? options.runTimeout * 1000 : 0
		);
	}

	/** @type {() => void} */
	function cancelTimeoutCheck() {
		if (timeout) {
			clearTimeout(timeout);
		}
	}

	/**
	 * Report any errors that occur when running this action
	 * Follows standard javascript error reporter format of an object with name and message properties
	 * @type {(error: ActionError) => void}
	 */
	function reportError(error) {
		const errorTitle = 'Error Running Custom Action';
		const errorMessage = `<p>There was a problem running the action "<span style="white-space: nowrap">${
			globals.action.name?.length > 0
				? globals.action.name
				: globals.action.type
		}</span>"</p><p>Error: ${
			error.message
		}.</p><p>This may result in unexpected behavior of the calendar.</p>`;
		if (
			globals.action.preventDefault &&
			globals.action.category !== 'event' &&
			timeout
		) {
			confirmCallback();
		} else {
			cancelCallback();
		}

		setTimeout(function () {
			globals.utilities.showModal(
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
})();
