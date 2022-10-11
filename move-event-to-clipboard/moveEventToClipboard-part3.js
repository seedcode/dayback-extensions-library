// Move Event to Clipboard v1.0 - Part 3
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
// Action Type: On Event Create
// Prevent Default Action: Yes
//
// More info on event actions here:
// https://docs.dayback.com/article/20-event-actions

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

    // Get Event in clipboard
    var eventInClipboard = seedcodeCalendar.get('eventInClipboard');
    var beforeMoveLocation = {};
    var afterMoveLocation = {};

    // If we are pasting an event, run the moveEvent function, otherwise
    // confirm callback and allow standard event creation to take place
    if (eventInClipboard) {
        moveEvent(eventInClipboard);
    } else {
        action.callbacks.confirm(); 
    }

    // Move event function 
    function moveEvent(eventInClipboard) {
        
        // Remove the cursor while we are adding the event 
        // Cancel callbacks so that we do not display the standard
        // Add Event popup

        seedcodeCalendar.get('removeCursor')();
        action.callbacks.cancel();    

        // Get the event we are moving
        var old_event = eventInClipboard.event;
        var old_editEvent = eventInClipboard.editEvent;
        
        console.log(old_event);

        // Set the changes object and revent object by cloning the
        // time of day. Get the difference in minutes or days and
        // apply that to a new moment object from the new start time
        // in editEvent

        var changesObject;

        var revertObject = {
            start: old_event.start.clone(),
            end: old_event.end.clone(),
            allDay: old_event.allDay ? true : false,
            resource: old_event.resource.slice()
        };

        if (old_event.allDay == false) {

            // Get old event duration and apply to new event.
            var minDiff = old_event.end.diff(old_event.start, 'minutes');

            var end = editEvent.start.clone();
            end.add(minDiff, 'minutes');

            changesObject = {
                start: editEvent.start.clone(),
                end: end,
                allDay: editEvent.allDay ? true : false,
            };

        } else { 
            
            // Get old event duration and apply to new event.
            var minDiff = old_event.end.diff(old_event.start, 'days');
            var end = editEvent.start.clone();
            end.add(minDiff, 'days');

            changesObject = {
                start: editEvent.start.clone(),
                end: end,
                allDay: editEvent.allDay ? true : false,
            };
        }
        
        // If we are creating an event in a resource column, a resource will be
        // prepopulated in the editEvent object. Non-resource changes, the 
        // editEvent rource is set to none, and therefore should be applied
        // as it will erase exisitng resource list

        if (editEvent.resource.length > 0 && editEvent.resource[0] != 'none') {
            changesObject.resource = editEvent.resource.slice();
        }

        action.preventAction = true;

        // Get element's current on screen location
        beforeMoveLocation = getOffset(old_event.eventID);

        // Update the original event with new start time

        dbk.updateEvent(
            old_event,
            changesObject,
            recordFailedEdit,
            verifyFinished,
            {
                isCustomAction: true
            }
        );

        function verifyFinished(
            updatedEvent,
            changesObject,
            revertObject,
            options,
            revertFunc,
            error
        ) {

            // Clear the clipboard and redraw on screen events
            // if a view change or prior filter change does not
            // show the event.

            action.preventAction = false;
            redrawEvents(old_event.eventID);
            seedcodeCalendar.get('clearClipboard')();

            var updateError = '';
            
            if (error) {
                let updateError=
                    error.error && error.error.message
                        ? error.error.message
                        : error.message
                        ? error.message
                        : error.ERRORCODE
                        ? error.ERRORCODE + " - " + error.DESCRIPTION
                        : error.errorCode
                        ? error.errorCode
                        : "Unknown";

                    // One or more updates failed, revert all changes
                    utilities.showModal(
                        "Error during save",
                        updateError + ". Changes will be reverted.",
                        "continue",
                        revertChanges
                    );
            } else {

                var revertMessage =
                '<span class="message-icon-separator success">' +
                '<i class="fa fa-lg fa-check"></i>' +
                "</span>" +
                "<span translate>Event Moved</span>" +
                '<span class="message-separator"> | </span>' +
                "<span translate>Undo</span>" +
                '<span class="message-icon-separator" style="opacity: 0.8;"><i class="fa fa-lg fa-undo"></i></span>';                

                // Get element's current on screen location

                setTimeout(function() {
                    beforeMoveLocation = getOffset(old_event.eventID);
                }, 300);

                helpers.showMessage(
                    revertMessage,
                    0,
                    5000,
                    null,
                    revertChanges
                );
            }
        }

        // Helper function to return the current on-screen DOM elemnet ID of an event by it's ID

        function getDomIdByEventID(eventID) {
            var clientEvents = seedcodeCalendar.get('element').fullCalendar('clientEvents');
            var events = clientEvents.filter((event) => {
                return event.eventID == eventID;
            });
            
            return events && events.length > 0 ? events[0]._id : undefined;
        }

        // Only redraw events if they are not shown after view change changes DOM element 

        function redrawEvents(eventID) {
            
            // Grab all displayed events
            var domID = getDomIdByEventID(eventID);


            
            // If we have an event with that ID, check that it is is in the DOM, and if not, 
            // redraw events

            if (domID && domID !== undefined) {

                // Get element's current on screen location
                afterMoveLocation = getOffset(eventID);

                let domLocationChanged = afterMoveLocation.top == beforeMoveLocation.top && afterMoveLocation.left == beforeMoveLocation.left ? false : true;
                var e = document.querySelector('[data-id="' + domID + '"]');

                if (!e || e === undefined) {
                    seedcodeCalendar.get('element').fullCalendar('refetchEvents');
                } else if (!domLocationChanged) {
                    e.remove();
                }
            } else {
                seedcodeCalendar.get('element').fullCalendar('refetchEvents');
            }
        }

        // Create an Undo function that prevents toggling back and forth
        // For now, user will need to re-cut and re-paste from original view if they
        // want to redo and undone paste

        function verifyUndone(
            updatedEvent,
            changesObject,
            revertObject,
            options,
            revertFunc,
            error
        ) {
            action.preventAction = false;

            // Clear cliboard and redraw events
            redrawEvents(old_event.eventID);
            seedcodeCalendar.get('clearClipboard')();

            var updateError = '';
            
            if (error) {
                let updateError=
                    error.error && error.error.message
                        ? error.error.message
                        : error.message
                        ? error.message
                        : error.ERRORCODE
                        ? error.ERRORCODE + " - " + error.DESCRIPTION
                        : error.errorCode
                        ? error.errorCode
                        : "Unknown";

                    //One or more updates failed, revert all changes
                    utilities.showModal(
                        "Error during save",
                        updateError +
                            ". Changes will be reverted.",
                        "continue",
                        revertChanges
                    );
            } else {

                var revertMessage =
                '<span class="message-icon-separator success">' +
                '<i class="fa fa-lg fa-check"></i>' +
                "</span>" +
                "<span translate>Event Restored to Original Location and Resource</span>";

                helpers.showMessage(
                    revertMessage,
                    0,
                    5000,
                    null,
                    null
                );
            }
        }

        function recordFailedEdit(callback, targetEvent, error) {
            verifyFinished(targetEvent, null, null, null, null, error);
        }

        function revertChanges(showError) {
            isUndo = true;
            action.preventAction = true;

            // Get element's current on screen location
            beforeMoveLocation = getOffset(old_event.eventID);

            dbk.updateEvent(
                old_event,
                revertObject,
                null,
                verifyUndone,
                {
                    isCustomAction: true,
                    isUndo: true
                }
            );
        }

        function getOffset(eventID) {
            
            var domID = getDomIdByEventID(eventID);
            var domElement = document.querySelector('[data-id="' + domID + '"]');
            
            var offset;

            if (!domElement) {
                offset = { left: undefined, top: undefined };
            } else {
                var _x = 0;
                var _y = 0;
                while(domElement && !isNaN( domElement.offsetLeft ) && !isNaN( domElement.offsetTop ) ) {
                    _x += domElement.offsetLeft - domElement.scrollLeft;
                    _y += domElement.offsetTop - domElement.scrollTop;
                    domElement = domElement.offsetParent;
                }
                offset = { top: _y, left: _x };
            }

            return offset;
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
