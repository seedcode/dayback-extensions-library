// Load Resources From Objects - Salesforce v1.50

// Purpose:
// Loads resources in DayBack from Salesforce objects
// Action Type: On Resources Fetched
// Prevent Default Action: Yes

// More info on custom App Actions here:
// https://docs.dayback.com/article/140-custom-app-actions

// @ts-check - Type checking with JSDoc (Remove this line to disable)

// Declare global imports
// @ts-ignore
const globals = {action, dbk, seedcodeCalendar, utilities, fbk, dbk, Sfdc};

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
	 * The object(s) and fields for resources and folders
	 * multiple objects can be defined by adding to the array
	 * @type {Array<{}>}
	 * @property {string} objectName - The name of the Salesforce object to query
	 * @property {string} resourceFieldName - The name of the field to use for the resource name
	 * @property {string <optional>} resourceShortNameFieldName - The name of the field to use for the resource short name
	 * @property {string <optional>} resourceFieldId - The name of the field to use for the resource id
	 * @property {string <optional>} folderFieldName - The name of the field to use for the folder name
	 * @property {string <optional>} tagsFieldName - The name of the field to use for the resource tags
	 * @property {string <optional>} descriptionFieldName - The name of the field to use for the resource description
	 * @property {string <optional>} sortFieldName - The name of the field to use for the resource sort order
	 * @property {string <optional>} selectedFieldName - The name of the field to use for the resource selected status
	 * @property {string <optional>} additionalCriteria - Additional criteria to add to the SOQL query
	 */
	inputs.resourceObjects = [
		{
			objectName: 'User',
			resourceFieldName: 'Name',
			resourceShortNameFieldName: 'CommunityNickname',
			resourceFieldId: 'Id',
			folderFieldName: 'Title',
			// tagsFieldName: 'Tags__c',
			// descriptionFieldName: 'Description__c',
			// sortFieldName: 'Sort__c',
			// selectedFieldName: 'Selected__c',
			additionalCriteria: 'IsActive+=+true',
		},
		// {
		// 	objectName: 'Vehicle__c',
		// 	resourceFieldName: 'Name',
		// 	resourceFieldId: 'Id',
		// 	folderFieldName: 'Folder__c',
		// 	tagsFieldName: 'Tags__c',
		// 	descriptionFieldName: 'Description__c',
		// 	sortFieldName: 'Sort__c',
		// },
	];

	/**
	 * The name of the folder to use for resources with no specified folder
	 * Set this value to null to have these resources show up outside any folder
	 * @type {?string}
	 * @default 'No Folder'
	 */
	inputs.noFolderLabel = 'No Folder';

	//----------- End Configuration -------------------
} catch (error) {
	reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
	const addedFolders = [];
	let folders;
	let processedRequests = 0;
	let resourceCount = 0;

	//retrieve our canvas client object for authentication
	const client = globals.fbk.client();

	//retrieve our canvas context object for REST links/urls
	const context = globals.fbk.context();

	//create new array to overwrite resources
	let resources = [];
	globals.seedcodeCalendar.init('resources', resources);

	//add none resource
	resources.push(createResource({Name: 'None'}, {resourceFieldName: 'Name'}));
	resourceCount++;

	//loop through each resource object
	inputs.resourceObjects.forEach(function (resourceObject) {
		queryResources(resourceObject, processResult);
	});

	//callback for ajax call
	/**
	 * @description Callback function for the ajax call to Salesforce
	 * @param {object} data - The data returned from the SOQL query
	 * @param {object} resourceObject - The resource object specified in the inputs
	 * @returns {void} - Adds the resulting values to DayBack's resources
	 */
	function processResult(data, resourceObject) {
		if (data.status == 200) {
			//build array of folder names
			folders = buildFolders(
				data,
				folders,
				resourceObject.folderFieldName
			);
			const folderIndex = {};

			const records = data.payload.records;
			let resource;
			let category;

			//create folders
			folders.forEach(function (folder) {
				if (!addedFolders.includes(folder)) {
					let folderObject = createFolder(folder);
					folderIndex[folderObject.folderName] = folderObject;
					resources.push(folderObject);
					addedFolders.push(folder);
					resourceCount++;
				}
			});

			//create resources
			records.forEach(function (record) {
				const folderName = getFieldValue(
					record,
					resourceObject.folderFieldName
				);
				if (!folderName) {
					category = inputs.noFolderLabel;
				} else {
					category = folderName;
				}
				const categories = category ? category.split(';') : [category];
				categories.forEach(function (thisCategory) {
					resource = createResource(
						record,
						resourceObject,
						folderIndex[thisCategory]
					);
					resources.push(resource);
					resourceCount++;
				});
			});

			processedRequests++;

			if (processedRequests === inputs.resourceObjects.length) {
				//sort resources
				resources = globals.dbk.filterFieldSort(resources);
				//continue actions/loading
				confirmCallback();
			}
		}
	}

	/**
	 * @description Queries the specified Salesforce object for resources
	 * @param {object} resourceObject - The resource object specified in the inputs
	 * @param {function} callback - The callback function to run when the query is complete
	 * @returns {void} - Runs the callback function
	 */
	function queryResources(resourceObject, callback) {
		//retrieve the query URL from context
		const url = context.links.queryUrl;

		const selectFields = [
			resourceObject.resourceFieldName,
			resourceObject.resourceFieldId,
			resourceObject.folderFieldName,
			resourceObject.tagsFieldName,
			resourceObject.descriptionFieldName,
			resourceObject.sortFieldName,
			resourceObject.selectedFieldName,
		]
			.filter(Boolean)
			.join(',');

		//SOQL Select Statement Fields;
		const select =
			'SELECT+' + selectFields + '+FROM+' + resourceObject.objectName;

		//SOQL Where Clause
		//add additional criteria here as needed, e.g. Active=true, etc.
		const where = resourceObject.additionalCriteria
			? '+WHERE+' + resourceObject.additionalCriteria
			: '';

		//SOQL query
		const query = select + where;

		//final URL for GET
		const finalUrl = url + '?q=' + query;

		//build settings object for Ajax call to Salesforce
		const settings = {};
		settings.client = client;
		settings.contentType = 'application/json';
		settings.success = function (data) {
			callback(data, resourceObject);
		};

		//Use canvas function to query
		globals.Sfdc.canvas.client.ajax(finalUrl, settings);
	}

	//helper functions

	/**
	 * @description Builds an array of folders from the data returned from the SOQL query
	 * @param {object} data - The data returned from the SOQL query
	 * @param {Array<string>} folders - The array of folders to add to the list
	 * @param {string} fieldName - The name of the field to use for the folder name
	 * @returns {Array<string>} - The array of folders
	 */
	function buildFolders(data, folders, fieldName) {
		const records = data.payload.records;
		const hash = {};
		const result = folders || [];

		result.forEach(function (folder) {
			hash[folder] = true;
		});

		records.forEach(function (record) {
			//handle related fields
			const recordValue = getFieldValue(record, fieldName);
			let categories;
			if (recordValue) {
				categories = recordValue.split(';');
			} else {
				categories = inputs.noFolderLabel ? [inputs.noFolderLabel] : [];
			}
			categories.forEach(function (category) {
				const thisResult = addFolder(hash, category);
				if (thisResult) {
					result.push(thisResult);
				}
			});
		});

		return result;

		/**
		 * Adds a folder to the hash
		 * @param {object} hash - The hash of folders
		 * @param {string} name - The name of the folder
		 * @returns {string | false} - The name of the folder if it was added, false if it already exists
		 */
		function addFolder(hash, name) {
			if (!hash[name]) {
				hash[name] = true;
				return name;
			} else {
				return false;
			}
		}
	}

	/**
	 *
	 * @param {object} record - The record returned from the SOQL query
	 * @param {object} resourceObject - The resource object specified in the inputs
	 * @param {object} [folder] - The folder object that this resource should be added to
	 * @returns {object} - DayBack Filter Field Object
	 */
	function createResource(record, resourceObject, folder) {
		const newResource = {};
		const name = getFieldValue(record, resourceObject.resourceFieldName);
		const shortName = getFieldValue(
			record,
			resourceObject.resourceShortNameFieldName
		);
		const id = getFieldValue(record, resourceObject.resourceFieldId);
		const selected = getFieldValue(
			record,
			resourceObject.selectedFieldName
		);
		const tags = getFieldValue(record, resourceObject.tagsFieldName);
		const description = getFieldValue(
			record,
			resourceObject.descriptionFieldName
		);
		const sort = getFieldValue(record, resourceObject.sortFieldName);

		newResource.name = name;
		newResource.color = 'rgba(244, 244, 244, 0.85)';

		if (folder) {
			newResource.folderID = folder.folderID;
			newResource.folderName = folder.folderName;
		}
		newResource.id = id || name;
		newResource.nameSafe = name;
		newResource.shortName = shortName ? shortName : name;
		newResource.status = {
			folderExpanded: false,
			selected: typeof selected === 'undefined' ? false : !!selected,
		};
		newResource.description = description;
		newResource.sort = sort || (folder ? folder.sort + 1 : 0);

		if (tags) {
			newResource.tags = [];
			tags.split(',').forEach(function (tag) {
				if (tag && tag !== '') {
					newResource.tags.push({name: tag});
				}
			});
		}
		return globals.dbk.mutateFilterField(newResource);
	}

	/**
	 * creates folder and it's required attributes in the object
	 * @param {string} folderName
	 * @returns {object} - DayBack Filter Field Object
	 */
	function createFolder(folderName) {
		const folder = {};
		folder.id = folderName;
		folder.folderID = folderName;
		folder.name = folderName;
		folder.folderName = folderName;
		folder.id = folder.folderID;
		folder.color = 'rgba(244, 244, 244, 0.85)';
		folder.nameSafe = folderName;
		folder.isFolder = true;
		folder.sort = resourceCount;
		return globals.dbk.mutateFilterField(folder);
	}

	/**
	 * Gets a field value from a record returned from a SOQL query
	 * This will allow you to get values from related fields
	 * @param {object} record - The record returned from the SOQL query
	 * @param {string} fieldName
	 * @returns {string}
	 */
	function getFieldValue(record, fieldName) {
		if (!fieldName) {
			return '';
		}
		const splitField = fieldName.split('.');
		const firstLevel = splitField[0];
		if (splitField.length === 1) {
			//not a related field
			return record[firstLevel] ? record[firstLevel] : '';
		} else {
			const levelCount = splitField.length - 1;
			const string = JSON.stringify(record[firstLevel]);
			const levelTest = (string.match(/attributes/g) || []).length;
			let value = record;
			if (levelCount === levelTest) {
				//drill for related field
				for (let i = 0; i < splitField.length; i++) {
					value = value[splitField[i]];
				}
				return value;
			} else {
				return '';
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
