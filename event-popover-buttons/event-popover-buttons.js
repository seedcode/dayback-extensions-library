// Event Popover Buttons v1.0

// Purpose:
// Allows you to add one or more custom buttons
// to the button tray in the standard DayBack
// event popover. Code requires the mutation
// observer library to work, as well as the
// installation of the required CSS changes.

// Co-requisite: DayBack Mutation Observer library
// https://github.com/seedcode/dayback-extensions-library/tree/main/dayback-mutation-observer

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

    // If you are planning on adding more than one button, we would recommend 
    // reducing the size of the standard DayBack "Save & Close" & "Delete" 
    // buttons. 
    //
    // If shortenDeleteButton is set to true, the word "Delete" will be replaced
    // with a trash can icon. 

    inputs.shortenDeleteButton = false;

    // If shortenSaveButton is set to true, the phrase "Save & Close" will be
    // replaced with the value of shortSaveButtonName, in this case "Save";

    inputs.shortenSaveButton = false;

    inputs.shortSaveButtonName = "Save";

    // Button Configuration:
    // ---------------------
    //
    // Please provide an array of objects that configure each button.
    // You may display up to 3 buttons without needing to make additional
    // modifications to this app action to accomodate a large quantity of
    // buttons.
    //
    // All button configuration fields are optional, unless designated as
    // required with a '*'.
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
    //          buttonIcon: 'sf_icon_calendar',
    //          buttonColor: 'green'
    //
    // buttonColor
    //		Specify a HEX or RGB color code to apply to the button.
    //      Alternatively, if you are using Salesforce buttons, you can
    //      specify a Salesforce color. The following Salesforce color 
    //      color short codes are available, but will only work with 
    //      Salesforce buttons.
    //
    //          sf_color_pink
    //          sf_color_green
    //          sf_color_orange
    //          sf_color_gray
    //          sf_color_purple
    //          sf_color_salmon
    //
    //      If you want to use these colors in a regular button, you can
    //      copy the HEX code values from the accompanying CSS file.
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

    inputs.buttons = [
        {
            buttonTooltip: "Open Zoom",
            buttonClass: "openRecord",
            buttonIcon: "sf_icon_calendar",
            buttonColor: "sf_color_pink",
            buttonText: "",

            checkIfApplicable: function () {

                // This button is available for all events and users 
                return true;
            },

            buttonAction: function () {

                // This action will open an Event's native Salesforce record in a new window.
                fbk.publish('dbk.navigate', { url: '/' + event.eventID, new: true });
            },
        },

        // You can add more optional buttons here
        // {
        //    ...
        // }
    ];

    // The following setting adjusts how long to wait before displaying
    // a tooltip description of the button when a user hovers over the
    // button.

    inputs.tooltipHoverDelay = 500;

    // Below are Salesforce icons you may use in your button definitions. 
    // To use Salesforce-specific definitions, you will need to install
    // the optional salesforce_icons.css in the DayBack CSS configuration

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

    utilities.observe({
        name: "addPopoverButton" + event._id,
        watch: document.getElementById("calendar"),
        until: ".edit.dbk_popover.dbk_editEvent",
        then: addButtons,
    });

    // Function runs when button bar is loaded

    function addButtons(o) {
        o.destroy();

        // Grab button bar
        let container = document.querySelector('[ng-if="edit.editable"]');

        if (!container) {
            container = document.querySelector('[ng-if="!edit.editable"]');
        }

        container.parentElement.classList.add("popoverButtonStyles");

        // Add button tray

        let buttonTray = document.createElement('DIV');
        buttonTray.classList = 'popoverButtonTray';

        container.appendChild(buttonTray);

        // Shorten Save Button

        if (inputs.shortenSaveButton) {
            let saveBtn = container.querySelector(".dbk_button_success");
            if (saveBtn) {
                saveBtn.innerText = inputs.shortSaveButtonName;
            }
        }

        if (inputs.shortenDeleteButton) {
            let deleteBtns = container.querySelectorAll(".dbk_button_text_danger");
            if (deleteBtns) {
                deleteBtns.forEach((deleteBtn) => {
                    deleteBtn.innerHTML = '<i class="fa fa-fw fa-trash-o"></i>';
                });
            }
        }

        // Get Root class to assign active color variables

        let root = document.querySelector(':root');
        let rootStyle = getComputedStyle(root);
        let btnNumber = 0;

        // Add buttons to button bar

        inputs.buttons.forEach((b) => {

            btnNumber++;

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
                    root.style.setProperty('--popoverButtonStyles' + btnNumber, b.buttonColor);
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
