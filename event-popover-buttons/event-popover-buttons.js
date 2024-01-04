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
    // All button configuration fields are optional, unless designatedas
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
    //		Specify which icon you want to use for your button.
    // 		Please use an fa-button-code-name from the FontAwesome
    //		version 4 icon list: https://fontawesome.com/v4/icons/
    //
    // buttonColor
    //		Specify a HEX or RGB color code to apply to the button.
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
            buttonTooltip: "Open Record",
            buttonClass: "openRecord",
            buttonIcon: "fa-list",
            buttonColor: "darkblue",
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

    //----------- End Configuration -------------------

} catch (error) {
    reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {

    seedcodeCalendar.get("dbkObserver").new({
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

        // Add buttons to button bar

        inputs.buttons.forEach((b) => {
            // Check if the button is applicable to this event
            if (b.checkIfApplicable && !b.checkIfApplicable()) {
                return;
            }

            container.parentElement.classList.add("popoverButtonStyles");
            let btn = document.createElement("BUTTON");
            btn.classList = "btn btn-xs btn-success btn-icon";

            if (b.buttonClass && b.buttonClass != "") {
                btn.classList.add(b.buttonClass);
            }

            if (b.buttonIcon && b.buttonIcon != "") {
                let icon = document.createElement("I");
                icon.classList = "fa fa-fw " + b.buttonIcon;
                btn.appendChild(icon);
            }

            if (b.buttonText && b.buttonText != "") {
                let text = document.createElement("span");
                text.innerText = b.buttonText;
                btn.appendChild(text);
            }

            if (b.buttonColor && b.buttonColor != "") {
                btn.style.borderColor = b.buttonColor;
                btn.style.backgroundColor = b.buttonColor;
            }

            // Add tooltips
            if (b.buttonTooltip && b.buttonTooltip != "") {
                const tooltipOptions = {
                    delay: { show: inputs.tooltipHoverDelay, hide: 0 },
                    hide: true,
                    position: "top",
                    targetElement: btn,
                };

                container.appendChild(btn);

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