// Buffer Events - After Event Saved v1.0

// Name: Buffer Events - After Event Saved
// Type: Event Action
// Trigger: After Event Saved
// Prevent Default Action: No

// Purpose:
// After an event is saved, rebuild buffer events for the saved event.

// More info on custom actions: https://docs.dayback.com/article/140-custom-app-actions

// @ts-check - Type checking with JSDoc (Remove this line to disable)

(() => {
	// Declare global imports
	// prettier-ignore

	const options = {};
	const inputs = {};

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
		inputs.account = seedcodeCalendar.get('config').account;

		//----------- End Configuration -------------------
	} catch (error) {
		// @ts-ignore
		reportError(error);
	}

	//----------- The action itself: place all runtime code inside this function. -------------------

	// Action code goes inside this function
	function run() {
		//check if we need to clear buffers for this event.
		let bufferFieldMap = seedcodeCalendar.get('buffers-bufferFieldsMap');

		let schedule = event.schedule;
		if (bufferFieldMap[schedule.name]) {
			//we have settings.
			// the settings contain the store-in field name; resolve to the field ID at runtime
			let beforeFieldName = bufferFieldMap[schedule.name].bufferBefore;
			let afterFieldName = bufferFieldMap[schedule.name].bufferAfter;
			let beforeFieldId = beforeFieldName
				? dbk.getCustomFieldIdByName(beforeFieldName, schedule)
				: null;
			let afterFieldId = afterFieldName
				? dbk.getCustomFieldIdByName(afterFieldName, schedule)
				: null;
			if (
				event[beforeFieldId] ||
				event[afterFieldId] ||
				(beforeFieldId && afterFieldId)
			) {
				//we have some we need to clear.
				seedcodeCalendar
					.get('element')
					.fullCalendar('removeEvents', function (buffer) {
						return buffer.parentEventId === event.eventID;
					});
				//rerender just this event's buffers;
				if (event.unscheduled) {
					//we drug this into unscheduled, do not render new buffers.
				} else {
					//this is fine.
					seedcodeCalendar.get('buffers-compileBuffers')(
						event,
						event[beforeFieldId],
						event[afterFieldId]
					);
					seedcodeCalendar.get('buffers-insertBuffers')();
				}
			}
		}
	}

	//----------- Run function wrapper and helpers - you shouldn't need to edit below this line. -------------------

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
			if (action.preventDefault && options.runTimeout) {
				timeoutCheck();
			}
			run();
		} else if (action.preventDefault) {
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
		if (action.callbacks.confirm) {
			action.callbacks.confirm();
		}
	}

	/**
	 * Run cancel callback when preventDefault is true. Used for async actions
	 * @type {() => void}
	 */
	function cancelCallback() {
		cancelTimeoutCheck();
		if (action.callbacks.cancel) {
			action.callbacks.cancel();
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
		const errorMessage = `<p>There was a problem running the action "<span style="white-space: nowrap">${action.name?.length > 0 ? action.name : action.type
			}</span>"</p><p>Error: ${error.message
			}</p><p>This may result in unexpected behavior of the calendar.</p>`;
		if (
			action.preventDefault &&
			action.category !== 'event' &&
			// @ts-ignore
			timeout
		) {
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
})();
