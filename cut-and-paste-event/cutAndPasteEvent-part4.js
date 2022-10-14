// Move Event to Clipboard v1.0 - Part 4
//
// Purpose:
// Adds an Event Button function which temporarily
// moves the event to the clipboard. The clipboard
// persists between view changes. Event can be
// moved to its destination time and resource
// allocation and respect move context. 
// 
// https://dayback.com/listing/custom-action-menu/
//
// Action Type: Before Calendar Rendered
// Prevent Default Action: No
//
// More info on app actions here:
// https://docs.dayback.com/article/140-custom-app-actions

// Declare globals

var options = {};
var inputs = {};

try {
    // ----------- General Configuration -------------------

    // Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)
    // Leave this set to 0 to avoid unexpected behavior

    options.runTimeout = 0;

} catch (error) {
    reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {

    // Register functions for managing cliboard and on screen cursor
    // changes between views.
    
    seedcodeCalendar.init("addCursor", addCursor);
    seedcodeCalendar.init("removeCursor", removeCursor);
    seedcodeCalendar.init("clearClipboard", clearClipboard);
    
    // Function clears the cliboard and removes the cursor
    function clearClipboard() {
        
        seedcodeCalendar.init("eventInClipboard", undefined);
        removeCursor();
    
        // Repaint the calendar to remove any events that show
        // the eventInCliboard CSS style
        var repaintCalendar = document.querySelectorAll('.eventInClipboard');
        if (repaintCalendar.length > 0) {
            repaintCalendar.forEach((e) => {
                e.classList.remove('eventInClipboard');
            });
        }
    }
    
    // Function adds a CSS cursor to the current view
    function addCursor() {
          setTimeout(function() {
            var x = document.getElementsByClassName("fc-view");
            x[0].classList.add("moveEventFromClipboardCursor");
            x[0].style.cursor = 'copy';
        }, 10);
        
        registerViewDoubleClickListener();
    }
    
    // Function removes the CSS cursor to the current view
    function removeCursor() {
        setTimeout(function() {
            var x = document.getElementsByClassName("fc-view");
            x[0].classList.remove("moveEventFromClipboardCursor");
            x[0].style.cursor = 'auto';
        }, 10);  

        var view = document.querySelector('div.fc-view');
           
        if (view) {
            view.removeEventListener('dblclick', overrideAddEventButton);
        }        
    }

    // Function overrides doubleclick Add Event button drawer and repaints Add Event button

    function registerViewDoubleClickListener() {
    
        let retries = 0;
        let maxReries = 200;
        addListener();
    
        function addListener() {
            retries++;
            var view = document.querySelector('div.fc-view');
           
            if (view) {
                view.addEventListener('dblclick', overrideAddEventButton);
            } else if (retries < maxReries) {
                setTimeout(addListener, 5);
            }
        }  
    }

    function overrideAddEventButton() {
    
        let retries = 0;
        let maxReries = 200;
        redrawButton();
    
        function redrawButton() {
            retries++;
    
            var btn = document.querySelector('div.ng-popover button[ng-click="addEvent(newEvent)"]');
            if (btn) {
                btn.innerHTML = "Paste Event";
                btn.style.backgroundColor = "rgb(50, 118, 177)";
                btn.style.borderColor = "rgb(50, 118, 177)";
            } else if (retries < maxReries) {
                setTimeout(redrawButton, 5);
            }
        }  
    }    
}

//----------- Run function wrapper and helpers - you shouldn’t need to edit below this line. -------------------

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
                name: "Timeout",
                message:
                    "The action was unable to execute within the allotted time and has been stopped"
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
    var errorTitle = "Error Running Custom Action";
    var errorMessage =
        '<p>There was a problem running the action "<span style="white-space: nowrap">' +
        action.name +
        '</span>"</p><p>Error: ' +
        error.message +
        ".</p><p>This may result in unexpected behavior of the calendar.</p>";
    if (action.preventDefault && timeout) {
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
            "OK",
            null,
            null,
            null,
            true,
            null,
            true
        );
    }, 1000);
}
