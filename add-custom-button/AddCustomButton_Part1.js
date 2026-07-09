// Add Custom Button - Part 1 v2.0
//
// Name: Add Custom Button - Button Tray Registry
// Type: App Action
// Trigger: On Startup
// Prevent Default Action: No

// Purpose:
// Adds one or more custom floating buttons to DayBack's bottom-right corner.
// Configure your buttons in the Configuration section below by editing the
// inputs.buttonList array. Advanced users can also dynamically register/unregister
// buttons from other actions using the customButtonTray registry API.

// More info on custom actions: https://docs.dayback.com/article/140-custom-app-actions

// @ts-check - Type checking with JSDoc (Remove this line to disable)

(() => {
	// Declare global imports
	// prettier-ignore

	const options = {};
	const inputs = {};

	try {
		//----------- Configuration -------------------

		/**
		 * Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)
		 * @type {number}
		 */
		options.runTimeout = 0;

		/**
		 * Array of account emails for whom this action will run. Leave blank to allow the action to run for everyone.
		 * @type {Array<string>}
		 */
		options.restrictedToAccounts = [];

		// CSS class group name for the button container
		// If creating multiple button groups, define a unique cssGroupName for each
		// and modify the CSS to position multiple groups on screen

		options.cssGroupName = 'custom_btn';

		// Defines the current account name running this action

		inputs.accountName = seedcodeCalendar.get('config').accountName;

		// Show a parent button that acts like a container drawer for multiple grouped buttons
		// Set to false if you want buttons always visible with no drawer
		// Set to true for a collapsible drawer (recommended for 2+ buttons)
		//
		// NOTE: This is automatically ignored (treated as false) whenever only one
		// button is currently registered/visible — the drawer chrome isn't relevant
		// for a single button. Can be changed at runtime via tray.setContainerPreference().

		inputs.showContainer = true;

		// If showing button container drawer, specify if it should start open or closed
		// Can be changed at runtime via tray.setContainerPreference().

		inputs.showContainerAsOpen = true;

		// Define Your Buttons
		// -------------------
		//
		// Create an array of button objects. Each button can have these properties:
		//
		//   * uniqueId (string, REQUIRED):
		//      Unique identifier for this button. Used as the registry key and DOM element id.
		//
		//   * icon (string, REQUIRED):
		//      Font Awesome 4.7 icon class. Specify as 'fa-' + icon name.
		//      Find icons at: https://fontawesome.com/v4.7/icons/
		//      Examples: 'fa-comment', 'fa-dollar', 'fa-wrench', 'fa-calendar'
		//
		//   * action (function, REQUIRED):
		//      JavaScript function that runs when the button is clicked.
		//      Can call helper functions defined below or inline code.
		//
		//   label (string or function, optional):
		//      Text badge next to button. Use a function for dynamic labels.
		//
		//   color (string, optional):
		//      Button background color (hex, rgb, or color name).
		//      Default: #3164d2 (DayBack blue)
		//
		//   restrict (function, optional):
		//      Access control. Return false to hide button from specific users.
		//      Evaluated once when DOM is built.
		//
		//   visibleWhen (function, optional):
		//      Contextual visibility. Return false to hide button in certain views/states.
		//      Re-evaluated on every After Events Rendered cycle.
		//
		//   order (number, optional):
		//      Sort key. Lower numbers appear at bottom of stack.
		//
		//   isExample (boolean, optional):
		//      Marks this button as a bundled example. Buttons with isExample: true
		//      are removed when tray.clearDefaults() is called from another action.
		//      Default: false
		//
		// TOGGLE BUTTONS:
		//   To create a toggle button, add a `toggle` object instead of
		//   `icon`, `label`, `color`, and `action`. A toggle has two states
		//   (off and on), each with its own visual properties and action.
		//
		//   toggle.off (object, REQUIRED for toggles):
		//      Visual state when the button is OFF (default state).
		//      Properties: icon (string), label (string, optional), color (string, optional).
		//
		//   toggle.on (object, REQUIRED for toggles):
		//      Visual state when the button is ON.
		//      Properties: icon (string), label (string, optional), color (string, optional).
		//
		//   toggle.onToggleOn (function, REQUIRED for toggles):
		//      Runs when the button is switched from OFF to ON.
		//
		//   toggle.onToggleOff (function, REQUIRED for toggles):
		//      Runs when the button is switched from ON to OFF.
		//
		//   toggle.defaultState (string, optional):
		//      Initial state: 'off' (default) or 'on'.

		/**
		 * @type {any[]}
		 */
		// ─── Example Buttons (remove or replace these) ───────────────────────
		// These ship as working demos. Delete them and add your own,
		// or leave them alone if using tray.register() from other actions.
		// Buttons marked isExample: true are removed by tray.clearDefaults().

		inputs.buttonList = [
			{
				uniqueId: 'example_contactUs',
				label: 'Example Button: Contact Us',
				icon: 'fa-comment',
				color: '#72009c',
				isExample: true,
				order: 1,
				action() {
					customButtonAction_goToUrl('https://dayback.com/contact/');
				},
			},
			{
				uniqueId: 'Example Button: example_salesWorkflow',
				label: 'Sales Workflow',
				icon: 'fa-dollar',
				color: '#3164d2',
				isExample: true,
				order: 2,
				action() {
					customButtonAction_goToBookmark('1629418383414e4573855796');
				},
				restrict() {
					return restrictButtonAccess('Sales Workflow');
				},
			},
			{
				uniqueId: 'example_serviceWorkflow',
				label: 'Example Button: Service Workflow',
				color: '#ffaa00',
				icon: 'fa-wrench',
				isExample: true,
				order: 3,
				action() {
					customButtonAction_goToBookmark('1629418219611u2501683899');
				},
			},
			//Example toggle button:
			{
				uniqueId: 'example_weekendToggle',
				isExample: true,
				toggle: {
					defaultState: getWeekendToggleDefaultState(),
					off: {
						icon: 'fa-eye-slash',
						label: 'Example Button: Show Weekends',
						color: '#999',
					},
					on: {
						icon: 'fa-eye',
						label: 'Example Button: Hide Weekends',
						color: '#4CAF50',
					},
					onToggleOn() {
						console.log('Toggled ON');
						let config = seedcodeCalendar.get('config');
						config.weekends = true;
						seedcodeCalendar.init('config', config);
						dbk.changeConfigSetting('weekends');
					},
					onToggleOff() {
						console.log('Toggled OFF');
						let config = seedcodeCalendar.get('config');
						config.weekends = false;
						seedcodeCalendar.init('config', config);
						dbk.changeConfigSetting('weekends');
					},
				},
				order: 4,
			},
		];

		//----------- Define Custom Button Helper Functions -----------

		// Get default toggle state for the Weekend toogle button
		function getWeekendToggleDefaultState() {
			const config = seedcodeCalendar.get('config');
			return config.weekends ? 'on' : 'off';
		}

		// Navigate to a DayBack bookmark by ID
		function customButtonAction_goToBookmark(bookmarkID) {
			if (location.hash === '#/') {
				location.hash += `?bookmarkID=${bookmarkID}`;
			} else {
				const regexp = /bookmarkID=(\w+)/i;
				const match = location.hash.match(regexp);
				if (!match) {
					location.hash += `&bookmarkID=${bookmarkID}`;
				} else if (match[1] !== bookmarkID) {
					location.hash = location.hash.replace(
						regexp,
						`bookmarkID=${bookmarkID}`
					);
				}
			}
		}

		// Open a URL in a new browser tab
		function customButtonAction_goToUrl(url) {
			if (!/^https?:\/\//i.test(url)) {
				console.error(
					'customButtonAction_goToUrl: invalid URL protocol'
				);
				return;
			}
			// @ts-ignore
			open(url, '_blank');
		}

		// Check if a button should be shown based on user account
		function restrictButtonAccess(buttonName) {
			// Validate access for specific named buttons
			if (
				buttonName === 'Sales Workflow' &&
				inputs.accountName !== 'John Smith'
			) {
				// Hide Button
				return false;
			}

			// Show button
			return true;
		}

		//----------- Additional Documentation -------------------
		//
		// ADVANCED: Dynamic Button Registration from Other Actions
		// --------------------------------------------------------
		//
		// The button tray is also available as a registry API for advanced use cases where
		// you need to add, remove, or update buttons dynamically from other actions.
		//
		// After this On Startup action runs, you can access the tray from any other action:
		//
		//   const tray = seedcodeCalendar.get('customButtonTray');
		//
		// REGISTRY API METHODS:
		//
		//   tray.register(buttonDef)
		//      Add a button to the tray. Must include uniqueId property.
		//      If a button with the same uniqueId exists, it will be overwritten.
		//      Triggers an automatic DOM rebuild if called after calendar renders.
		//
		//   tray.unregister(uniqueId)
		//      Remove a button by its uniqueId.
		//      Triggers an automatic DOM rebuild if called after calendar renders.
		//
		//   tray.clearDefaults()
		//      Remove all buttons marked with isExample: true.
		//      Returns the number of buttons removed. Safe to call multiple times.
		//      Use this when your action replaces the bundled examples with its own buttons.
		//
		//   tray.clearAll()
		//      Remove all registered buttons regardless of isExample flag.
		//      Returns the number of buttons removed.
		//
		//   tray.getRegistered()
		//      Returns a shallow copy of all currently registered button definitions.
		//      Useful for inspecting what's registered before conditionally clearing.
		//
		//   tray.getToggleState(uniqueId)
		//      Returns 'on', 'off', or null if the button is not a toggle.
		//
		//   tray.setToggleState(uniqueId, state)
		//      Programmatically set a toggle button's state ('on' or 'off').
		//      Runs the appropriate callback and updates the DOM.
		//
		//   tray.getDrawerOpenState()
		//      For showContainer mode, returns true/false for drawer open state.
		//      Returns null when showContainer is disabled (or overridden off, see below).
		//
		//   tray.setDrawerOpenState(isOpen)
		//      For showContainer mode, programmatically open/close the drawer.
		//      Returns true if the state was applied, false otherwise.
		//
		//   tray.setContainerPreference({ showContainer, showContainerAsOpen })
		//      Update the container drawer preference at runtime. Either property may be
		//      omitted to leave it unchanged. Triggers an automatic DOM rebuild if called
		//      after calendar renders.
		//
		//   tray.getEffectiveShowContainer()
		//      Returns the container mode actually being rendered right now. This is the
		//      preference (tray.config.showContainer) automatically forced to false when
		//      only one button is currently registered/visible, since the drawer chrome
		//      is not relevant for a single button.
		//
		//   tray.config
		//      Access the configuration object (cssGroupName, showContainer, showContainerAsOpen).
		//      showContainer/showContainerAsOpen here reflect the raw preference set via
		//      inputs or tray.setContainerPreference() — NOT the effective rendered mode.
		//      Use tray.getEffectiveShowContainer() for the actual rendered mode.
		//
		// USAGE EXAMPLES:
		//
		// Add a button from After Calendar Rendered:
		//
		//   const tray = seedcodeCalendar.get('customButtonTray');
		//   if (tray) {
		//       tray.register({
		//           uniqueId: 'dynamicButton',
		//           icon: 'fa-magic',
		//           label: 'Dynamic',
		//           action() { alert('Dynamic!'); }
		//       });
		//   }
		//
		// Remove a button (e.g., when exiting a mode):
		//
		//   const tray = seedcodeCalendar.get('customButtonTray');
		//   tray.unregister('dynamicButton');
		//
		// Clear bundled examples and register your own:
		//
		//   const tray = seedcodeCalendar.get('customButtonTray');
		//   tray.clearDefaults();
		//   tray.register({
		//       uniqueId: 'myButton',
		//       icon: 'fa-rocket',
		//       label: 'Launch',
		//       action() { /* ... */ }
		//   });
		//
		// Inspect registered buttons and remove unrecognized ones:
		//
		//   const tray = seedcodeCalendar.get('customButtonTray');
		//   const buttons = tray.getRegistered();
		//   buttons.forEach(btn => {
		//       if (!myKnownIds.includes(btn.uniqueId)) {
		//           tray.unregister(btn.uniqueId);
		//       }
		//   });
		//
		// Change the container preference at runtime (e.g., always-visible instead
		// of a collapsible drawer, or start closed instead of open):
		//
		//   const tray = seedcodeCalendar.get('customButtonTray');
		//   tray.setContainerPreference({
		//       showContainer: false,
		//       showContainerAsOpen: false
		//   });
		//
		// Note: showContainer is automatically treated as false whenever only one
		// button is registered/visible, regardless of this preference. Use
		// tray.getEffectiveShowContainer() to check the actual rendered mode.
		//
		//----------- End Additional Documentation -------------------

		//----------- End Configuration -------------------
	} catch (error) {
		// @ts-ignore
		reportError(error);
	}

	//----------- The action itself: place all runtime code inside this function. -------------------

	function run() {
		// --- Configuration ---

		const config = {
			cssGroupName: options.cssGroupName,
			showContainer: inputs.showContainer,
			showContainerAsOpen: inputs.showContainerAsOpen,
		};

		// --- Internal State ---

		const buttonList = inputs.buttonList || [];
		let domReady = false;
		let rebuildTimer = null;

		/** @type {Object<string, 'on'|'off'>} */
		const toggleStates = {};

		// Tracks which label IDs were made visible by hover (so mouseout only
		// hides labels that hover specifically revealed).
		/** @type {Set<string>} */
		const hoverShownLabels = new Set();

		// Initialize toggle default states
		for (let i = 0; i < buttonList.length; i++) {
			const btn = buttonList[i];
			if (btn.toggle) {
				toggleStates[btn.uniqueId] =
					btn.toggle.defaultState === 'on' ? 'on' : 'off';
			}
		}

		// --- Public API ---

		// Register a button in the tray.
		/** @type {(buttonDef: ButtonDefinition) => void} */
		function register(buttonDef) {
			if (!buttonDef || !buttonDef.uniqueId) {
				const errorTitle = 'Button Tray Registration Error';
				const errorMessage = `<p>A button was registered without a required <code>uniqueId</code> property.</p><p>Every button must have a unique <code>uniqueId</code> string as its first property.</p>`;
				utilities.showModal(
					errorTitle,
					errorMessage,
					'error',
					null,
					'OK'
				);
				throw new Error(
					'customButtonTray.register(): buttonDef.uniqueId is required'
				);
			}

			// Check for duplicate
			const existingIndex = findButtonIndex(buttonDef.uniqueId);
			if (existingIndex !== -1) {
				console.warn(
					`customButtonTray: overwriting button with uniqueId "${buttonDef.uniqueId}"`
				);
				buttonList[existingIndex] = buttonDef;
			} else {
				buttonList.push(buttonDef);
			}

			// Initialize toggle state for new toggle buttons
			if (buttonDef.toggle && !(buttonDef.uniqueId in toggleStates)) {
				toggleStates[buttonDef.uniqueId] =
					buttonDef.toggle.defaultState === 'on' ? 'on' : 'off';
			}

			if (domReady) {
				scheduleRebuild();
			}
		}

		// Unregister a button from the tray by its uniqueId.
		/** @type {(uniqueId: string) => void} */
		function unregister(uniqueId) {
			const index = findButtonIndex(uniqueId);
			if (index === -1) {
				return;
			}
			buttonList.splice(index, 1);
			delete toggleStates[uniqueId];

			if (domReady) {
				scheduleRebuild();
			}
		}

		// Remove all buttons marked with isExample: true.
		// Returns the number of buttons removed.
		/** @type {() => number} */
		function clearDefaults() {
			let removed = 0;
			for (let i = buttonList.length - 1; i >= 0; i--) {
				if (buttonList[i].isExample) {
					delete toggleStates[buttonList[i].uniqueId];
					buttonList.splice(i, 1);
					removed++;
				}
			}
			if (removed > 0 && domReady) {
				scheduleRebuild();
			}
			return removed;
		}

		// Remove all registered buttons regardless of isExample flag.
		// Returns the number of buttons removed.
		/** @type {() => number} */
		function clearAll() {
			const removed = buttonList.length;
			buttonList.length = 0;
			for (const key in toggleStates) {
				delete toggleStates[key];
			}
			if (removed > 0 && domReady) {
				scheduleRebuild();
			}
			return removed;
		}

		// Return a shallow copy of all currently registered button definitions.
		/** @type {() => Array<ButtonDefinition>} */
		function getRegistered() {
			return buttonList.map((b) => ({...b}));
		}

		// Update the container drawer preference at runtime. Either property may be
		// omitted to leave it unchanged. Triggers an automatic DOM rebuild.
		/** @type {(prefs: { showContainer?: boolean, showContainerAsOpen?: boolean }) => void} */
		function setContainerPreference(prefs) {
			if (!prefs) {
				return;
			}
			if (typeof prefs.showContainer === 'boolean') {
				config.showContainer = prefs.showContainer;
			}
			if (typeof prefs.showContainerAsOpen === 'boolean') {
				config.showContainerAsOpen = prefs.showContainerAsOpen;
			}
			if (domReady) {
				scheduleRebuild();
			}
		}

		// Returns the container mode actually being rendered: the showContainer
		// preference, forced to false when 1 or fewer buttons are currently
		// registered/visible (the drawer chrome is not relevant for a single button).
		/** @type {() => boolean} */
		function getEffectiveShowContainer() {
			return (
				Boolean(config.showContainer) && getRenderedButtons().length > 1
			);
		}

		// --- Lifecycle Delegates ---

		const appActions = {
			// Called by the BCR thin delegate. Builds the button tray DOM.
			/** @type {(params: { action: Object }) => void} */
			beforeCalendarRendered(params) {
				dbk.observe({
					name: 'customButtonTray-waitForContainer',
					watch: 'body',
					until: '.calendar-button-container',
					whenFoundStopObserving: true,
					whenFoundStopProcessing: true,
					then(observer) {
						createButtonDrawer(observer.foundNode);
						domReady = true;
					},
				});
			},

			// Called by the AER thin delegate. Manages visibility and analytics offset.
			/** @type {(params: { action: Object }) => void} */
			afterEventsRendered(params) {
				const calendarView = seedcodeCalendar.get('view');
				const buttonContainer = document.getElementById(
					`${config.cssGroupName}_containerId`
				);

				if (buttonContainer) {
					// Evaluate visibleWhen for each button
					evaluateVisibility(calendarView);

					// Adjust position relative to analytics bar
					toggleButtonsWithAnalytics(buttonContainer, calendarView);
				}
			},
		};

		// --- DOM Construction ---

		// Build the full button drawer DOM inside the given root container.
		// Pass skipAutoOpen=true from rebuildDOM to prevent a double-toggle.
		/** @type {(rootBtnContainer: Element, skipAutoOpen?: boolean) => void} */
		function createButtonDrawer(rootBtnContainer, skipAutoOpen) {
			const cssGroupName = config.cssGroupName;

			// Clear hover state — label elements are about to be recreated.
			hoverShownLabels.clear();

			// Remove existing container if present (rebuild scenario)
			const existingContainer = document.getElementById(
				`${cssGroupName}_containerId`
			);
			if (existingContainer) {
				existingContainer.remove();
			}

			// Get sorted, filtered button list
			const buttons = getRenderedButtons();

			if (buttons.length === 0) {
				return;
			}

			// Resolve the effective container mode for this build (may override
			// the raw preference when only one button is registered/visible).
			const showContainer = getEffectiveShowContainer();

			// Add Drawer Container
			const drawerBtnContainer = document.createElement('div');
			drawerBtnContainer.id = `${cssGroupName}_containerId`;
			drawerBtnContainer.className = showContainer
				? `${cssGroupName}_container`
				: `${cssGroupName}_container_static`;
			drawerBtnContainer.style.cursor = 'pointer';

			// Add Drawer Button (toggle icon for container mode)
			const drawerBtn = document.createElement('div');
			drawerBtn.id = `${cssGroupName}Icon`;
			drawerBtn.dataset.rotatedFlag = '0';
			drawerBtn.className = `${cssGroupName} ${cssGroupName}_icon_holder`;
			drawerBtn.onclick = () => {
				drawerButtonClick(buttons);
			};

			// Add Drawer Button Icon
			const drawerBtnI = document.createElement('i');
			drawerBtnI.id = `${cssGroupName}IconClass`;
			drawerBtnI.className = 'fa';

			// Build button list element
			const drawerBtnUlList = document.createElement('ul');
			drawerBtnUlList.id = `${cssGroupName}IconOptionList`;

			if (showContainer) {
				// Container mode: icon + collapsible list
				drawerBtn.append(drawerBtnI);
				drawerBtnContainer.append(drawerBtn);
				drawerBtnUlList.className = `${cssGroupName}_options ${cssGroupName}_option_hidden`;
			} else {
				// Static mode: always-visible list
				drawerBtnUlList.className = `${cssGroupName}_options_static`;
			}

			// Build buttons from bottom to top
			for (let i = buttons.length - 1; i >= 0; i--) {
				const bObj = buttons[i];
				const btnLi = document.createElement('li');
				const btnLi_span = document.createElement('span');
				const btnLi_contDiv = document.createElement('div');
				const btnLi_div = document.createElement('div');
				const btnLi_i = document.createElement('i');
				const labelId = `${cssGroupName}_IconLabel_${bObj.uniqueId}`;
				const labelText = resolveLabel(bObj);

				btnLi_div.id = `${cssGroupName}_IconDiv_${bObj.uniqueId}`;
				btnLi.className = showContainer
					? `${cssGroupName}_options_li`
					: `${cssGroupName}_options_li_static`;

				// Set the uniqueId as the DOM element id
				btnLi.id = bObj.uniqueId;

				// For toggle buttons, use state-aware visuals
				const visuals = bObj.toggle ? resolveButtonVisuals(bObj) : null;
				const effectiveColor = visuals ? visuals.color : bObj.color;
				const effectiveIcon = visuals ? visuals.icon : bObj.icon;
				const effectiveLabel = visuals ? visuals.label : labelText;

				if (effectiveColor) {
					btnLi_div.style.background = effectiveColor;
				}

				if (effectiveLabel !== null) {
					btnLi_span.id = labelId;

					if (showContainer) {
						btnLi_span.innerText = effectiveLabel;
						btnLi_span.className = `${cssGroupName}_label `;
						btnLi_contDiv.className = `${cssGroupName}_sub_icon_container`;
						btnLi_div.className = `${cssGroupName}_sub_icon_holder`;
						btnLi_i.className = `fa ${effectiveIcon}`;

						// Mouseover handling for dynamic label show/hide in container mode
						btnLi_div.addEventListener(
							'mouseover',
							((l_id, btn) => () => {
								const currentLabel = btn.toggle
									? resolveButtonVisuals(btn).label || ''
									: resolveLabel(btn) || '';
								toggleLabelDynamic(
									l_id,
									currentLabel,
									drawerBtn
								);
							})(labelId, bObj),
							false
						);
						btnLi_div.addEventListener(
							'mouseout',
							((l_id) => () => {
								toggleLabelDynamic(l_id, '', drawerBtn);
							})(labelId),
							false
						);
					} else {
						btnLi_span.className = `${cssGroupName}_label_locked `;
						btnLi_contDiv.className = `${cssGroupName}_sub_icon_container_static`;
						btnLi_div.className = `${cssGroupName}_sub_icon_holder_static`;
						btnLi_i.className = `fa ${effectiveIcon}`;

						btnLi_div.addEventListener(
							'mouseover',
							((l_id, btn) => () => {
								const currentLabel = btn.toggle
									? resolveButtonVisuals(btn).label || ''
									: resolveLabel(btn) || '';
								toggleLabel(l_id, currentLabel);
							})(labelId, bObj),
							false
						);
						btnLi_div.addEventListener(
							'mouseout',
							((l_id) => () => {
								toggleLabel(l_id, '');
							})(labelId),
							false
						);
					}
				} else {
					// No label — still need icon classes
					if (showContainer) {
						btnLi_contDiv.className = `${cssGroupName}_sub_icon_container`;
						btnLi_div.className = `${cssGroupName}_sub_icon_holder`;
					} else {
						btnLi_contDiv.className = `${cssGroupName}_sub_icon_container_static`;
						btnLi_div.className = `${cssGroupName}_sub_icon_holder_static`;
					}
					btnLi_i.className = `fa ${effectiveIcon}`;
				}

				// Add Button click listener with error boundary
				if (bObj.toggle) {
					// Toggle button: flip state, update DOM, run callback
					btnLi_div.addEventListener(
						'click',
						((btn) => () => {
							try {
								handleToggleClick(btn);
							} catch (err) {
								console.error(
									`Toggle "${btn.uniqueId}" action error:`,
									err
								);
							}
						})(bObj),
						false
					);
				} else {
					// Standard button: fire action
					btnLi_div.addEventListener(
						'click',
						((btn) => () => {
							try {
								btn.action();
							} catch (err) {
								console.error(
									`Button "${btn.uniqueId}" action error:`,
									err
								);
							}
						})(bObj),
						false
					);
				}

				// Assemble button DOM
				btnLi_div.append(btnLi_i);
				if (effectiveLabel !== null) {
					btnLi.append(btnLi_span);
				}
				btnLi_contDiv.append(btnLi_div);
				btnLi.append(btnLi_contDiv);
				drawerBtnUlList.append(btnLi);
			}

			// Append button list to final container
			drawerBtnContainer.append(drawerBtnUlList);
			rootBtnContainer.append(drawerBtnContainer);

			// Open the drawer if configured to start open
			// (Skipped when called from rebuildDOM, which manages state itself)
			if (!skipAutoOpen && showContainer && config.showContainerAsOpen) {
				restoreDrawerOpenState(buttons);
			}
		}

		// --- Sorting & Filtering ---

		// Returns buttons filtered by restrict() and sorted by order then registration order.
		/** @type {() => Array<ButtonDefinition>} */
		function getRenderedButtons() {
			// Filter by restrict
			const filtered = [];
			for (let i = 0; i < buttonList.length; i++) {
				const btn = buttonList[i];
				if (
					typeof btn.restrict === 'function' &&
					btn.restrict() === false
				) {
					continue;
				}
				filtered.push(btn);
			}

			// Stable sort: buttons with order first (ascending), then by registration order
			filtered.sort((a, b) => {
				const aHasOrder = typeof a.order === 'number';
				const bHasOrder = typeof b.order === 'number';

				if (aHasOrder && bHasOrder) {
					return a.order - b.order;
				}
				if (aHasOrder && !bHasOrder) {
					return -1;
				}
				if (!aHasOrder && bHasOrder) {
					return 1;
				}
				// Both without order: preserve registration order (stable sort)
				return 0;
			});

			return filtered;
		}

		// --- Toggle Helpers ---

		// Get the current visual properties for a button, accounting for toggle state.
		/** @type {(bObj: ButtonDefinition) => { icon: string, label: string|null, color: string|null }} */
		function resolveButtonVisuals(bObj) {
			if (bObj.toggle) {
				const state = toggleStates[bObj.uniqueId] || 'off';
				const stateConfig = bObj.toggle[state] || bObj.toggle.off;
				return {
					icon: stateConfig.icon || 'fa-circle',
					label:
						typeof stateConfig.label === 'string'
							? stateConfig.label
							: null,
					color: stateConfig.color || null,
				};
			}
			return {
				icon: bObj.icon,
				label: resolveLabel(bObj),
				color: bObj.color || null,
			};
		}

		// Update the DOM for a toggle button after state change.
		/** @type {(bObj: ButtonDefinition) => void} */
		function applyToggleVisuals(bObj) {
			const cssGroupName = config.cssGroupName;
			const visuals = resolveButtonVisuals(bObj);

			// Update icon
			const iconDiv = document.getElementById(
				`${cssGroupName}_IconDiv_${bObj.uniqueId}`
			);
			if (iconDiv) {
				const iconEl = iconDiv.querySelector('i');
				if (iconEl) {
					iconEl.className = `fa ${visuals.icon}`;
				}
				// Update color
				if (visuals.color) {
					iconDiv.style.background = visuals.color;
				}
			}

			// Update label
			const labelEl = document.getElementById(
				`${cssGroupName}_IconLabel_${bObj.uniqueId}`
			);
			if (labelEl && visuals.label !== null) {
				labelEl.innerText = visuals.label;
			}
		}

		// Handle a toggle button click: flip state, update DOM, run callback.
		/** @type {(bObj: ButtonDefinition) => void} */
		function handleToggleClick(bObj) {
			const currentState = toggleStates[bObj.uniqueId] || 'off';
			const newState = currentState === 'off' ? 'on' : 'off';
			toggleStates[bObj.uniqueId] = newState;

			applyToggleVisuals(bObj);

			const callback =
				newState === 'on'
					? bObj.toggle.onToggleOn
					: bObj.toggle.onToggleOff;
			if (typeof callback === 'function') {
				callback();
			}
		}

		// --- Label Helpers ---

		// Resolve the label value (string or function).
		/** @type {(bObj: ButtonDefinition) => string|null} */
		function resolveLabel(bObj) {
			if (typeof bObj.label === 'function') {
				return bObj.label();
			}
			if (typeof bObj.label === 'string') {
				return bObj.label;
			}
			return null;
		}

		// Toggle label text on mouseover/mouseout (static mode).
		/** @type {(labelId: string, labelText: string) => void} */
		function toggleLabel(labelId, labelText) {
			const lObj = document.getElementById(labelId);
			if (!lObj) {
				return;
			}
			lObj.innerText = labelText;
			lObj.classList.toggle(`${config.cssGroupName}_label_div_hover`);
		}

		// Toggle label text on mouseover/mouseout (container/drawer mode).
		// Uses conditional add/remove rather than toggle to avoid a phase-shift
		// bug: if the drawer was opened via drawerButtonClick, labels are already
		// visible. A blind toggle on mouseover would incorrectly hide them, and a
		// missed mouseout (e.g. a modal stealing focus) would leave them hidden
		// permanently, corrupting every subsequent open/close cycle.
		/** @type {(labelId: string, labelText: string, wbIcon: HTMLElement) => void} */
		function toggleLabelDynamic(labelId, labelText, wbIcon) {
			if (wbIcon.dataset.rotatedFlag !== '1') {
				return;
			}
			const lObj = document.getElementById(labelId);
			if (!lObj) {
				return;
			}
			const cssGroupName = config.cssGroupName;
			if (labelText) {
				// mouseover — only show if the label is currently hidden.
				// If already visible (opened via drawerButtonClick), this is a no-op.
				if (lObj.classList.contains(`${cssGroupName}_label_locked`)) {
					lObj.innerText = labelText;
					lObj.classList.remove(`${cssGroupName}_label_locked`);
					hoverShownLabels.add(labelId);
				}
			} else {
				// mouseout — only hide if hover specifically revealed this label.
				// Leaves alone labels that were already visible before hover.
				if (hoverShownLabels.has(labelId)) {
					lObj.innerText = '';
					lObj.classList.add(`${cssGroupName}_label_locked`);
					hoverShownLabels.delete(labelId);
				}
			}
		}

		// --- Drawer Toggle ---

		// Handle drawer toggle click — expand/collapse the button list.
		/** @type {(buttons: Array<ButtonDefinition>) => void} */
		function drawerButtonClick(buttons) {
			const cssGroupName = config.cssGroupName;
			const wbIcon = document.getElementById(`${cssGroupName}Icon`);
			const wbIconOptionList = document.getElementById(
				`${cssGroupName}IconOptionList`
			);

			if (!wbIcon || !wbIconOptionList) {
				return;
			}

			// Toggle drawer open/closed
			if (
				!wbIcon.dataset.rotatedFlag ||
				wbIcon.dataset.rotatedFlag === '0'
			) {
				wbIcon.dataset.rotatedFlag = '1';
				wbIconOptionList.classList.remove(
					`${cssGroupName}_option_hidden`
				);
				wbIcon.className = `${cssGroupName}_locked ${cssGroupName}_icon_holder_lock`;
			} else {
				wbIcon.dataset.rotatedFlag = '0';
				wbIconOptionList.classList.add(`${cssGroupName}_option_hidden`);
				wbIcon.className = `${cssGroupName} ${cssGroupName}_icon_holder`;
			}

			// Update labels for each button
			for (let i = buttons.length - 1; i >= 0; i--) {
				const bObj = buttons[i];
				const labelId = `${cssGroupName}_IconLabel_${bObj.uniqueId}`;
				const lObj = document.getElementById(labelId);

				if (!lObj) {
					continue;
				}

				const labelText = bObj.toggle
					? resolveButtonVisuals(bObj).label
					: resolveLabel(bObj);
				lObj.innerText =
					labelText !== null && lObj.innerText === ''
						? labelText
						: '';

				lObj.classList.toggle(`${cssGroupName}_label_locked`);
			}
		}

		// --- Visibility Evaluation (AER) ---

		// Evaluate visibleWhen for each registered button.
		/** @type {(calendarView: Object) => void} */
		function evaluateVisibility(calendarView) {
			for (let i = 0; i < buttonList.length; i++) {
				const bObj = buttonList[i];
				if (typeof bObj.visibleWhen !== 'function') {
					continue;
				}
				const btnElement = document.getElementById(bObj.uniqueId);
				if (!btnElement) {
					continue;
				}
				btnElement.style.display = bObj.visibleWhen() ? 'flex' : 'none';
			}
		}

		// --- Analytics Offset ---

		// Adjust button container position when analytics bar is hidden (e.g., Month view).
		/** @type {(buttonContainer: HTMLElement, calendarView: Object) => void} */
		function toggleButtonsWithAnalytics(buttonContainer, calendarView) {
			const cssGroupName = config.cssGroupName;
			const toggleClass = buttonContainer.classList.contains(
				`${cssGroupName}_container_static`
			)
				? `${cssGroupName}_container_no_analytics_static`
				: `${cssGroupName}_container_no_analytics`;

			if (calendarView.name === 'month') {
				buttonContainer.classList.add(toggleClass);
			} else {
				buttonContainer.classList.remove(toggleClass);
			}
		}

		// --- Debounced Rebuild ---

		// Schedule a debounced DOM rebuild. Multiple calls in the same tick
		// produce exactly one rebuild.
		/** @type {() => void} */
		function scheduleRebuild() {
			if (rebuildTimer) {
				clearTimeout(rebuildTimer);
			}
			rebuildTimer = setTimeout(() => {
				rebuildTimer = null;
				rebuildDOM();
			}, 0);
		}

		// Tear down and rebuild the button tray DOM, preserving drawer state.
		/** @type {() => void} */
		function rebuildDOM() {
			const rootBtnContainer = document.querySelector(
				'.calendar-button-container'
			);
			if (!rootBtnContainer) {
				return;
			}

			// Preserve drawer state before teardown
			let wasOpen = false;
			const wbIcon = document.getElementById(
				`${config.cssGroupName}Icon`
			);
			if (wbIcon && wbIcon.dataset.rotatedFlag === '1') {
				wasOpen = true;
			}

			// Rebuild (skipAutoOpen=true so drawerButtonClick is not called twice)
			createButtonDrawer(rootBtnContainer, true);

			// Restore drawer state
			if (getEffectiveShowContainer() && wasOpen) {
				const buttons = getRenderedButtons();
				// Use direct state restore instead of drawerButtonClick to avoid
				// the label flash: pre-set spans to scale(0) while the list is
				// still hidden, then show the list — no CSS transition fires.
				restoreDrawerOpenState(buttons);
			}
		}

		// Restore the drawer to its open state without triggering a label flash.
		// Pre-sets label spans to the "open resting state" (scale 0, empty) while
		// the list container is still hidden, then makes the list visible.
		/** @type {(buttons: Array<ButtonDefinition>) => void} */
		function restoreDrawerOpenState(buttons) {
			const cssGroupName = config.cssGroupName;
			const wbIcon = document.getElementById(`${cssGroupName}Icon`);
			const wbIconOptionList = document.getElementById(
				`${cssGroupName}IconOptionList`
			);

			if (!wbIcon || !wbIconOptionList) {
				return;
			}

			// 1. Pre-set every label span to the open resting state (scale 0, empty)
			//    while the list is still hidden — no paint occurs, no transition fires.
			for (let i = 0; i < buttons.length; i++) {
				const labelEl = document.getElementById(
					`${cssGroupName}_IconLabel_${buttons[i].uniqueId}`
				);
				if (!labelEl) {
					continue;
				}
				labelEl.innerText = '';
				if (
					!labelEl.classList.contains(`${cssGroupName}_label_locked`)
				) {
					labelEl.classList.add(`${cssGroupName}_label_locked`);
				}
			}

			// 2. Now show the list — labels are already at scale 0, nothing to animate.
			wbIcon.dataset.rotatedFlag = '1';
			wbIconOptionList.classList.remove(`${cssGroupName}_option_hidden`);
			wbIcon.className = `${cssGroupName}_locked ${cssGroupName}_icon_holder_lock`;
		}

		// --- Internal Helpers ---

		// Find a button's index in the internal array by uniqueId.
		// Returns index or -1 if not found.
		/** @type {(uniqueId: string) => number} */
		function findButtonIndex(uniqueId) {
			for (let i = 0; i < buttonList.length; i++) {
				if (buttonList[i].uniqueId === uniqueId) {
					return i;
				}
			}
			return -1;
		}

		// --- Register the customButtonTray object ---

		// Get the current toggle state for a button.
		// Returns 'on', 'off', or null if the button is not a toggle.
		/** @type {(uniqueId: string) => 'on'|'off'|null} */
		function getToggleState(uniqueId) {
			if (uniqueId in toggleStates) {
				return toggleStates[uniqueId];
			}
			return null;
		}

		// Programmatically set a toggle button's state.
		// Runs the appropriate callback and updates the DOM.
		/** @type {(uniqueId: string, state: 'on'|'off') => void} */
		function setToggleState(uniqueId, state) {
			if (!(uniqueId in toggleStates)) {
				console.error(
					`customButtonTray.setToggleState(): "${uniqueId}" is not a toggle button`
				);
				return;
			}
			if (state !== 'on' && state !== 'off') {
				console.error(
					`customButtonTray.setToggleState(): state must be 'on' or 'off'`
				);
				return;
			}
			if (toggleStates[uniqueId] === state) {
				return;
			}

			const index = findButtonIndex(uniqueId);
			if (index === -1) {
				return;
			}
			const bObj = buttonList[index];
			toggleStates[uniqueId] = state;

			if (domReady) {
				applyToggleVisuals(bObj);
			}

			const callback =
				state === 'on'
					? bObj.toggle.onToggleOn
					: bObj.toggle.onToggleOff;
			if (typeof callback === 'function') {
				callback();
			}
		}

		// Get drawer open state for container mode.
		// Returns true/false, or null when showContainer is disabled (or overridden
		// off because only one button is currently registered/visible).
		/** @type {() => boolean|null} */
		function getDrawerOpenState() {
			if (!getEffectiveShowContainer()) {
				return null;
			}

			const wbIcon = document.getElementById(
				`${config.cssGroupName}Icon`
			);
			if (!wbIcon) {
				return false;
			}

			return wbIcon.dataset.rotatedFlag === '1';
		}

		// Set drawer open/closed state for container mode.
		// Returns true if the state was applied, false otherwise.
		/** @type {(isOpen: boolean) => boolean} */
		function setDrawerOpenState(isOpen) {
			if (!getEffectiveShowContainer()) {
				return false;
			}

			const cssGroupName = config.cssGroupName;
			const wbIcon = document.getElementById(`${cssGroupName}Icon`);
			const wbIconOptionList = document.getElementById(
				`${cssGroupName}IconOptionList`
			);
			const buttons = getRenderedButtons();

			if (!wbIcon || !wbIconOptionList || buttons.length === 0) {
				return false;
			}

			if (isOpen) {
				restoreDrawerOpenState(buttons);
				return true;
			}

			wbIcon.dataset.rotatedFlag = '0';
			wbIconOptionList.classList.add(`${cssGroupName}_option_hidden`);
			wbIcon.className = `${cssGroupName} ${cssGroupName}_icon_holder`;

			for (let i = 0; i < buttons.length; i++) {
				const labelEl = document.getElementById(
					`${cssGroupName}_IconLabel_${buttons[i].uniqueId}`
				);
				if (!labelEl) {
					continue;
				}
				labelEl.innerText = '';
				labelEl.classList.remove(`${cssGroupName}_label_locked`);
			}

			return true;
		}

		const customButtonTray = {
			register,
			unregister,
			clearDefaults,
			clearAll,
			getRegistered,
			getToggleState,
			setToggleState,
			getDrawerOpenState,
			setDrawerOpenState,
			setContainerPreference,
			getEffectiveShowContainer,
			config,
			appActions,
		};

		seedcodeCalendar.init('customButtonTray', customButtonTray);
	}

	//----------- Run function wrapper and helpers - you shouldn't need to edit below this line. -------------------

	/**
	 * @typedef {Object} ToggleStateConfig
	 * @property {string} icon - Font Awesome 4.7 class for this state.
	 * @property {string} [label] - Label text for this state.
	 * @property {string} [color] - Button background color for this state.
	 */

	/**
	 * @typedef {Object} ToggleConfig
	 * @property {ToggleStateConfig} off - Visual properties when OFF.
	 * @property {ToggleStateConfig} on - Visual properties when ON.
	 * @property {function} onToggleOn - Callback when switched to ON.
	 * @property {function} onToggleOff - Callback when switched to OFF.
	 * @property {'on'|'off'} [defaultState] - Initial state. Defaults to 'off'.
	 */

	/**
	 * @typedef {Object} ButtonDefinition
	 * @property {string} uniqueId - Required. Registry key and DOM element id.
	 * @property {string} [icon] - Font Awesome 4.7 class. Required for standard buttons.
	 * @property {function} [action] - Click handler. Required for standard buttons.
	 * @property {string|function} [label] - Text badge. String or function returning string.
	 * @property {string} [color] - CSS color for button background.
	 * @property {boolean} [isExample] - Marks as bundled example. Removed by tray.clearDefaults().
	 * @property {ToggleConfig} [toggle] - Toggle config. When present, replaces icon/label/color/action.
	 * @property {function} [restrict] - Access control. Return false to exclude from DOM.
	 * @property {function} [visibleWhen] - View/state visibility. Return false to hide.
	 * @property {number} [order] - Sort key. Lower = bottom of stack.
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
		reportError(error);
	}

	// Run confirm callback when preventDefault is true. Used for async actions
	function confirmCallback() {
		cancelTimeoutCheck();
		if (action.callbacks.confirm) {
			action.callbacks.confirm();
		}
	}

	// Run cancel callback when preventDefault is true. Used for async actions
	function cancelCallback() {
		cancelTimeoutCheck();
		if (action.callbacks.cancel) {
			action.callbacks.cancel();
		}
	}

	// Check if the action has run within the specified time limit when preventDefault is enabled
	function timeoutCheck() {
		timeout = setTimeout(
			() => {
				/** @type {ActionError} */
				const error = {
					name: 'Timeout',
					message:
						'The action was unable to execute within the allotted time and has been stopped',
				};
				reportError(error, true);
			},
			options && options.runTimeout ? options.runTimeout * 1000 : 0
		);
	}

	function cancelTimeoutCheck() {
		if (timeout) {
			clearTimeout(timeout);
		}
	}

	// Function to report any errors that occur when running this action
	/**
	 * @param {ActionError} error
	 * @param {boolean} [isFatal]
	 */
	function reportError(error, isFatal) {
		const errorTitle = 'Error Running Custom Action';
		const errorMessage = `<p>There was a problem running the action "<span style="white-space: nowrap">${action.name}</span>"</p><p>Error: ${error.message}.</p><p>This may result in unexpected behavior of the calendar.</p>`;
		if (action.preventDefault && action.category !== 'event' && timeout) {
			confirmCallback();
		} else {
			cancelCallback();
		}

		setTimeout(() => {
			utilities.showModal(errorTitle, errorMessage, 'error', null, 'OK');
		}, 1000);
	}
})();
