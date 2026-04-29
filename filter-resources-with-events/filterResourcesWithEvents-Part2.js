// Filter Resources with Events Button v1.5

// Name: Filter Resources with Events Button
// Type: Button Action
// Purpose:
// Filters the calendar for only resources with events in the date range via button
// Only enabled in resource views

// Action Type: Before Calendar Rendered
// Prevent Default Action:  No

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
		//Clear flag used in accompanying events rendered action in case coming from settings tab
		globals.seedcodeCalendar.init("resourceRefresh", false);

		var viewName = globals.seedcodeCalendar.get("view")
			? globals.seedcodeCalendar.get("view").name
			: "";
		var cbContainer = document.getElementById(
			"filter-resources-with-events-container"
		);
		var enable = localStorage
			? localStorage.getItem("filterResourcesWithEvents") === "true"
			: !!seedcodeCalendar.get("filterResourcesWithEvents");
		var maxRetries = 20;
		var retries = 0;
		var rootButtonContainer;
		var cbEnable;
		var cbDisable;

		//Create button to toggle this feature on and off
		if (!cbContainer) {
			queueButtonCreation();
		}

		function queueButtonCreation() {
			rootButtonContainer = document.querySelector(
				".calendar-button-container"
			);

			if (rootButtonContainer) {
				cbContainer = document.createElement("div");
				cbContainer.id = "filter-resources-with-events-container";
				cbContainer.classList = "filter-resources-button-container";
				if (
					viewName.includes("Resource") ||
					(viewName.includes("Horizon") &&
						globals.seedcodeCalendar.get("config").horizonBreakoutField ===
						"resource")
				) {
					cbContainer.style.display = "block";
				} else {
					cbContainer.style.display = "none";
				}
				cbEnable = document.createElement("div");
				cbEnable.id = "filter-resources-with-events-enable";
				cbEnable.classList =
					"filter-resources-button filter-resources-button-enable fa fa-group fa-lg";
				cbEnable.style.display = enable ? "none" : "block";
				cbEnable.onclick = toggleFilterResourcesWithEvents;
				cbContainer.append(cbEnable);
				cbDisable = document.createElement("div");
				cbDisable.id = "filter-resources-with-events-disable";
				cbDisable.classList =
					"filter-resources-button filter-resources-button-disable fa fa-group fa-lg";
				cbDisable.style.display = enable ? "block" : "none";
				cbDisable.onclick = toggleFilterResourcesWithEvents;
				cbContainer.append(cbDisable);
				rootButtonContainer.append(cbContainer);
				globals.seedcodeCalendar.init("filterResourcesWithEvents", enable);
			} else {
				retries++;
				if (retries <= maxRetries) {
					setTimeout(queueButtonCreation, 200);
				}
			}
		}

		function toggleFilterResourcesWithEvents() {
			var enable = !globals.seedcodeCalendar.get("filterResourcesWithEvents");

			var resourceFilters = globals.seedcodeCalendar.get("resources");
			globals.seedcodeCalendar.init("filterResourcesWithEvents", enable);
			cbEnable.style.display = enable ? "none" : "block";
			cbDisable.style.display = enable ? "block" : "none";
			if (enable) {
				globals.seedcodeCalendar.init("resourceRefresh", "clear");
				for (var i = 0; i < resourceFilters.length; i++) {
					resourceFilters[i].status.selected = false;
				}
			}

			globals.dbk.resetResources();

			if (localStorage) {
				localStorage.setItem("filterResourcesWithEvents", enable);
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
