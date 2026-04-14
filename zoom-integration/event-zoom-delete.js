//DayBack Meetings API integration custom action v6.0
// License: MIT

//Purpose:
//Communicates with the DayBack Meetings API to Create/Delete/Reschedule a meeting

//This code is designed to be used for all custom and event actions required for
//connecting with screen-share meeting services.
//The same code will be used for each action. For each action, be sure to
//specify the "meetingType" and "action" values in the config variable just below.

//Action Type: On Delete Event Action
//Open in new window: No

// More info on custom App Actions here:
// https://docs.dayback.com/article/140-custom-app-actions

// @ts-check - Type checking with JSDoc (Remove this line to disable)

(() => {
	// Declare global imports
	// prettier-ignore
	// @ts-ignore
	const globals = {action, dbk, seedcodeCalendar, utilities, moment, Sfdc, fbk, event, editEvent, changesObject};

	const options = {};
	const inputs = {};

	// @ts-ignore
	const /** @type Object */ dbkEvent = globals.event;
	const /** @type Object */ dbkEditEvent = globals.editEvent;
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
		//@ts-ignore
		reportError(error);
	}

	//----------- The action itself: place all runtime code inside this function. -------------------

	// Action code goes inside this function
	function run() {
		//
		Initialize(dbkEditEvent, location, innerWidth, innerHeight);

		//Set Config and initialize call to Meetings API
		function Initialize(editEvent, location, innerWidth, innerHeight) {
			globals.seedcodeCalendar.get('ado-zoomFunction')(
				'eventdelete',
				editEvent,
				globals.changesObject,
				location,
				innerWidth,
				innerHeight,
				screenY,
				screenX
			);
		}
	}

	//----------- Run function wrapper and helpers - you shouldn’t need to edit below this line. -------------------

	// Shared type definitions
	/**
	 * @typedef {Object} ActionError
	 * @property {string} name
	 * @property {string} message
	 */

	// Variables used for helper functions below
	// @ts-ignore
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
		// @ts-ignore
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
		// @ts-ignore
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
			// @ts-ignore
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
