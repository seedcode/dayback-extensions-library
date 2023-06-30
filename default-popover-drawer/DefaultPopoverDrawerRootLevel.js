// Default Popover Drawer for Root Level v1.0

// Purpose:
// Automatically opens the specified drawer on click
// This is to be applied at the root calendar level (M365 or Google only)
// This overrides any default drawer settings applied to individual calendars
// Action Type: On Event Click
// Prevent Default Action: No

// More info on custom App Actions here:
// https://docs.dayback.com/article/20-event-actions

// @ts-check - Type checking with JSDoc (Remove this line to disable)

// Declare global imports
// @ts-ignore
const globals = {action, dbk, seedcodeCalendar, utilities};

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

	/**
	 * Maximum attempts to try creating the button
	 * @type {number}
	 * @description This is used to prevent the action from running forever if the button doesn't get added to the DOM
	 * @default 20
	 */
	options.maxRetries = 20;

	// Any input data for the action should be specified here

	/**
	 * The currently signed in account email
	 * @type {string}
	 */
	inputs.account = globals.seedcodeCalendar.get('config').account;

	/**
	 * Specify the drawer button to open by default
	 * @type {string}
	 * @description Possible values are: dateStart, dateEnd, calendar, location,
	 * resource, status, contact, project, customFields, customButtons
	 */
	inputs.drawerButton = 'customFields';

	//----------- End Configuration -------------------
} catch (error) {
	reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
	let retries = 0;

	// Click our specified button
	clickButton();

	/**
	 * @returns {void}
	 * @description Attempts to click the specified button to open the drawer
	 */
	// Adds an invisible button over the resource button so that we can modify the list when it's clicked
	function clickButton() {
		let targetSelector =
			inputs.drawerButton === 'customButtons'
				? '.dbk_icon_cog'
				: '[name="' + inputs.drawerButton + '"]';
		let actionButton = document.querySelector('.edit ' + targetSelector);
		if (actionButton) {
			// @ts-ignore
			actionButton.click();
		} else {
			retries++;
			if (retries <= options.maxRetries) {
				setTimeout(clickButton, 100);
			}
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
	const errorMessage = `<p>There was a problem running the action "<span style="white-space: nowrap">${globals.action.name}</span>"</p><p>Error: ${error.message}.</p><p>This may result in unexpected behavior of the calendar.</p>`;
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
