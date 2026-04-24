// Filter Resources with Events Action v1.05

// Name: Filter Resources with Events - Part 1
// Type: App Action
// Purpose:
// Filters the calendar for only resources with events in the date range
// Only enabled in resource views
// Action Type: After Events Rendered
// Prevent Default Action: No

// More info on custom App Actions here:
// https://docs.dayback.com/article/140-custom-app-actions

// @ts-check - Type checking with JSDoc (Remove this line to disable)

(() => {
	// Declare global imports
	// prettier-ignore
	// @ts-ignore
	const globals = { action, dbk, seedcodeCalendar, utilities, moment, Sfdc, fbk, event, editEvent };

	const options = {};
	const inputs = {};

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
		inputs.account = sc.get("config").account;

		//----------- End Configuration -------------------
	} catch (error) {
		reportError(error);
	}

	//----------- The action itself: you may not need to edit this. -------------------

	// Action code goes inside this function
	function run() {
		//
		var calendarConfig = globals.seedcodeCalendar.get("config");
		var calendarView = globals.seedcodeCalendar.get("view");
		var clientEvents = globals.seedcodeCalendar
			.get("element")
			.fullCalendar("clientEvents");
		var resourceFilters = globals.seedcodeCalendar.get("resources");
		var resourceList = [];
		var resourceRefresh = globals.seedcodeCalendar.get("resourceRefresh");

		//Verify this feature should be shown or not first
		checkFilterResourcesButton();
		//If feature is toggled on, update resource filters
		if (!isResourceView()) {
			//don't apply this change
			return;
		} else if (!globals.seedcodeCalendar.get("filterResourcesWithEvents")) {
			//filter function not enabled.
			return;
		} else if (clientEvents.length === 0) {
			//nothing shown, clear filters.

			return;
		} else {
			//right view and enabled.
			if (resourceRefresh === true) {
				//it's true, and done.  set to false.
				finishResourceFilters();
			} else if (resourceRefresh === "clear") {
				setResourceFilters();
			} else if (!resourceRefresh) {
				//it is false, check if we need to do anything.

				if (params.data.fromScheduleChange) {
					//clear resources and reset.

					clearResourceFilters();
				} else if (params.data.fromRefresh) {
					//clear resources and reset.

					clearResourceFilters();
				} else if (params.data.fromViewStateChange) {
					//if we are just paging through resources, do not clear and reset. otherwise, clear and reset.

					let newStart = calendarView.start;
					let newEnd = calendarView.end;
					let newView = calendarView.name;
					let oldView = globals.seedcodeCalendar.get("bt-oldView");
					let oldStart = globals.seedcodeCalendar.get("bt-oldStart");
					let oldEnd = globals.seedcodeCalendar.get("bt-oldEnd");

					if (newView !== oldView) {
						//run, because we changed resource views.

						clearResourceFilters();
					} else if (!newStart.isSame(oldStart) || !newEnd.isSame(oldEnd)) {
						//we changed time/date range, so run.

						clearResourceFilters();
					} else {
						//view and date; range the same, we are paging through resources. do not clear and reset.

						finishResourceFilters();
					}
				}
			}
		}
		function finishResourceFilters() {
			resourceRefresh = false;
			globals.seedcodeCalendar.init("resourceRefresh", resourceRefresh);
			globals.seedcodeCalendar.init("bt-oldView", calendarView.name);
			globals.seedcodeCalendar.init("bt-oldStart", calendarView.start);
			globals.seedcodeCalendar.init("bt-oldEnd", calendarView.end);
			return;
		}
		function clearResourceFilters() {
			resourceRefresh = "clear";
			globals.seedcodeCalendar.init("resourceRefresh", resourceRefresh);
			for (var i = 0; i < resourceFilters.length; i++) {
				resourceFilters[i].status.selected = false;
			}

			globals.dbk.resetResources();
		}
		function setResourceFilters() {
			//set these from the events.
			//we already cleared the resources, and now we must set according to events.
			resourceRefresh = true;
			globals.seedcodeCalendar.init("resourceRefresh", resourceRefresh);
			if (clientEvents.length > 0) {
				for (var e = 0; e < clientEvents.length; e++) {
					if (
						//Only consider events that are visible
						calendarConfig.eventShown(clientEvents[e], false, false) &&
						//Only consider events that are within the current calendar view range
						clientEvents[e].end >= calendarView.start &&
						clientEvents[e].start <= calendarView.end
					) {
						var eventResources = clientEvents[e].resource;
						for (var r = 0; r < eventResources.length; r++) {
							if (!resourceList.includes(eventResources[r])) {
								resourceList.push(eventResources[r]);
							}
						}
					}
				}
				for (var i = 0; i < resourceFilters.length; i++) {
					resourceFilters[i].status.selected = resourceList.includes(
						resourceFilters[i].name
					);
				}
				//prevent pagination on the resource views, it causes trouble

				globals.dbk.resetResources();
			}
		}

		//Function to check whether or not the button for this feature should be enabled
		function checkFilterResourcesButton() {
			var cbContainer = document.getElementById(
				"filter-resources-with-events-container"
			);

			if (cbContainer && isResourceView()) {
				cbContainer.style.display = "block";
			} else if (cbContainer) {
				cbContainer.style.display = "none";
			}
		}

		function isResourceView() {
			return (
				calendarView &&
				(calendarView.name.includes("Resource") ||
					(calendarView.name.includes("Horizon") &&
						globals.seedcodeCalendar.get("config").horizonBreakoutField ===
						"resource"))
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
					name: "Timeout",
					message:
						"The action was unable to execute within the allotted time and has been stopped",
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
		const errorTitle = "Error Running Custom Action";
		const errorMessage = `<p>There was a problem running the action "<span style="white-space: nowrap">${globals.action.name?.length > 0
			? globals.action.name
			: globals.action.type
			}</span>"</p><p>Error: ${error.message
			}.</p><p>This may result in unexpected behavior of the calendar.</p>`;
		if (
			globals.action.preventDefault &&
			globals.action.category !== "event" &&
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
				"OK",
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
