// Add Utility Drawer Buttons v1.0

// Purpose:
// Allows you to add one or more custom buttons
// to any of the event popover utility drawers.
// Code requires installatioon of accompanying CSS.

// Action Type: On Event Click
// Prevent Default Action: No

// More info on custom actions here:
// https://docs.dayback.com/article/140-custom-app-actions

// Declare globals

var options = {};
var inputs = {};

try {
    //----------- Configuration -------------------

    // Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)

    options.runTimeout = 0;

    // Example Configuration:
    // ----------------------
    //
    // Below is an example data structure that configures a Text Button in the
    // Contacts drawer, and Icon buttons in the Projects and Resouirces utility 
    // drawerers.
    //
    // You can modify this basic example according the configuration instructions 
    // provided below this data structure.

    inputs.buttons = [

        // "Add Contact" text button in Contacts utility drawer

        {
            utilityDrawer: 'contact',
            buttonStyle: 'text',
            buttonText: 'Add Contact',
            checkIfApplicable: function () {
                // This button is available for all events and users
                return true;
            },
            buttonAction: function () {
                // Code that let you add a contact lives here
                alert("...");
            },
        },

        // A purple salesforce icon in the projects/related-to utility drawer

        {
            utilityDrawer: 'project',
            buttonStyle: 'icon',
            buttonTooltip: "Add Record",
            buttonClass: "addRecord",
            buttonIcon: "sf_icon_building",
            buttonColor: "sf_color_purple",
            buttonText: "",
            checkIfApplicable: function () {
                // This button is available for all events and users
                return true;
            },
            buttonAction: function () {
                // Code that let you add a record lives here
                alert("...");
            },
        },

        // A blue FontAwesome text icon in the resource utility drawer

        {
            utilityDrawer: 'resource',
            buttonStyle: 'icon',
            buttonTooltip: "Add Inspector",
            buttonClass: "addInspector",
            buttonIcon: "fa-user",
            buttonColor: "darkblue",
            buttonText: "Add",
            checkIfApplicable: function () {
                // This button is available for all events and users
                return true;
            },
            buttonAction: function () {
                // Code that let you add a resource lives here
                alert("...");
            },
        },
    ];

    // Utility Drawer names are very specific to DayBack's codebase, but can be named 
    // in a variety of ways for purposes of display to the user. To obtain
    // the correct drawer name, you can set the following variable to true. 
    // Next, open up your JavaScript console. Click on any drawer in the popover
    // to discover its name. You may then use this drawer name in your configuration
    // parameters

    options.discoverDrawerNames = true;

    // Utility Drawer Button Configuration
    // -----------------------------------
    //
    // You may add one or more buttons to one or more utility drawers.
    // There are two supported button layout:
    //
    // Option 1: Text Button
    //
    // This button style is like DayBack's default "Add Field +" link in
    // the Custom Fields utility drawer, or the "Add Button +" link in
    // the Button Actions utility drawer.
    //
    // Option 2. Icon Button
    //
    // This will add one or more icon buttons next to the Close
    // button in the specified utility drawer. You may use Salesforce
    // button styles, or DayBack's FontAwesome button styles.
    //
    // Configuring Text Buttons:
    // -------------------------
    //
    // The following parameters are required to configure a text button.
    // As an example, we will configure an 'Add Contact +' text button
    // in the Contacts utility drawer.
    //
    // buttonStyle: 'text'
    //      This specifies that you want a single text link button.
    //
    // buttonText: 'Add Contact'
    //      This specifies the text of the button. The + icon is added to the
    //      right of the text automatically, so you don't need to add it. 
    //
    // utilityDrawer: 'contact'
    //      This specifies which utility drawer the button should be drawn
    //      in. Example utility drawer names include:
    //
    //          resource, status, contact, project, customFields, buttonActions
    //
    //      The related to records are typically under the project utility
    //      drawer
    //
    // checkIfApplicable: function() { ... }
    //		There may be cases when you need to show a button but
    //		only under certain conditions. If you have such rules,
    //		you can specify a function that returns true if the event
    //		object contains a required value.
    //
    //		For example, you may want add a function that returns true
    //		if an event description contains a zoom link:
    //
    //		checkIfApplicable: function () {
    //			return event.description.includes("zoom") ? true : false;
    //		}
    //
    //  	If you don't have such rules, you can omit the
    //		checkIfApplicable parameter.
    //
    // buttonAction: function() { ... }
    //		This required parameter specifies the function that should
    //		run when the button is clicked. The default example button
    //		we provide will open an event's native Salesforce record
    //		in a new window
    //
    // Configuring Icon Buttons:
    // -------------------------
    //
    // The following parameters are requires to configure an icon button
    // that  will appear next to the close button in the specified
    // utility drawer.
    //
    // All button configuration fields are optional, unless designated as
    // required with a '*'.
    //
    // buttonStyle: 'icon' *
    //      This specifies that you are configuring a text icon
    //
    // utilityDrawer *
    //      This specifies which utility drawer the button should be drawn
    //      in. Example utility drawer names include:
    //
    //          resource, status, contact, project, customFields, buttonActions
    //
    //      The related to records are typically under the project utility
    //      drawer
    //
    // buttonTooltip
    //		This text will appear when you hover over the button.
    //		There is a half second delay before the tooltip will
    //		appear.
    //
    // buttonClass
    //		An optional CSS class name to apply to the button.
    //
    // buttonIcon
    //      If you'd like to use native Salesforce icons, you can 
    //      use any of the following icon codes:
    //
    //          sf_icon_calendar
    //          sf_icon_list
    //          sf_icon_merge
    //          sf_icon_email
    //          sf_icon_users
    //          sf_icon_building
    //
    //		If you'd like to use DayBack's native icons and HEX, or
    //      RGB colors, please specify which icon you want to use for
    //      button, using the FontAwesome icon code name which looks
    //      like fa-button-code-name. See the FontAwesome version 4
    //		icon list for reference: https://fontawesome.com/v4/icons/
    //
    //      FontAwesome Icon & Color Example:
    //
    //          buttonIcon: 'fa-list',
    //          buttonColor: 'green'
    //
    //      Salesforce Icon & Color Example:
    //
    //          buttonIcon: 'sf_icon_',
    //          buttonColor: 'green'
    //
    // buttonColor
    //		Specify a HEX or RGB color code to apply to the button.
    //      Alternative, you may use native Salesforce colors. Available
    //      colors are configurable in the CSS.
    //
    //          sf_color_pink
    //          sf_color_green
    //          sf_color_orange
    //          sf_color_gray
    //          sf_color_purple
    //          sf_color_salmon
    //
    // buttonText
    //		Specify if the button should contain text next to, or
    // 		instead of the icon. In most cases, we recommend you
    //		leave this blank, and use an icon and tooltip instead.
    //		this will leave room in the button tray for more
    //		icons.
    //
    // checkIfApplicable
    //		There may be cases when you need to show a button but
    //		only under certain conditions. If you have such rules,
    //		you can specify a function that returns true if the event
    //		object contains a required value.
    //
    //		For example, you may want add a function that returns true
    //		if an event description contains a zoom link:
    //
    //		checkIfApplicable: function () {
    //			return event.description.includes("zoom") ? true : false;
    //		}
    //
    //  	If you don't have such rules, you can omit the 
    //		checkIfApplicable parameter.
    //
    // buttonAction *
    //		This required parameter specifies the function that should
    //		run when the button is clicked. The default example button
    //		we provide will open an event's native Salesforce record
    //		in a new window

    // The following setting adjusts how long to wait before displaying
    // a tooltip description of the button when a user hovers over the
    // button.

    inputs.tooltipHoverDelay = 500;

    // Below are Salesforce icons you may use in your button definitions. 

    inputs.salesforceIcons = {

        sf_icon_calendar: '<svg focusable="false" data-key="event" aria-hidden="true" viewBox="0 0 100 100" part="icon"><g><path d="M76 42H24c-1.1 0-2 .9-2 2v30c0 3.3 2.7 6 6 6h44c3.3 0 6-2.7 6-6V44c0-1.1-.9-2-2-2zM40 70c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v4zm0-14c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v4zm14 14c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v4zm0-14c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v4zm14 14c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v4zm0-14c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v4zM72 26h-5v-2c0-2.2-1.8-4-4-4s-4 1.8-4 4v2H41v-2c0-2.2-1.8-4-4-4s-4 1.8-4 4v2h-5c-3.3 0-6 2.7-6 6v2c0 1.1.9 2 2 2h52c1.1 0 2-.9 2-2v-2c0-3.3-2.7-6-6-6z"></path></g></svg>',

        sf_icon_list: '<svg focusable="false" data-key="task" aria-hidden="true" viewBox="0 0 100 100" part="icon"><g><path d="M46.6 23.7l-2.1-2.1c-.6-.6-1.5-.6-2.1 0L29.2 34.8l-5.3-5.3c-.6-.6-1.5-.6-2.1 0l-2.1 2.1c-.6.6-.6 1.5 0 2.1l7.4 7.4c.6.6 1.4.9 2.1.9.8 0 1.5-.3 2.1-.9l15.3-15.3c.5-.5.5-1.5 0-2.1zM77 38H51c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h26c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2zM77 56H45c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h32c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2zM33 56h-4c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2zM33 74h-4c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2zM77 74H45c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h32c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2z"></path></g></svg>',

        sf_icon_merge: '<svg focusable="false" data-key="merge" aria-hidden="true" viewBox="0 0 100 100" part="icon"><g><path d="M70.5 72.5c-7-3.4-12-9.4-14.5-16.3-1-2.6-1.6-5.3-1.9-7.9v-4.4h13.6c1.1 0 1.7-1.2 1-2.2L51 20.5c-.6-.8-2-.8-2.5 0L31.2 41.7c-.6.8 0 2.2 1 2.2h13.7V48.3c-.3 2.7-1 5.5-1.9 7.9-2.6 6.8-7.5 12.9-14.5 16.3-1 .4-1.4 1.6-1 2.6l1.6 3.8c.5 1.1 1.6 1.4 2.7.8 7.6-3.6 13.5-9.4 17.2-16.2 3.7 6.9 9.6 12.6 17.3 16.2 1.1.5 2.2.4 2.7-.8l1.6-3.8c.4-1-.1-2.2-1.1-2.6z"></path></g></svg>',

        sf_icon_email: '<svg focusable="false" data-key="email" aria-hidden="true" viewBox="0 0 100 100" part="icon"><g><path d="M48.7 55c.8.7 1.9.7 2.7 0l28.3-26.2c.5-1 .4-2.6-1.6-2.6l-56 .1c-1.5 0-2.7 1.4-1.6 2.6L48.7 55z"></path><path d="M80 40c0-1.3-1.6-2-2.5-1.1l-22 20.4c-1.5 1.4-3.4 2.1-5.4 2.1s-3.9-.7-5.4-2.1L22.6 38.9c-1-.9-2.5-.2-2.5 1.1v26c0 3.3 2.7 6 6 6h48c3.3 0 6-2.7 6-6-.1 0-.1-18-.1-26z"></path></g></svg>',

        sf_icon_users: '<div class="sf_icon_users"></div>',

        sf_icon_building: '<div class="sf_icon_building"></div>'
    };

    //----------- End Configuration -------------------

} catch (error) {
    reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {

    // Get distinct utility drawers for which we wish to add click handlers

    let utilityDrawers = [];

    inputs.buttons.forEach((b) => {
        utilityDrawers[b.utilityDrawer] = true;
    });

    // Observe the opening of an event drawer, and after all objects rendered
    // add relevant click handlers

    dbk.observe({
        name: 'eventOpener',
        watch: document.getElementById('calendar'),
        until: '.dbk_popover .panel-selector',
        then: function (o) { o.destroy(); setTimeout(function () { addClickHandlers(); }, 100); }
    });

    function addClickHandlers() {

        // Get all panel selectors and gear icon for which we need
        // to define click events

        let panelSelectors = document.querySelectorAll('.dbk_popover .panel-selector');
        let buttonsSelector = document.querySelector('.dbk_button_link.dbk_icon_cog');

        // Add a click event to every utility drawer selector, even if we don't
        // plan to add buttons to it. This is necessary as some panels leave
        // left-over modifications which must be cleaned up when switching contexts

        panelSelectors.forEach((p) => {

            let drawerName = p.getAttribute('name');

            // If panel active, add button immediately

            if (p.classList.contains('panelActivate')) {

                if (drawerName != 'dateEnd' && drawerName != 'dateStart' && utilityDrawers.hasOwnProperty(drawerName)) {

                    dbk.observe({
                        name: event._id + "_ud_" + drawerName,
                        watch: document.querySelector('.ng-popover'),
                        until: '.select-list.with-footer',
                        then: function (o) { o.destroy(); addCustomButtons(o, drawerName); }
                    });
                }
            }

            // Attach panel click handler

            p.addEventListener('click', function () {

                // Immediately clean prior painted button states
                cleanUpRenderedButtons(drawerName);

                // If we are opening a new panel, rather than closing one
                // add have defined buttons for thgat drawer, modify that
                // panel when the drawer is open. We don't include date 
                // and time panels to reduce CPU cycles as these are
                // not likely to be modified by users.

                if (!p.classList.contains('panelActive') && p.classList.contains('panelActivate-add')) {

                    if (options.discoverDrawerNames) {
                        console.log("Draw Name: " + p.getAttribute('name'));
                    }

                    if (drawerName != 'dateEnd' && drawerName != 'dateStart' && utilityDrawers.hasOwnProperty(drawerName)) {

                        dbk.observe({
                            name: event._id + "_ud_" + drawerName,
                            watch: document.querySelector('.ng-popover'),
                            until: '.select-list.with-footer',
                            then: function (o) { o.destroy(); addCustomButtons(o, drawerName); }
                        });
                    }
                }
            });
        });

        // Add similar handling for the gear icon, but monitor different query selectors to
        // determine if we are opening or closing a drawer.

        if (buttonsSelector) {
            buttonsSelector.addEventListener('click', function () {

                let drawerName = 'buttonActions';
                cleanUpRenderedButtons(drawerName);

                if (utilityDrawers.hasOwnProperty(drawerName) && !document.querySelector('.dbk_popover .icon-panelActivate')) {

                    if (options.discoverDrawerNames) {
                        console.log("Draw Name: buttonActions");
                    }

                    dbk.observe({
                        name: event._id + "_ud_" + drawerName,
                        watch: document.querySelector('.ng-popover'),
                        until: '.select-list.with-footer',
                        then: function (o) { addCustomButtons(o, drawerName); }
                    });
                }
            });
        }
    }

    // Utility function is used to clean prior applies CSS classes whether we are 
    // loading or unloading a button drawer

    function cleanUpRenderedButtons(drawerName) {

        // Remove Utility Button Styles classlist

        let containers = document.querySelectorAll('.select-list-footer');
        if (containers) {
            containers.forEach((c) => {
                c.parentElement.classList.remove("utilityButtonStyles");
            });
        }

        // Remove prior footer classe big button definitions if any where added

        let footers = document.querySelectorAll('.select-list.with-footer');
        if (footers && drawerName != 'customFields' && drawerName != 'buttonActions') {
            footers.forEach((f) => {
                f.classList.remove('additional');
            });
        }

        // Delete old buttons

        let previousButton = document.querySelector('button.utilityPanelLargeButton');
        if (previousButton) {
            previousButton.parentElement.removeChild(previousButton);
        }

        // Delete previously-added buttons

        let previousButtons = document.querySelectorAll('.utilityButtonTray');
        if (previousButtons) {
            previousButtons.forEach((b) => {
                b.parentElement.removeChild(b);
            });
        }
    }

    // Helper function grabs the first text button defined for 
    // a utility drawer. Returns undefined if no text button
    // exists for the drawer

    function getDrawerTextButton(drawerName) {
        let button;
        inputs.buttons.forEach((b) => {
            if (!button && b.utilityDrawer == drawerName && b.buttonStyle == 'text') {
                button = b;
            }
        });
        return button;
    }

    // Mutation handler destroys the observer, cleans up old drawer buttons
    // from prior runtime and adds new set of buttons

    function addCustomButtons(o, drawerName) {

        o.destroy();

        // Clean up old buttons

        cleanUpRenderedButtons(drawerName);

        // Get text button if one exists for this drawer

        let drawerTextButton = getDrawerTextButton(drawerName);

        // Get which side is open

        let ngPopover = document.querySelector('.ng-popover');
        let leftright = ngPopover.classList.contains('right') ? 'right' : 'left';

        // Get Button row

        let footer = document.querySelector('.utility-drawer.active .panel-switch.panel-' + leftright + ' .select-list.with-footer');
        let buttonContainer = document.querySelector('.utility-drawer.active .panel-switch.panel-right .select-list-footer');

        if (drawerName == 'customFields') {
            footer = document.querySelector('.utility-drawer.active .panel-switch.panel-left .select-list.with-footer');
            buttonContainer = document.querySelector('.utility-drawer.active .panel-switch.panel-left .select-list-footer');
        }

        if (!footer) {
            footer = document.querySelector('.utility-drawer.active .select-list.with-footer');
            buttonContainer = document.querySelector('.utility-drawer.active .select-list-footer');
        }

        // Add Large Text buttons if we have them for this panel, and if they apply.

        if (footer && drawerTextButton && (!drawerTextButton.checkIfApplicable || drawerTextButton.checkIfApplicable())) {

            if (!footer.classList.contains('additional')) {
                footer.classList.add('additional');
            }

            // Only allow drawing of Text Buttons if we don't already have one. This
            // includes custom fields, button actions, and dates

            if (buttonContainer && drawerName != 'dateEnd' && drawerName != 'dateStart' && drawerName != 'buttonActions' && drawerName != 'customFields') {

                // Add new text button and attach click handler

                let btn = document.createElement('BUTTON');
                let span = document.createElement('SPAN');
                let i = document.createElement('I');

                btn.classList = "btn btn-link dbk_button_link additional add-additional-field utilityPanelLargeButton";
                span.innerHTML = drawerTextButton.buttonText;
                i.classList = "fa fa-plus fa-lg dbk_icon_plus list-selector-icon list-event-icon";

                btn.onclick = drawerTextButton.buttonAction;
                btn.appendChild(span);
                btn.appendChild(i);

                buttonContainer.insertBefore(btn, buttonContainer.firstChild);
            }
        }

        // Add any icon buttons if we've defined any for this panel

        if (footer && drawerName != 'dateEnd' && drawerName != 'dateStart' && utilityDrawers.hasOwnProperty(drawerName)) {
            addButtons(buttonContainer, drawerName);
        }
    }

    // Utility function adds any defined buttons for the given panel

    function addButtons(container, drawerName) {

        // Has icon buttons
        let hasIconButtons = false;

        inputs.buttons.forEach((b) => {
            if (b.utilityDrawer == drawerName && b.buttonStyle == 'icon') {
                hasIconButtons = true;
            }
        });

        if (!hasIconButtons) {
            return;
        }

        // Add class to container
        container.parentElement.classList.add("utilityButtonStyles");

        // Check if container has help icon element which requires we shift buttons left
        let helpIcon = document.querySelector('.utility-drawer.active button.btn-help');

        // Add button tray
        let buttonTray = document.createElement('DIV');
        buttonTray.classList = !helpIcon ? 'utilityButtonTray' : 'utilityButtonTray hasHelpIcon';

        // Add help icon vertical shift
        if (helpIcon) {
            helpIcon.classList.add('helpIconVerticalShift')
        }

        container.appendChild(buttonTray);

        // Get Root class to assign active color variables

        let root = document.querySelector(':root');
        let rootStyle = getComputedStyle(root);
        let btnNumber = 0;

        // Add buttons to button bar

        inputs.buttons.forEach((b) => {

            // Increment button number for color definitions
            btnNumber++;

            // Ignore text buttons and buttons for other utility drawers
            if (b.utilityDrawer != drawerName || b.buttonStyle != 'icon') {
                return;
            }

            // Check if the button is applicable to this event
            if (b.checkIfApplicable && !b.checkIfApplicable()) {
                return;
            }

            let isSalesforceIcon = b.buttonIcon && b.buttonIcon != "" && b.buttonIcon.includes('sf_icon') ? true : false;
            let isSalesforceColor = b.buttonColor && b.buttonColor != "" && b.buttonColor.includes('sf_color') ? true : false;
            let btn = document.createElement(isSalesforceIcon ? "DIV" : "BUTTON");

            btn.classList = isSalesforceIcon ? 'sf_icon_wrapper' : 'btn btn-xs btn-success btn-icon';

            if (b.buttonClass && b.buttonClass != "") {
                btn.classList.add(b.buttonClass);
            }

            let icon;

            if (b.buttonIcon && b.buttonIcon != "") {

                if (isSalesforceIcon) {
                    icon = document.createElement("DIV");
                    icon.classList = "sf_icon";
                    icon.innerHTML = inputs.salesforceIcons[b.buttonIcon];
                    btn.appendChild(icon);
                } else {
                    icon = document.createElement("I");
                    icon.classList = "fa fa-fw " + b.buttonIcon;
                    btn.appendChild(icon);
                }
            }

            if (b.buttonText && b.buttonText != "") {
                let text = document.createElement("span");
                text.innerText = b.buttonText;
                btn.appendChild(text);
            }

            if (b.buttonColor && b.buttonColor != "") {

                if (isSalesforceColor) {
                    icon.classList.add(b.buttonColor);
                } else {
                    root.style.setProperty('--utilityButtonStyles' + btnNumber, b.buttonColor);
                    btn.style.borderColor = b.buttonColor;
                    btn.style.backgroundColor = b.buttonColor;
                }
            }

            // Add tooltips

            if (b.buttonTooltip && b.buttonTooltip != "") {
                const tooltipOptions = {
                    delay: { show: inputs.tooltipHoverDelay, hide: 0 },
                    hide: true,
                    position: "top",
                    targetElement: btn,
                };

                buttonTray.appendChild(btn);

                // Add custome handelers, as tooltip has to be
                // reconstructed given z-index changes post
                // first render

                btn.onmouseover = () => {
                    b.tooltip.show();
                };

                btn.onmouseleave = () => {
                    b.tooltip.hide();
                    b.tooltip = dbk.tooltip(b.buttonTooltip, tooltipOptions);
                };

                setTimeout(() => {
                    b.tooltip = dbk.tooltip(b.buttonTooltip, tooltipOptions);
                }, 200);
            }

            if (b.buttonAction) {
                btn.onclick = () => {
                    if (b.tooltip) {
                        b.tooltip.hide();
                    }
                    b.buttonAction();
                };
            }
        });
    }
}

//----------- Run function wrapper and helpers - you shouldn't need to edit below this line. -------------------

// Variables used for helper functions below
var timeout;

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
        function () {
            var error = {
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
// Follows standard javascript error reporter format of an object with name and message properties
function reportError(error) {
    var errorTitle = 'Error Running Custom Action';
    var errorMessage =
        '<p>There was a problem running the action "<span style="white-space: nowrap">' +
        action.name +
        '</span>"</p><p>Error: ' +
        error.message +
        '.</p><p>This may result in unexpected behavior of the calendar.</p>';
    if (action.preventDefault && action.category !== event && timeout) {
        confirmCallback();
    } else {
        cancelCallback();
    }

    setTimeout(function () {
        utilities.showModal(
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