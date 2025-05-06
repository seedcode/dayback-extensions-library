// Load Resources From Objects - Salesforce v1.3

// Purpose:
// Loads resources in DayBack from Salesforce objects
// Action Type: On Resources Fetched
// Prevent Default Action: Yes

// More info on custom App Actions here:
// https://docs.dayback.com/article/140-custom-app-actions

// @ts-check - Type checking with JSDoc (Remove this line to disable)

(() => {
	// Declare global imports
	// prettier-ignore
	// @ts-ignore
	const globals = {action, dbk, seedcodeCalendar, utilities, fbk, Sfdc};

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
		inputs.account = globals.globals.seedcodeCalendar.get('config').account;

		//define object and fields for resource folders
		//multiple objects can be defined by adding to the array
		inputs.resourceObjects = [
			{
				objectName: 'User',
				resourceFieldName: 'Name',
				resourceFieldId: 'Id',
				folderFieldName: 'Title',
				tagsFieldName: 'Tags__c',
				descriptionFieldName: 'Description__c',
				sortFieldName: 'Sort__c',
				selectedFieldName: 'Selected__c',
				additionalCriteria: 'IsActive+=+true',
			},
			{
				objectName: 'Vehicle__c',
				resourceFieldName: 'Name',
				resourceFieldId: 'Id',
				folderFieldName: 'Folder__c',
				tagsFieldName: 'Tags__c',
				descriptionFieldName: 'Description__c',
				sortFieldName: 'Sort__c',
			},
		];

		//Specify the folder name for resources with no specified folder
		//Set this value to null to have these resources show up outside any folder
		inputs.noFolderLabel = 'No Folder';

		//----------- End Configuration -------------------
	} catch (error) {
		reportError(error);
	}

	//----------- The action itself: you may not need to edit this. -------------------

	// Action code goes inside this function
	function run() {
		var folders;
		var addedFolders = [];
		var processedRequests = 0;
		var resourceCount = 0;

		//retrieve our canvas client object for authentication
		var client = globals.fbk.client();

		//retrieve our canvas context object for REST links/urls
		var context = globals.fbk.context();

		//create new array to overwrite resources
		var resources = [];
		globals.seedcodeCalendar.init('resources', resources);

		//add none resource
		resources.push(
			createResource(globals.seedcodeCalendar.get('config').noFilterLabel)
		);
		resourceCount++;

		//loop through each resource object
		inputs.resourceObjects.forEach(function (resourceObject) {
			queryResources(resourceObject);
		});

		//callback for ajax call
		function processResult(data, resourceObject) {
			if (data.status == 200) {
				//build array pf folder names
				folders = buildFolders(
					data,
					folders,
					resourceObject.folderFieldName
				);
				var folderIndex = {};

				var records = data.payload.records;
				var resource;
				var category;

				//create folders
				folders.forEach(function (folder) {
					if (!addedFolders.includes(folder)) {
						addedFolders.push(folder);
						folder = createFolder(folder);
						folderIndex[folder.folderName] = folder;
						resources.push(folder);
						resourceCount++;
					}
				});

				//create resources
				records.forEach(function (record) {
					var folderName = getFieldValue(
						record,
						resourceObject.folderFieldName
					);
					if (!folderName) {
						category = inputs.noFolderLabel;
					} else {
						category = folderName;
					}
					var categories = category
						? category.split(';')
						: [category];
					categories.forEach(function (thisCateogry) {
						resource = createResource(
							getFieldValue(
								record,
								resourceObject.resourceFieldName
							),
							getFieldValue(
								record,
								resourceObject.resourceFieldId
							),
							folderIndex[thisCateogry],
							getFieldValue(
								record,
								resourceObject.selectedFieldName
							),
							getFieldValue(record, resourceObject.tagsFieldName),
							getFieldValue(
								record,
								resourceObject.descriptionFieldName
							),
							getFieldValue(record, resourceObject.sortFieldName)
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

		function queryResources(resourceObject) {
			//retrieve the query URL from context
			var url = context.links.queryUrl;

			var selectFields = [
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
			var select =
				'SELECT+' + selectFields + '+FROM+' + resourceObject.objectName;

			//SOQL Where Clause
			//add additional criteria here as needed, e.g. Active=true, etc.
			var where = resourceObject.additionalCriteria
				? '+WHERE+' + resourceObject.additionalCriteria
				: '';

			//SOQL query
			var query = select + where;

			//final URL for GET
			var finalUrl = url + '?q=' + query;

			//build settings object for Ajax call to Salesforce
			var settings = {};
			settings.client = client;
			settings.contentType = 'application/json';
			settings.success = function (data) {
				processResult(data, resourceObject);
			};

			//Use canvas function to query
			globals.Sfdc.canvas.client.ajax(finalUrl, settings);
		}

		//helper functions

		function buildFolders(data, folders, fieldName) {
			var records = data.payload.records;
			var hash = {};
			var result = folders || [];

			result.forEach(function (folder) {
				hash[folder] = true;
			});

			records.forEach(function (record) {
				//handle related fields
				var recordValue = getFieldValue(record, fieldName);
				var categories;
				if (recordValue) {
					categories = recordValue.split(';');
				} else {
					categories = inputs.noFolderLabel
						? [inputs.noFolderLabel]
						: [];
				}
				categories.forEach(function (category) {
					var thisResult = addFolder(hash, category);
					if (thisResult) {
						result.push(thisResult);
					}
				});
			});

			return result;

			function addFolder(hash, name) {
				if (!hash[name]) {
					hash[name] = true;
					return name;
				} else {
					return false;
				}
			}
		}

		function createResource(
			name,
			id,
			folder,
			selected,
			tags,
			description,
			sort
		) {
			var newResource = {};
			newResource.name = name;
			newResource.color = 'rgba(244, 244, 244, 0.85)';

			if (folder) {
				newResource.folderID = folder.folderID;
				newResource.folderName = folder.folderName;
			}
			newResource.id = id ? id : globals.utilities.generateUID();
			newResource.nameSafe = name;
			newResource.shortName = name;
			newResource.status = {
				folderExpanded: false,
				selected: selected || false,
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

		//creates folder and it's required attributes in the object
		function createFolder(folderName) {
			var folder = {};
			folder.folderID = globals.utilities.generateUID();
			folder.name = folderName;
			folder.folderName = folderName;
			folder.id = folder.folderID;
			folder.color = 'rgba(244, 244, 244, 0.85)';
			folder.nameSafe = folderName;
			folder.isFolder = true;
			folder.sort = resourceCount;
			folder.status = {
				folderExpanded: false,
				selected: false,
			};
			return globals.dbk.mutateFilterField(folder);
		}

		function getFieldValue(record, fieldName) {
			if (!fieldName) {
				return '';
			}
			var splitField = fieldName.split('.');
			var firstLevel = splitField[0];
			if (splitField.length === 1) {
				//not a related field
				return record[firstLevel] ? record[firstLevel] : '';
			} else {
				var levelCount = splitField.length - 1;
				var string = JSON.stringify(record[firstLevel]);
				var levelTest = (string.match(/attributes/g) || []).length;
				var value = record;
				if (levelCount === levelTest) {
					//drill for related field
					for (var i = 0; i < splitField.length; i++) {
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
			globals.globals.utilities.showModal(
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
