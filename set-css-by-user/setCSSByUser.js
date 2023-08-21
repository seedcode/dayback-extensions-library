// Set CSS by User v1.1

// Purpose:
// Adds a CSS class to the calendar container based on
// a specific logged in user, or the logged in user's
// matching resource tag

// Action Type: After Calendar Rendered
// Prevent Default Action: No
// Action Enabled For: App

// More info on custom App Actions here:
// https://docs.dayback.com/article/140-custom-app-actions

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

	// Any input data for the action should be specified here

	/**
	 * The currently signed in account email
	 * @type {string}
	 */
	inputs.account = globals.seedcodeCalendar.get('config').account;

	/**
	 * The currently signed in account name
	 * @type {string}
	 */
	inputs.accountName = globals.seedcodeCalendar.get('config').accountName;

	/* Usage Recommendations:
	 *
	 * Please specify whether you wish to use Account Names to determines custom CSS
	 * definitions, or whether you'd prefer to match the Account Name to the Resource
	 * list, and set the CSS selector to the value of a specific resource tag.
	 *
	 * Please note that if you choose to use Account Names, you will have to duplicate
	 * your custom CSS definitions for every User Name which should have a custom class.
	 * The benefit of using Resource Tags is that you can set Tags based on the value
	 * of your Salesforce or FileMaker records. This is helpful in the case of having
	 * specific user roles.
	 *
	 * You can assign a Resource to a Finance, Sales, Market teams, for example, and
	 * customize DayBack look and feel based on the user's role.
	 *
	 * Please see this link on using Resource Tags:
	 *
	 *      https://docs.dayback.com/article/272-resource-attributes
	 *
	 * Please see these examples for how to automatically pull Resources and Resource
	 * Tags directly from Salesforce or FileMaker:
	 *
	 *      https://docs.dayback.com/article/168-dynamic-resources-statuses
	 *
	 * Please note that you *can* use a combination of both Account Names and Resource
	 * Tags by setting both of the following fields to true. This would allow you to
	 * set specific styles of an Account Role, but then also modify it further by specific
	 * individuals using your CSS class selectors.
	 */

	/**
	 * Using Account Names:
	 *
	 * If set to true, action will assign a class name based on the user's full name to
	 * the <calendar> container. Any spaces in the account name will be converted to
	 * dashes and special characters will be removed.
	 *
	 * For example, if you have a user named "Mike O'Neil" their CSS selector will become
	 * <calendar class="account-Mike-ONeil">...</calendar>
	 *
	 * You can then use any CSS class selector you would normally use and then prepend
	 * Mike's personal CSS class selector to your CSS definition. The following example
	 * would hide Mike's Month View naviation menu item, as well as the Analytics button:
	 *
	 *     .account-Mike-ONeil .nav .nav-group li:nth-child(7) { display: none; }
	 *
	 *     .account-Mike-ONeil .measure-button-container { display: none !important; }
	 *
	 * @type {boolean}
	 */
	inputs.useAccountNameClasses = true;

	/**
	 * Using Resource Tags:
	 *
	 * By default, this app action will use Account Name CSS classes. If you decide to
	 * use Resource Tags, configure your Resources to contain a tag named 'dbkCSS:Role',
	 * where Role is the specific Account Role that will be used as a custom CSS
	 * selector.
	 *
	 * For example:
	 *
	 *      Reily is in Customer Support and has the Tag dbkCSS:CustomerService
	 *
	 *      Lee is in Sales and has a Resource Tag dbkCSS:Finance
	 *
	 *      Joe is in Management and Finance and has Resource Tags dbkCSS:Management,
	 *      dbkCSS:Finance
	 *
	 * This App Action will look for the logged-in user in your Resources and look for
	 * a tag that starts with dbkCSS. It will then add the value of this tagf to the
	 * <calendar> container. Any special characters will be removed, and spaces will be
	 * converted to dashes.
	 *
	 * For example, if you have a the tag "dbkCSS:Customer Service" their CSS selector
	 * will become <calendar class="dbkCSS-Customer-Service">...</calendar>
	 *
	 * In Joe's case, he will have both tags applied to his calendar. This can allow you
	 * to apply styles that are applicable to either of these tags. Here's how that would
	 * look: <class="dbkCSS-Management dbkCSS-Finance">...</calendar>
	 *
	 * Once tags are applied, you can use any CSS class selector you would normally use
	 * and then prepend the above selector(*) to your CSS definition. The following example
	 * would hide Month View for the Sales team, and the Analytics button for Customer
	 * Service team.
	 *
	 *     .dbkCSS-Sales .nav .nav-group li:nth-child(7) { display: none; }
	 *
	 *     .dbkCSS-Customer-Service .measure-button-container { display: none !important; }
	 *
	 * @type {boolean}
	 */
	inputs.useResourceTag = true;

	/**
	 * By defauly DayBack will look for Resource tags starting with dbkCSS. You can
	 * change this if you need to, but in most cases this should not be necessary
	 * @type {string}
	 */
	inputs.resourceTagGroup = 'dbkCSS';

	//----------- End Configuration -------------------
} catch (error) {
	reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
	// Get the calendar container

	let calendar = document.querySelector('calendar');

	let calendarDataset;

	if (calendar instanceof HTMLElement) {
		calendarDataset = calendar.dataset;
	}

	// If we are using Tags, match the user's Account Name against the Resource List
	// and extract the Tags that match resourceTagGroup and add that group to the
	// calendar container

	if (inputs.useResourceTag && inputs.resourceTagGroup != '') {
		// Look for tags containing inputs.resourceTagGroup
		let tagMatch = new RegExp('^' + inputs.resourceTagGroup + ':(.*?)$');

		let resources = globals.seedcodeCalendar.get('resources');
		let foundResource = resources?.find(
			(item) => item.name == inputs.accountName
		);
		let resourceTags =
			typeof foundResource === 'object' &&
			Array.isArray(foundResource.tags)
				? foundResource.tags
				: [];
		let cssTagDirective = resourceTags.filter((item) =>
			item.name.match(tagMatch)
		);

		// If we found tags

		if (cssTagDirective.length) {
			// Add the class names of each tag to the the calendar container
			cssTagDirective.forEach((tag) => {
				let tagClassSelector;
				let match = tag.name.match(tagMatch);

				if (match && match.length && match[1].length) {
					tagClassSelector =
						inputs.resourceTagGroup +
						'-' +
						match[1]
							.replace(/ /g, '-')
							.replace(/[^A-Z0-9\-]/gi, '');

					// If we have loaded the calendar container, add the newly created classSelector
					// Add generic dataset attribute stating a custom class was applied.

					if (
						calendar !== null &&
						!calendar.classList.contains(tagClassSelector)
					) {
						calendar.classList.add(tagClassSelector);
						if (calendarDataset !== null) {
							calendarDataset.customStylesheet = true;
						}
					}
				}
			});
		}
	}

	// If we are using Account Class names, add the user's Account Name to the Calendar container

	let accountClassSelector;

	if (inputs.useAccountNameClasses) {
		accountClassSelector =
			'account-' +
			inputs.accountName.replace(/ /g, '-').replace(/[^A-Z0-9\-]/gi, '');

		// If we have loaded the calendar container, add the newly created classSelector
		// Add generic dataset attribute stating a custom class was applied.

		if (
			calendar !== null &&
			!calendar.classList.contains(accountClassSelector)
		) {
			calendar.classList.add(accountClassSelector);

			if (calendarDataset !== null && calendarDataset !== undefined) {
				calendarDataset.customStylesheet = 'true';
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
