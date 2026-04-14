// Register Zoom Functions v1.0

// Purpose:
// Registers functions that handle authorization, deauthorization, and create, edit, delete meetings from DayBack.
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
		//this is a map with source name: { zoom fields }.
		inputs.zoomFieldsBySource = {
			'Sample Events': {
				zoomLinkField: 'Zoom_Link',
				zoomIdField: 'Zoom_Meeting_Id',
				zoomPasswordField: 'Zoom_Pass',
			},
		};

		/* TO DO: add inputs here for meeting type, meeting service. */

		//----------- End Configuration -------------------
	} catch (error) {
		reportError(error);
	}

	//----------- The action itself: you may not need to edit this. -------------------

	// Action code goes inside this function
	function run() {
		/**
		 * @param {{meetingType: string;action: any;meetingsServiceURL: string | URL;}} config
		 * @param {{titleEdit: any;description: any;}} editEvent
		 * @param {any} changesObject
		 * @param {{origin: string;}} location
		 * @param {any} windowWidth
		 * @param {any} windowHeight
		 * @param {undefined} [windowTop]
		 * @param {undefined} [windowLeft]
		 */
		globals.seedcodeCalendar.init(
			'zoom-fieldsBySource',
			inputs.zoomFieldsBySource
		);

		function SubmitMeetingsAPICall(
			config,
			editEvent,
			changesObject,
			location,
			windowWidth,
			windowHeight,
			windowTop,
			windowLeft
		) {
			globals.dbk.registerFunctionCall('processAuthFM', processAuthFM);
			('use strict');
			let oAuthConfig;
			let oAuthTimeout;
			let processingNotificationDiv;
			let processingNotificationStyle = {
				height: 'auto',
				width: '400px',
				'margin-top': '20%',
			};
			let processingNotificationContentStyle = {
				background: 'rgba(0,0,0,0.75)',
				color: 'white',
			};
			const calendarName = editEvent.schedule.name;
			const zoomFieldsMap = inputs.zoomFieldsBySource[calendarName] || {};
			let zoomLinkFieldId = globals.dbk.getCustomFieldIdByName(
				zoomFieldsMap.zoomLinkField,
				editEvent.schedule
			);

			let zoomIdField = globals.dbk.getCustomFieldIdByName(
				zoomFieldsMap.zoomIdField,
				editEvent.schedule
			);

			let zoomPasswordField = globals.dbk.getCustomFieldIdByName(
				zoomFieldsMap.zoomPasswordField,
				editEvent.schedule
			);
			let sendData = {
				version: 5.0,
				meetingType: config.meetingType,
				redirectURI: location.origin + '/',
				innerWidth: windowWidth,
				innerHeight: windowHeight,
				editEvent: editEvent,
				changesObject: changesObject,
				zoomLinkFieldId: zoomLinkFieldId,
			};

			Process(config.action);

			//Authorize DayBack to connect to the API
			/**
			 * @param {any} callback
			 */
			function AuthorizeAPI(callback) {
				//detect platform - if FM, we will do the auth a little different.
				const platform = globals.utilities.getDBKPlatform();

				if (platform === 'dbkfmjs') {
					//special FileMaker Auth.
					let authURL = oAuthConfig.authWindowInit.src;
					//here we will save the callback so that we can do the right thing when we have completed the auth.
					// can we do it with a promise?

					globals.seedcodeCalendar.init('bir-zoomCallback', callback);

					globals.dbk.performFileMakerScript(
						'Open Auth Window',
						authURL
					);
				} else {
					//regular auth.
					let authWindow;
					let authWindowTop = oAuthConfig.authWindowInit.style.top;
					let authWindowLeft = oAuthConfig.authWindowInit.style.left;

					authWindowTop =
						parseFloat(
							authWindowTop.substring(0, authWindowTop.length - 2)
						) +
						screenY +
						'px';
					authWindowLeft =
						parseFloat(
							authWindowLeft.substring(
								0,
								authWindowLeft.length - 2
							)
						) +
						screenX +
						'px';

					authWindow = open(
						oAuthConfig.authWindowInit.src,
						'_blank',
						'height=' +
							oAuthConfig.authWindowInit.style.height +
							',width=' +
							oAuthConfig.authWindowInit.style.width +
							',top=' +
							authWindowTop +
							',left=' +
							authWindowLeft +
							',toolbar=no,status=no,menubar=no'
					);

					//Start checking for OAuth Result Code
					setTimeout(function () {
						CheckOAuthResult(authWindow, true, true, callback);
					}, 250);
				}
			}

			/**
			 * @param {{ close: () => void; }} authWindow
			 */
			function ClearOAuth(authWindow) {
				clearTimeout(oAuthTimeout);
				authWindow.close();
			}
			//check for Oauth code result in FileMaker specifically, where we have 2 windows processing this.
			/** 
			 @param {string} code
			 */
			function processAuthFM(fmResult) {
				//we handled the auth in FileMaker, and now we might have the code.

				let callback = globals.seedcodeCalendar.get('bir-zoomCallback');
				let code = fmResult?.payload;

				if (fmResult && code && callback) {
					//this is ok

					//we will clear the oAuthURL here, since we have grabbed the variables.
					oAuthConfig.authWindowInit.src = '';

					globals.seedcodeCalendar.init('bir-zoomCallback', null);
					sendData.authCode = code;
					Process(callback);
				} else {
					//something went wrong.
				}
			}

			//Check for the OAuth code result
			/**
			 * @param {any} authWindow
			 * @param {boolean} recheck
			 * @param {boolean} waitForSignin
			 * @param {string} callback
			 */
			function CheckOAuthResult(
				authWindow,
				recheck,
				waitForSignin,
				callback
			) {
				try {
					//User closed auth window. Assume this process has been cancelled
					if (authWindow.window === null) {
						ClearOAuth(authWindow);
						recheck = false;
						return;
					}

					let authWindowParams = authWindow.window.location.search;

					let authRegexMatch = authWindowParams.match(
						new RegExp(oAuthConfig.redirectAuthRegex)
					);
					if (authRegexMatch) {
						recheck = false;
						ClearOAuth(authWindow);

						//Set authorization code and post to take action
						sendData.authCode =
							authRegexMatch[oAuthConfig.redirectAuthIndex];

						Process(callback);
					}
				} catch (e) {
					if (!waitForSignin) {
						//Update temporary OAuth HTML objects with their display style
						Object.assign(
							authWindow.style,
							oAuthConfig.authWindowDisplay
						);
						waitForSignin = true;
					}
				} finally {
					if (recheck) {
						oAuthTimeout = setTimeout(function () {
							CheckOAuthResult(
								authWindow,
								recheck,
								waitForSignin,
								callback
							);
						}, 100);
					}
				}
			}

			/**
			 * @param {string} action
			 */
			function Process(action) {
				let payload;
				let modal;
				let continueFunction = Process;

				//Show notification that the API request is processing
				if (action != 'update' && action != 'eventdelete') {
					showProcessingNotification();
				}

				postToRelay(action, sendData, function (data) {
					//Process response if returns success

					//Clear auth code from sendData
					delete sendData.authCode;

					if (data.payload) {
						payload = data.payload;

						//Update Event details if provided

						if (payload.editEvent) {
							let zoomLink =
								zoomLinkFieldId && payload.joinURL
									? payload.joinURL
									: '';
							let zoomMeetingId =
								zoomIdField && payload.meetingNumber
									? payload.meetingNumber
									: '';
							let zoomMeetingPassword =
								zoomPasswordField && payload.password
									? payload.password
									: '';
							if (zoomLinkFieldId) {
								editEvent[zoomLinkFieldId] = zoomLink;
							}

							if (zoomIdField) {
								editEvent[zoomIdField] = zoomMeetingId;
							}
							if (zoomPasswordField) {
								editEvent[zoomPasswordField] =
									zoomMeetingPassword;
							}

							editEvent.titleEdit = payload.editEvent.titleEdit;
							editEvent.description =
								payload.editEvent.description;

							setTimeout(function () {
								globals.dbk.updateEvent(editEvent, null);
							}, 500);
						}

						//Authorize with meeting API if action required
						if (data.status == 401 && payload.oAuthConfig) {
							oAuthConfig = payload.oAuthConfig;
							continueFunction = AuthorizeAPI;
							sendData.returnPayload = payload.returnPayload;
							if (!payload.modal) {
								continueFunction(payload.callback);
							}
						}

						//Show modal window if provided
						if (payload.modal) {
							modal = payload.modal;
							sendData.returnPayload = payload.returnPayload;

							globals.utilities.showModal(
								modal.title,
								modal.message,
								modal.button1,
								modal.callback1
									? function () {
											continueFunction(modal.callback1);
										}
									: null,
								modal.button2,
								modal.callback2
									? function () {
											continueFunction(modal.callback2);
										}
									: null,
								modal.button3,
								modal.callback3
									? function () {
											continueFunction(modal.callback3);
										}
									: null
							);
						}

						//Open link if provided
						if (payload.openUrl) {
							open(payload.openUrl);
						}
					}

					//Show message if provided
					if (data.message) {
						globals.dbk.showMessage(data.message);
					}
				});
			}

			//Function to simplify posts to the relay file
			/**
			 * @param {string} action
			 * @param {{ version?: number; meetingType?: string; redirectURI?: string; innerWidth?: any; innerHeight?: any; editEvent?: { titleEdit: any; description: any; }; changesObject?: any; action?: any; }} sendData
			 * @param {{ (data: any): void; (arg0: any): void; }} success
			 */
			function postToRelay(action, sendData, success) {
				let resultData;
				let xhttp = new XMLHttpRequest();
				sendData.action = action;
				xhttp.onreadystatechange = function () {
					if (xhttp.readyState == XMLHttpRequest.DONE) {
						//Remove processing notification
						if (processingNotificationDiv) {
							document.body.removeChild(
								processingNotificationDiv
							);
						}

						//Process returned data
						if (xhttp.status == 200 || xhttp.status == 401) {
							try {
								resultData = JSON.parse(xhttp.responseText);
							} catch (error) {
								resultData = xhttp.responseText;
							} finally {
								success(resultData);
							}
						}

						//Log error if the request does not return successful
						else {
							globals.showModal(
								'Error with request to ' + config.meetingType,
								(xhttp.responseText
									? xhttp.responseText.toString()
									: '') +
									(xhttp.error
										? xhttp.error.toString()
										: '') +
									(xhttp.message ? ': ' + xhttp.message : ''),
								'OK',
								null
							);
						}
					}
				};
				xhttp.error = function () {
					//Remove processing notification
					if (processingNotificationDiv) {
						document.body.removeChild(processingNotificationDiv);
					}
					globals.dbk.showMessage(
						'Error processing request: ' +
							xhttp.responseText.toString()
					);
				};
				xhttp.open('POST', config.meetingsServiceURL, true);
				xhttp.withCredentials = true;
				xhttp.setRequestHeader(
					'Content-type',
					'application/json;charset=UTF-8'
				);
				xhttp.send(JSON.stringify(sendData));
			}

			//Function for modal window
			function showProcessingNotification() {
				if (!document.getElementById('processingNotificationDiv')) {
					let headerObject = document.createElement('h4');
					let headerDiv = document.createElement('div');
					let modalContentObject = document.createElement('div');
					let modalMainDiv = document.createElement('div');
					processingNotificationDiv = document.createElement('div');
					processingNotificationDiv.className = 'modal fade in';
					processingNotificationDiv.style.display = 'block';
					modalMainDiv.className = 'modal-dialog';
					Object.assign(
						modalMainDiv.style,
						processingNotificationStyle
					);
					modalContentObject.className = 'modal-content';
					Object.assign(
						modalContentObject.style,
						processingNotificationContentStyle
					);
					headerDiv.className = 'pad-large text-center';
					headerObject.innerText = 'Processing API Request...';
					headerDiv.appendChild(headerObject);
					modalContentObject.appendChild(headerDiv);
					modalMainDiv.appendChild(modalContentObject);
					processingNotificationDiv.appendChild(modalMainDiv);
					processingNotificationDiv.id = 'processingNotificationDiv';
					document.body.appendChild(processingNotificationDiv);
				}
			}
		}

		/**
		 * @param {string} action
		 * @param {{titleEdit: any;description: any;}} editEvent
		 * @param {any} changesObject
		 * @param {{origin: string;}} location
		 * @param {any} innerWidth
		 * @param {any} innerHeight
		 * @param {any} screenY
		 * @param {any} screenX
		 */
		function zoomFunction(
			action,
			editEvent,
			changesObject,
			location,
			innerWidth,
			innerHeight,
			screenY,
			screenX
		) {
			let config = {
				//Specify the meeting type you'd like to interact with here
				//Valid values are: zoom
				meetingType: 'zoom',
				//Valid values are: create, delete, eventdelete, update, start, deauthorize
				action: action,
				meetingsServiceURL: 'https://meetings.dayback.com',
			};
			SubmitMeetingsAPICall(
				config,
				editEvent,
				changesObject,
				location,
				innerWidth,
				innerHeight
			);
		}

		globals.seedcodeCalendar.init('ado-zoomFunction', zoomFunction);

		/* TO DO: register the SubmitMeetingsAPICall function in globals.seedcodeCalendar 
        ---
        */
		/* TO DO: define the inputs of SubmitMeetingsAPICall with typescript headers. 
        ---
        */
		/* TO DO: add the function definition for SubmitMeetingsAPICall with these parameters: 
        config, editEvent, changesObject, location, windowWidth, windowHeight, windowTop, windowLeft, action
        note that 'action' is a new parameter we're adding in for create, edit, and delete, as well as authorize/deauthorize. 
        ---
        use let and const statements instead of var. 
        */
		/* TO DO: define AuthorizeAPI function with callback, platform parameter. Use TS headers. 
        If the platform is FileMaker, we will do a different auth process (leave space for later)
        --
        */
		/* TO DO: define CheckOAuthResult function with authWindow, recheck, waitForSignin, callback, and platform parameters.
       Use TS as headers to define the inputs of this function. 
       --
       */
		/* TO DO: define additional functions, including ClearOAuth, Process etc.  */
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
