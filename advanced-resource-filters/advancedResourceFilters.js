// Advanced Resource Filters - v1.1

// Purpose:

// Creates toggle buttons and multi-select boxes
// of grouped resource tag attributes. Relies on
// the Mutation Observer Code Library to modify
// the sidebar.

// Action Type: Before Calendar Rendered
// Prevent Default Action: No

// More info on custom actions here:
// https://docs.dayback.com/article/140-custom-app-actions

// @ts-check - Type checking with JSDoc (Remove this line to disable)

(() => {
	// Declare global imports
	// @ts-ignore
	const globals = {action, dbk, seedcodeCalendar, utilities, fbk};

	const options = {};
	const inputs = {};

	try {
		//----------- Configuration -------------------

		// Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)

		options.runTimeout = 0;

		// Configure whether resource filters should be moved above Status filters.
		// Set to false if you wish to keep DayBack's default behavior

		inputs.resourceFiltersOnTop = true;

		// Configure whether Calendar should be grayed out if no resources
		// matched criteria

		inputs.noMatchFadesCalendar = true;

		// Tag Buttons
		// -----------
		//
		// Defines a list of Tag Filters which should be displayed as individual filter buttons
		// Each tag can contain several variables. All are required unless otherwise specified:
		//
		//  class (optional)
		//
		//      An optional class ID for this tag if you wish to apply custom styles beyond
		//      a tag color, icon, icon color and border color
		//
		//  color
		//
		//      The color code of the background color for the tag. If no color is specified
		//      the default gray tag color will be used.
		//
		//  icon
		//
		//      This is either a FontAwesome icon name such as fa-pencil, fa-clock-o, etc.,
		//      or it is a URL of an image file that should be used as an icon.
		//      Omitting an icon will just show a text tag.
		//
		//  iconColor
		//
		//      This only applies to FontAwesome icons and can be omitted if using an image
		//      for an icon.
		//
		//  borderColor
		//
		//      This is the border color of the tag when the tag is toggled on.

		inputs.tagFilters = {
			Available: {
				class: 'test',
				color: 'rgb(168, 224, 255)',
				icon: 'fa-clock-o',
				iconColor: 'rgb(52, 0, 244)',
				borderColor: 'rgba(0, 0, 155, 0.5)',
			},
			'Lab Supervisor': {
				class: 'person',
				color: '#FFF4FF',
				icon: 'fa-flask',
				iconColor: '#FF5F1F',
				borderColor: 'rgba(255, 95, 31, 0.8)',
			},
			'Santa Monica': {
				class: 'any',
				color: '#DDFFDD',
				icon: 'https://a.slack-edge.com/production-standard-emoji-assets/14.0/apple-medium/1f334@2x.png',
				borderColor: 'rgba(0,155,0,0.8)',
			},
			Hollywood: {
				class: 'any',
				color: 'rgb(237, 194, 238)',
				icon: 'https://a.slack-edge.com/production-standard-emoji-assets/14.0/apple-medium/2b50@2x.png',
				borderColor: 'rgba(100,0,100,0.5)',
			},
		};

		// Multi-Select Tag Groups
		// -----------------------
		//
		// You may define a group of related tags by specifying a group, followed by an
		// object which defines the list of related tags. For example:
		//
		//      inputs.tagGroups = {
		//             timezone: {},
		//                skill: {},
		//             language: {},
		//      };
		//
		// Each tag group contains three parameters
		//
		//      groupname:
		//
		//          The description of the select box that appears in white font
		//          above the select box itself.
		//
		//      boxtitle:
		//
		//          The instruction to the user describing the contents of the select box.
		//
		//      tags:
		//
		//          An object containing tag codes and the full-text description of what
		//          the tag means. Having a tag code and a full-text description allows
		//          you to explain the tags you've defined for each resource with a more
		//          rich text description.
		//
		//  This example defines a select box of time zones. You would need to specify
		//  the tags: EST, CST, PST, NZST to make use of this feature.
		//
		//      inputs.tagGroups = {
		//          timezone: {
		//              groupname: "Time Zone",
		//              boxtitle: "Select Time Zone",
		//              tags: {
		//                  EST: {
		//                      name: "East Coast",
		//                  },
		//                  CST: {
		//                      name: "Central",
		//                  },
		//                  PST: {
		//                      name: "Pacific",
		//                  },
		//                  NZST: {
		//                      name: "New Zealand",
		//                  }
		//              }
		//          },
		//      };

		inputs.tagGroups = {
			skill: {
				groupname: 'Skill Set',
				boxtitle: 'Select Skill Set',
				tags: {
					'New Patient Intake': {
						name: 'New Patient Intake',
					},
					'Blood Draw': {
						name: 'Blood Draw',
					},
					'Labs Sign-Off': {
						name: 'Labs Sign-Off',
					},
					'Lab Tech 1': {
						name: 'Labs Tech 1',
					},
					'Lab Tech 2': {
						name: 'Labs Level 2',
					},
				},
			},
			language: {
				groupname: 'Language',
				boxtitle: 'Select Language',
				tags: {
					English: {
						name: 'English',
					},
					Spanish: {
						name: 'Spanish',
					},
					Chinese: {
						name: 'Chinese',
					},
					French: {
						name: 'French',
					},
				},
			},
		};

		//----------- End Configuration -------------------
	} catch (error) {
		reportError(error);
	}

	//----------- The action itself: you may not need to edit this. -------------------

	// Action code goes inside this function
	function run() {
		const fullTagList = [];

		// Start New Observer

		globals.dbk.observe({
			name: 'modifySidebar',
			watch: '#sidebar',
			until: '.filters-popover-container resources-filter .filters-resource .header-block',
			then: injectCustomCode,
		});

		if (inputs.noMatchFadesCalendar) {
			globals.dbk.observe({
				name: 'calendarGrayscaler',
				watch: '#sidebar',
				until: '.filters-popover-container resources-filter .filters-resource',
				then: function (observer) {
					const calendarDiv = document.querySelector('.calendar');
					const recList = document.querySelector(
						'.calendarList.resource-list'
					);
					const msg = document.querySelector(
						'.message-dialog.message-show'
					);

					if (calendarDiv) {
						if (!recList || !recList.hasChildNodes()) {
							calendarDiv.classList.add('grayscale');
							if (!msg) {
								globals.dbk.showMessage(
									'No Resources Match Your Filter',
									0,
									1000000
								);
							}
						} else if (
							calendarDiv.classList.contains('grayscale')
						) {
							calendarDiv.classList.remove('grayscale');
							if (msg?.parentElement) {
								msg.parentElement.removeChild(msg);
							}
						}
					}
				},
			});
		}

		confirmCallback();

		function injectCustomCode(observer) {
			// Check if resource filter menu is loaded, and if injectedContainer status
			// if set, inject new filters

			if (
				!observer.foundNode.classList.contains('tag-filters-container')
			) {
				observer.stop();
				observer.foundNode.classList.add('tag-filters-container');

				injectTagFilters(observer.foundNode);

				// Switch resource filters menu position if true
				if (inputs.resourceFiltersOnTop) {
					const menubar = document.querySelector(
						'.filters-popover-container'
					);
					if (menubar && !menubar.classList.contains('reordered')) {
						switchMenu(menubar);
					}
				}

				observer.restart();
			}
		}

		//--------- Function Moves Resource Filters above Status Filters ----------

		function switchMenu(menubar) {
			const mkids = menubar.childNodes;
			menubar.classList.add('reordered');

			moveElementTo(mkids[7], 1);

			function moveElementTo(selected_element, direction) {
				const element_to_move = selected_element,
					td = element_to_move.parentNode;
				if (
					direction === -1 &&
					element_to_move.previousElementSibling
				) {
					td.insertBefore(
						element_to_move,
						element_to_move.previousElementSibling
					);
				} else if (
					direction === 1 &&
					element_to_move.nextElementSibling
				) {
					td.insertBefore(
						element_to_move,
						element_to_move.nextElementSibling.nextElementSibling
					);
				}
			}
		}

		//--------- Function Inserts Tag filters ----------

		function injectTagFilters(container) {
			const /** @type HTMLInputElement | null */ filterBox =
					document.querySelector(
						".filters-resource [ng-model='filterText']"
					);
			const xtimes = document.querySelector(
				'.filters-resource .dbk_icon_times'
			);

			if (filterBox) {
				filterBox.addEventListener('keyup', toggleTagStyles);
			}

			if (xtimes) {
				xtimes.addEventListener('click', function () {
					setTimeout(toggleTagStyles, 50);
				});
			}

			// Add Container classes and garbage collection function for filter multi-select boxes

			container.onclick = function () {
				if (globals.seedcodeCalendar.get('customBoxOpen') != 1) {
					let openBoxes = document.querySelectorAll('.select-items');
					if (openBoxes && openBoxes.length > 0) {
						openBoxes.forEach((box) => {
							box.classList.add('select-hide');
						});
					}
					openBoxes = document.querySelectorAll('.select-selected');
					if (openBoxes && openBoxes.length > 0) {
						openBoxes.forEach((box) => {
							box.classList.remove('select-arrow-active');
						});
					}
					openBoxes = document.querySelectorAll('.tagGroup.expanded');
					if (openBoxes && openBoxes.length > 0) {
						openBoxes.forEach((box) => {
							box.classList.remove('expanded');
						});
					}
				}
			};

			// Define div that stores filters by tag

			const div = document.createElement('DIV');
			div.className = 'header-block-content filters filters-by-tag';

			const tagContainer = document.createElement('DIV');
			tagContainer.className = 'tagContainer';

			// Add individual Tag Pills

			if (inputs.tagFilters) {
				Object.keys(inputs.tagFilters).forEach((tag) => {
					fullTagList.push(tag);

					const filter = inputs.tagFilters[tag];
					const tagSpan = document.createElement('SPAN');
					const tagContent = document.createElement('SPAN');

					tagSpan.className = 'tag tag-' + filter.class;
					tagSpan.style.backgroundColor = filter.color;
					tagSpan.dataset.tagfilter = '1';
					tagSpan.dataset.tagfiltername = tag;
					tagSpan.dataset.tagfilterstatus = '0';
					tagContent.className = 'tag-content';

					if (filter.hasOwnProperty('icon')) {
						let i;
						if (filter.icon.match(/^http/)) {
							i = document.createElement('img');
							i.src = filter.icon;
						} else {
							i = document.createElement('I');
							i.className = 'fa ' + filter.icon;
							i.style.color = filter.iconColor;
						}
						tagContent.appendChild(i);
					}

					const tn = document.createTextNode(' ' + tag);
					tagContent.appendChild(tn);
					tagSpan.appendChild(tagContent);
					tagSpan.onclick = function () {
						toggleFilter(tagSpan);
					};

					// Add to filter list
					tagContainer.appendChild(tagSpan);
				});

				div.appendChild(tagContainer);
				container.appendChild(div);
			}

			// Add Tag multiselects

			if (inputs.tagGroups) {
				Object.keys(inputs.tagGroups).forEach((tagGroupName) => {
					const group = inputs.tagGroups[tagGroupName];

					const tagGroupDiv = document.createElement('DIV');
					const label = document.createElement('DIV');
					const inputGroupDiv = document.createElement('DIV');
					const selectWrapperDiv = document.createElement('DIV');
					// @ts-ignore
					const /** @type HTMLSelectElement */ selectBox =
							document.createElement('SELECT');

					tagGroupDiv.className = 'tagGroup';
					label.className = 'tagGroupLabel';
					label.innerText = group.groupname;
					inputGroupDiv.className = 'input-group';
					selectWrapperDiv.className = 'custom-select';

					selectBox.dataset.tagfiltergroup = tagGroupName;
					selectBox.multiple = true;

					// @ts-ignore
					const /** @type HTMLOptionElement */ oOption =
							document.createElement('OPTION');
					oOption.value = '';
					oOption.innerText = group.boxtitle;
					selectBox.appendChild(oOption);

					Object.keys(group.tags).forEach((tagName) => {
						fullTagList.push(tagName);
						const filter = group.tags[tagName];
						// @ts-ignore
						const /** @type HTMLOptionElement */ oOption =
								document.createElement('OPTION');
						oOption.value = tagName;
						oOption.innerText = filter.name ? filter.name : tagName;
						oOption.dataset.tagfilter = '1';
						oOption.dataset.tagfiltername = tagName;
						oOption.dataset.tagfilterstatus = '0';
						oOption.dataset.tagfiltergroup = tagGroupName;
						selectBox.appendChild(oOption);
					});

					selectWrapperDiv.appendChild(selectBox);
					inputGroupDiv.appendChild(selectWrapperDiv);
					tagGroupDiv.appendChild(label);
					tagGroupDiv.appendChild(inputGroupDiv);

					// Add to filter list
					tagContainer.appendChild(tagGroupDiv);
				});
			}

			toggleTagStyles();

			// ------ Multi Select Creation

			const customSelects =
				document.getElementsByClassName('custom-select');

			for (let i = 0; i < customSelects.length; i++) {
				const selectedItem =
					customSelects[i].getElementsByTagName('select')[0];

				// Create container for the selected item list

				const selectContainer = document.createElement('DIV');
				selectContainer.className = 'select-selected';
				const selectItemsList = document.createElement('DIV');
				selectItemsList.className = 'selectedItemsList';
				selectItemsList.dataset.sbtagfiltergroup =
					selectedItem.dataset.tagfiltergroup;
				selectItemsList.innerText = selectedItem.options[0].innerText;
				selectContainer.appendChild(selectItemsList);
				customSelects[i].appendChild(selectContainer);

				// Create container for list items and attach event handlers
				// to detect when mouse goes out of context

				const itemListContainer = document.createElement('DIV');
				itemListContainer.setAttribute(
					'class',
					'select-items select-hide'
				);
				itemListContainer.addEventListener('mouseenter', function () {
					globals.seedcodeCalendar.init('customBoxOpen', 1);
				});
				itemListContainer.addEventListener('mouseleave', function () {
					globals.seedcodeCalendar.init('customBoxOpen', 0);
				});

				// For each option in the original select element, create a new DIV
				// which will act as an option item

				for (let j = 1; j < selectedItem.length; j++) {
					const optionDiv = document.createElement('DIV');
					optionDiv.innerText = selectedItem.options[j].innerText;
					optionDiv.dataset.sbtagfiltername =
						selectedItem.options[j].value;

					// When an item is clicked, update the original select box
					// while toggling the selected item

					optionDiv.addEventListener('click', function (e) {
						const selectBox =
							this.parentNode?.parentElement?.getElementsByTagName(
								'select'
							)[0];

						if (selectBox) {
							for (let i = 0; i < selectBox.length; i++) {
								if (
									selectBox.options[i].innerText ==
									this.innerText
								) {
									if (selectBox.options[i].selected) {
										selectBox.options[i].selected = false;
									} else {
										selectBox.options[i].selected = true;
									}
									toggleFilter(selectBox.options[i]);
									break;
								}
							}
						}

						globals.seedcodeCalendar.init('customBoxOpen', 1);
					});

					itemListContainer.appendChild(optionDiv);
				}
				customSelects[i].appendChild(itemListContainer);

				// when the select box is clicked, close all select boxes, including the current one
				selectContainer.addEventListener('click', function (e) {
					e.stopPropagation();
					closeAllSelect(this);
					globals.seedcodeCalendar.init('customBoxOpen', 1);
					this.nextElementSibling?.classList.toggle('select-hide');
					this.classList.toggle('select-arrow-active');

					itemListContainer.scrollTop = 0;
					this.parentNode?.parentNode?.parentElement?.classList.toggle(
						'expanded'
					);
				});

				// Add event handlers to monitor mouse movement out of select box
				selectContainer.addEventListener('mouseenter', function () {
					globals.seedcodeCalendar.init('customBoxOpen', 1);
				});
				selectContainer.addEventListener('mouseleave', function () {
					globals.seedcodeCalendar.init('customBoxOpen', 0);
				});
			}

			// Toggle all tags that are on based on preloaded filters
			// and restart the sidebar DOM observer
			toggleTagStyles();

			// **********************************************************
			// Helper functions for select box management
			// **********************************************************

			// Function closes all select boxes that are currently open
			function closeAllSelect(elmnt) {
				const selectArray = [];
				const sItems = document.getElementsByClassName('select-items');
				const sSelected =
					document.getElementsByClassName('select-selected');

				for (let i = 0; i < sSelected.length; i++) {
					if (elmnt == sSelected[i]) {
						selectArray.push(i);
					} else {
						sSelected[i].classList.remove('select-arrow-active');
					}
				}
				for (let i = 0; i < sItems.length; i++) {
					if (selectArray.indexOf(i)) {
						sItems[i].classList.add('select-hide');
						const pNode =
							sItems[i]?.parentNode?.parentNode?.parentElement;
						if (pNode) {
							pNode.classList.remove('expanded');
						}
					}
				}
			}

			// Function toggles filters on and off in response to contents of filter box query
			function toggleFilter(tag) {
				const newquery = [];
				let filterText = filterBox ? filterBox.value.toLowerCase() : '';
				filterText = filterText
					.replace(/\s+$/, '')
					.replace(/^\s+/, '')
					.replace(/\(|\)/, '');
				let query = filterText.split(/\s+(and|or)\s+/i);
				const tagName = tag.dataset.tagfiltername;

				if (query.includes(tagName.toLowerCase())) {
					query = query.filter((e) => e !== tagName.toLowerCase());
				} else {
					if (query.length >= 1) {
						query.push('and');
					}
					query.push(tagName);
				}

				// Recapitalize
				query.forEach((q) => {
					let foundTag = '';

					fullTagList.forEach((t) => {
						if (t.toLowerCase() == q.toLowerCase()) {
							foundTag = t;
						}
					});

					if (foundTag != '') {
						newquery.push(foundTag);
					} else {
						newquery.push(q);
					}
				});

				// Clear query replace original filter value
				let queryText = newquery.length > 0 ? newquery.join(' ') : '';
				queryText = queryText
					.replace(/^ ?(?:and|or) /i, '')
					.replace(/ (?:and|or) ?$/i, '')
					.replace(/ (?:and or|or and) /i, ' and ')
					.replace(/ and and /i, ' and ')
					.replace(/ or or /i, ' or ');
				if (filterBox) {
					filterBox.value = queryText;
					filterBox.focus();
					filterBox.dispatchEvent(new Event('change'));
					filterBox.dispatchEvent(new Event('keyup'));
				}

				toggleTagStyles();
			}

			// Function repaints all tags based on the contents of query
			function toggleTagStyles() {
				let filterText = filterBox ? filterBox.value.toLowerCase() : '';
				filterText = filterText
					.replace(/\s+$/, '')
					.replace(/^\s+/, '')
					.replace(/\(|\)/, '');
				const query = filterText.split(/\s+(and|or)\s+/i);
				const tagElements = document.querySelectorAll(
					'[data-tagfilter="1"]'
				);

				// Grab all filter tags
				// @ts-ignore
				tagElements.forEach((/** @type HTMLInputElement */ tag) => {
					const tagName = tag.dataset.tagfiltername;

					// If the query includes the tag, set the filter status
					if (tagName && query.includes(tagName.toLowerCase())) {
						tag.dataset.tagfilterstatus = '1';
						if (inputs.tagFilters.hasOwnProperty(tagName)) {
							tag.classList.add('active');
							tag.classList.remove('inactive');
							tag.style.borderColor =
								inputs.tagFilters[tagName].borderColor;
						}

						// Handle filter group select boxes
						if (tag.hasAttribute('data-tagfiltergroup')) {
							// @ts-ignore
							tag.selected = true;
							const divList = document.querySelectorAll(
								'[data-sbtagfiltername="' + tagName + '"]'
							);
							if (divList && divList.length > 0) {
								divList.forEach((div) => {
									div.classList.add('item-is-selected');
								});
							}
						}
					} else {
						tag.dataset.tagfilterstatus = '0';
						if (
							tagName &&
							inputs.tagFilters.hasOwnProperty(tagName)
						) {
							tag.style.borderColor = 'transparent';
							tag.classList.remove('active');
							tag.classList.add('inactive');
						} else {
							tag.classList.remove('item-is-selected');
						}

						// Handle filter group select boxes
						if (tag.hasAttribute('data-tagfiltergroup')) {
							// @ts-ignore
							tag.selected = false;
							const divList = document.querySelectorAll(
								'[data-sbtagfiltername="' + tagName + '"]'
							);
							if (divList && divList.length > 0) {
								divList.forEach((div) => {
									div.classList.remove('item-is-selected');
								});
							}
						}
					}
				});

				// Summarize select box lists and change first list item so
				// at it lists all filters which apply to that select box

				const selectBoxes = document.querySelectorAll(
					'select[data-tagfiltergroup]'
				);

				if (selectBoxes && selectBoxes.length > 0) {
					selectBoxes.forEach(
						// @ts-ignore
						(/** @type HTMLSelectElement */ selectBox) => {
							selectBox.dataset.tagfiltergroup;

							const optionsList = [];

							for (let i = 0; i < selectBox.length; i++) {
								if (selectBox.options[i].selected) {
									optionsList.push(
										selectBox.options[i].innerText
									);
								}
							}

							const selectedItems = optionsList.join(', ');
							const /** @type HTMLSelectElement | null */ selectedItemsList =
									document.querySelector(
										'div.selectedItemsList[data-sbtagfiltergroup="' +
											selectBox.dataset.tagfiltergroup +
											'"]'
									);

							if (selectedItemsList) {
								selectedItemsList.innerText = selectedItems;

								if (selectedItems == '') {
									selectedItemsList.classList.add('empty');
									selectedItemsList.innerText =
										inputs.tagGroups[
											selectBox.dataset.tagfiltergroup
										].boxtitle;
								} else {
									selectedItemsList.classList.remove('empty');
									selectedItemsList.innerText = selectedItems;
								}
							}
						}
					);
				}
			} // End Toogle styles
		} // End Tag filters injection
	}

	//----------- Run function wrapper and helpers - you shouldn't need to edit below this line. -------------------

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

	// Run confirm callback when preventDefault is true. Used for async actions
	function confirmCallback() {
		cancelTimeoutCheck();
		if (globals.action.callbacks.confirm) {
			globals.action.callbacks.confirm();
		}
	}

	// Run cancel callback when preventDefault is true. Used for async actions
	function cancelCallback() {
		cancelTimeoutCheck();
		if (globals.action.callbacks.cancel) {
			globals.action.callbacks.cancel();
		}
	}

	// Check if the action has run within the specified time limit when preventDefault is enabled
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

	function cancelTimeoutCheck() {
		if (timeout) {
			clearTimeout(timeout);
		}
	}

	// Function to report any errors that occur when running this action
	// Follows standard javascript error reporter format of an object with name and message properties
	function reportError(error) {
		const errorTitle = 'Error Running Custom Action';
		const errorMessage =
			'<p>There was a problem running the action "<span style="white-space: nowrap">' +
			globals.action.name +
			'</span>"</p><p>Error: ' +
			error.message +
			'.</p><p>This may result in unexpected behavior of the calendar.</p>';
		if (
			globals.action.preventDefault &&
			globals.action.category !== event &&
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
