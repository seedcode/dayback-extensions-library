// Name: Buffer Events - Register Buffer Functions
// Type: App Action

// Load buffer functions v1.1

// Purpose:
// Load and register the functions that we use to render and clear buffers, so that we can call them from other places.
// Action Type: On Startup
// Prevent Default Action: No

// More info on custom App Actions here:
// https://docs.dayback.com/article/140-custom-app-actions

// @ts-check - Type checking with JSDoc (Remove this line to disable)

(() => {
	// Declare global imports
	// prettier-ignore
	// @ts-ignore
	const globals = {action, dbk, seedcodeCalendar, utilities, moment, Sfdc, fbk, event, editEvent};

	const options = {};
	const inputs = {};

	const sc = globals.seedcodeCalendar;

	try {
		//----------- Configuration -------------------

		// Options specified for this action

		/**
		 * Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)
		 * @type {number}
		 */
		options.runTimeout = 15;

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

		// for each calendar name, specify a buffer prior and buffer post field to use.
		// please map the field ID instead of the field name here.  This is so that the action is compatible with shares.
		inputs.bufferFieldsMap = {
			Events: {
				bufferPrior: '1774308624098-1496797706',
				bufferAfter: '1774308644077-3203571116',
			},
		};
		inputs.bufferMinimum = 10; //minutes.  if the buffer is > 0, but less than this amount, we will round up to this amount.

		//----------- End Configuration -------------------
	} catch (error) {
		reportError(error);
	}

	//----------- The action itself: you may not need to edit this. -------------------

	// Action code goes inside this function
	function run() {
		globals.seedcodeCalendar.init(
			'buffers-bufferFieldsMap',
			inputs.bufferFieldsMap
		);

		globals.seedcodeCalendar.init('buffers-buildBufferEvent', buildEvent);
		globals.seedcodeCalendar.init('buffers-insertBuffers', insertBuffers);

		globals.seedcodeCalendar.init('buffers-redrawBuffers', redrawBuffers);
		globals.seedcodeCalendar.init('buffers-compileBuffers', compileBuffers);
		globals.seedcodeCalendar.init(
			'buffers-bufferMinimum',
			inputs.bufferMinimum
		);

		//we will load buffer events into this array after processing them in before events render and then render in after events render.
		globals.seedcodeCalendar.init('buffers-bufferEvents', []);

		/** @type {() => void} */
		function redrawBuffers() {
			globals.seedcodeCalendar
				.get('element')
				.fullCalendar('rerenderEvents');
			return;
		}

		/** @type {(event: any, bufferPrior: number, bufferPost: number) => void} */
		function compileBuffers(event, bufferPrior, bufferPost) {
			//create the buffer events for inserting later.

			//pull the map here?

			let buffers = [];
			if (
				event.allDay ||
				!event.schedule.allowAllDay ||
				event.unscheduled
			) {
				//no buffers on all day events.
				return;
			}

			if (bufferPrior > 0) {
				//prior buffer on the event, create event.
				let priorEvent = buildEvent(
					event,
					bufferPrior,
					true,
					false,
					event.schedule
				);
				buffers.push(priorEvent);
			}
			if (bufferPost > 0) {
				//post buffer on the event, create event.
				let postEvent = buildEvent(
					event,
					bufferPost,
					false,
					true,
					event.schedule
				);
				buffers.push(postEvent);
			}
			//
			if (buffers.length > 0) {
				//get the events, add this to the array;
				let bufferEvents = seedcodeCalendar.get('buffers-bufferEvents');
				bufferEvents.push(...buffers);
				globals.seedcodeCalendar.init(
					'buffers-bufferEvents',
					bufferEvents
				);
			}
		}
		/** @type {() => void} */
		function insertBuffers() {
			//build the buffer events that we have stored in our array.

			let bufferEvents = globals.seedcodeCalendar.get(
				'buffers-bufferEvents'
			);

			seedcodeCalendar.init('buffers-bufferEvents', []);

			if (bufferEvents && bufferEvents.length) {
				globals.dbk.addEvents(bufferEvents);
			}
		}
		/** @type {(parentEvent: any, bufferMinutes: number, prior: boolean, post: boolean, schedule: any) => any} */
		function buildEvent(parentEvent, bufferMinutes, prior, post, schedule) {
			//build a buffer event in relation to the parent event

			let bufferEvent = {};
			let description = '***Buffer***';
			let startCalc;
			let endCalc;

			if (bufferMinutes > 0 && bufferMinutes < inputs.bufferMinimum) {
				//round up to input minimum.
				bufferMinutes = inputs.bufferMinimum;
			}

			let parentEventId = parentEvent.eventID;
			let resource = parentEvent.resource;
			if (prior) {
				startCalc = parentEvent.start
					.clone()
					.subtract(bufferMinutes, 'minutes');

				endCalc = parentEvent.start.clone();
			} else if (post) {
				startCalc = parentEvent.end.clone();

				endCalc = parentEvent.end.clone().add(bufferMinutes, 'minutes');
			}

			bufferEvent.start = startCalc;
			bufferEvent.end = endCalc;
			bufferEvent.class = 'dbk-buffer-event';
			bufferEvent.description = description;
			bufferEvent.title = '<dbk-css class="buffer-title">' + '</dbk-css>';
			bufferEvent.titleEdit = bufferEvent.title;
			bufferEvent.status = parentEvent.status;
			bufferEvent.parentEventId = parentEventId;
			bufferEvent.schedule = schedule;
			bufferEvent.eventSource = schedule.id;
			bufferEvent.resource = resource;
			bufferEvent.eventID = parentEventId;
			bufferEvent.color = parentEvent.color;
			bufferEvent.parentColor = parentEvent.color;
			bufferEvent.editable = false;
			bufferEvent.parentBufferPrior = prior ? bufferMinutes : 0;
			bufferEvent.parentBufferAfter = post ? bufferMinutes : 0;

			return bufferEvent;
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
