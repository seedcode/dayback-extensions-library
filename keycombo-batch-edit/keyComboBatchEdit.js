// Key Combination Batch Edit v1.1

// Purpose:
// Applies changes to selected events when a key combination is held
// and one of the selected events is clicked
//
// Action Type: After Calendar Rendered
// Prevent Default Action: No

// More info on custom App Actions here:
// https://docs.dayback.com/article/140-custom-app-actions

// Declare globals
var options = {};
var inputs = {};

try {
    //----------- Configuration -------------------

    // Options specified for this action

    // Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)

    options.runTimeout = 8;

    // Array of account emails for whom this action will run. Leave blank to allow the action to run for everyone.
    // Example: ['person@domain.com', 'someone@domain.com']

    options.restrictedToAccounts = [];

    // The following defines a list of key combinations and the changes which will be
    // applied to selected events when the Key combination is held, while the user clicks
    // on any of the highlighted events
    //
    // For a list of all editable fields please refer to our documentation:
    // https://docs.dayback.com/article/124-action-objects-methods#editEvent

    inputs.comboActions = [
        {
            // Set status to 'Done' when 'D' key is held and an event is clicked
            keys: ["KeyD"],
            eventChanges: {
                status: ["Done"]
            }
        },
        {
            // Set status to 'Call' when 'C' key is held and an event is clicked
            keys: ["KeyC"],
            eventChanges: {
                status: ["Call"]
            }
        },
        {
            // Set status to 'Pending' when 'P' key is held and an event is clicked
            keys: ["KeyP"],
            eventChanges: {
                status: ["Pending"]
            }
        },
        {
            // Set selected events to 'Rescheduled' and 1 hour forward in time
            // when 'R' + 'S' keys are held and an event is clicked
            keys: ["KeyR", "KeyS"],
            eventChanges: {
                status: ["Rescheduled"],
                start: moment.duration(1, "hour"),
                end: moment.duration(1, "hour")
            }
        }
    ];

    //----------- End Configuration -------------------
} catch (error) {
    reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
    var keyDown;

    // Add Key Listener if one has not been defined

    if (!seedcodeCalendar.get("trackingKeys")) {
        // Initialize key tracking globals
        seedcodeCalendar.init("trackingKeys", true, true);
        keyDown = seedcodeCalendar.init("keyDown", {}, true);

        // Listen for key up event and delete recorded key from variable
        document.addEventListener("keyup", function (e) {
            if (keyDown) {
                delete keyDown[e.code];
            }
        });

        // Listen for key down event and save to array of held keys
        document.addEventListener("keydown", function (e) {
            keyDown[e.code] = e.key;
        });
    }

    // After timeout, add a mouse click event listener
    // which checks whether a key combination is being held
    // and an event is clicked.

    setTimeout(function () {
        var calendarContent = document.querySelector(".calendar");

        calendarContent.addEventListener("mousedown", function (e) {
            var multiSelect = seedcodeCalendar.get("multiSelect");

            // We have a multselect object
            // Shift key is not being pressed
            // We have a key being pressed
            // The click target is an event

            if (
                multiSelect &&
                !e.shiftKey &&
                keyDown &&
                (e.target.className.indexOf("fc-event-title") >= 0 ||
                    e.target.querySelector(".fc-event-title") ||
                    e.target.className.indexOf("fc-event-inner") >= 0 ||
                    e.target.querySelector(".fc-event-inner") ||
                    e.target.className.indexOf("fc-event-time") >= 0 ||
                    e.target.querySelector(".fc-event-time"))
            ) {
                inputs.comboActions.forEach(function (combo) {
                    // Ensure that every key of the desired key
                    // combination is being pressed, and apply
                    // the selected event changes

                    if (
                        combo.keys.every(function (key) {
                            return keyDown[key];
                        }) &&
                        Object.keys(keyDown).every(function (key) {
                            return combo.keys.indexOf(key) >= 0;
                        })
                    ) {
                        updateEvents(multiSelect, combo.eventChanges);
                    }
                });
            }
        });
    }, 20);

    // updateEvents() function takes a multiSelect object and an object
    // containing event changes. You should not need to edit below this line

    function updateEvents(multiSelect, changes) {
        var updatedEventCount = 0;
        var eventCount = Object.keys(multiSelect).length;
        var config = seedcodeCalendar.get("config");

        var updatingModalDiv;
        var updatingTimeout;
        var isUndo = false;
        var updatingModalStyle = {
            height: "auto",
            width: "400px",
            "margin-top": "20%"
        };
        var updatingModalContentStyle = {
            background: "rgba(0,0,0,0.75)",
            color: "white"
        };
        var revertMessage =
            '<span class="message-icon-separator success">' +
            '<i class="fa fa-lg fa-check"></i>' +
            "</span>" +
            "<span translate>Selected Events Updated</span>" +
            '<span class="message-separator"> | </span>' +
            "<span translate>Undo</span>" +
            '<span class="message-icon-separator" style="opacity: 0.8;"><i class="fa fa-lg fa-undo"></i></span>';

        showUpdatingModal();

        Object.keys(multiSelect).forEach(function (ce) {
            var changesObject = {};
            Object.keys(changes).forEach(function (property) {
                if (property === "start" || property === "end") {
                    if (moment.isDuration(changes[property])) {
                        changesObject[property] = multiSelect[ce].event[
                            property
                        ]
                            .clone()
                            .add(moment.duration(changes[property]));
                    } else {
                        changesObject[property] = moment(changes[property]);
                    }
                } else {
                    changesObject[property] = changes[property];
                }
            });
            multiSelect[ce].revertObject = {};
            Object.keys(changesObject).forEach(function (pk) {
                multiSelect[ce].revertObject[pk] = multiSelect[ce].event[pk];
            });

            setUpdatingTimeout(
                "Error occurred during save. Reverting changes.",
                true
            );
            dbk.updateEvent(
                multiSelect[ce].event,
                changesObject,
                recordFailedEdit,
                verifyFinished,
                {
                    isCustomAction: true
                }
            );
        });

        function setUpdatingTimeout(message, revert) {
            clearTimeout(updatingTimeout);
            updatingTimeout = setTimeout(function () {
                dbk.showMessage(message, 0, 3000, "error");
                if (revert && updatedEventCount > 0) {
                    revertChanges(true);
                } else {
                    clearUpdatingModal();
                }
            }, 10000);
        }

        function verifyFinished(
            updatedEvent,
            changesObject,
            revertObject,
            options,
            revertFunc,
            error
        ) {
            var failedEvents;
            var matchingEvent =
                multiSelect[
                    Object.keys(multiSelect).filter(function (mi) {
                        return (
                            multiSelect[mi].event.eventID ===
                            updatedEvent.eventID
                        );
                    })
                ];

            if (updatedEvent && matchingEvent) {
                updatedEventCount += 1;

                if (error) {
                    matchingEvent.error =
                        error.error && error.error.message
                            ? error.error.message
                            : error.message
                            ? error.message
                            : error.ERRORCODE
                            ? error.ERRORCODE + " - " + error.DESCRIPTION
                            : error.errorCode
                            ? error.errorCode
                            : "Unknown";
                } else {
                    matchingEvent.updated = true;
                    matchingEvent.sourceEvent = updatedEvent;
                }

                if (updatedEventCount >= eventCount) {
                    clearTimeout(updatingTimeout);
                    clearUpdatingModal();

                    if (isUndo) {
                        helpers.showMessage("Changes Reverted", 0, 3000);
                    } else {
                        failedEvents = Object.keys(multiSelect)
                            .filter(function (key) {
                                return multiSelect[key].error;
                            })
                            .map(function (key) {
                                return multiSelect[key];
                            });

                        if (failedEvents.length > 0) {
                            //One or more updates failed, revert all changes
                            utilities.showModal(
                                "Error during save",
                                failedEvents[0].error +
                                    ". Changes will be reverted.",
                                "continue",
                                revertChanges
                            );
                        } else {
                            //show a custom undo modal
                            helpers.showMessage(
                                revertMessage,
                                0,
                                5000,
                                null,
                                revertChanges
                            );
                        }
                    }
                    setTimeout(function () {
                        action.preventAction = false;
                        config.suppressEditEventMessages = false;
                    }, 50);
                    action.preventAction = false;
                }
            } else {
                clearUpdatingModal();
                if (isUndo) {
                    helpers.showMessage(
                        "Error during save - Unexpected result from editEvent function",
                        0,
                        5000,
                        "error"
                    );
                    setTimeout(function () {
                        action.preventAction = false;
                        config.suppressEditEventMessages = false;
                    }, 50);
                } else {
                    utilities.showModal(
                        "Error during save",
                        "Unexpected result from editEvent function. Changes will be reverted.",
                        "continue",
                        revertChanges
                    );
                }
            }
        }

        function recordFailedEdit(callback, targetEvent, error) {
            verifyFinished(targetEvent, null, null, null, null, error);
        }

        function revertChanges(showError) {
            isUndo = true;

            showUpdatingModal("Reverting Changes...");

            action.preventAction = true;
            if (showError) {
                setUpdatingTimeout(
                    "Error occurred while trying to undo changes - Timeout"
                );
            }
            updatedEventCount = 0;
            eventCount = Object.keys(multiSelect).filter(function (key) {
                return multiSelect[key].updated;
            }).length;

            if (eventCount > 0) {
                for (var key in multiSelect) {
                    if (multiSelect[key].updated) {
                        multiSelect[key].changesObject =
                            multiSelect[key].revertObject;
                        dbk.updateEvent(
                            multiSelect[key].event,
                            multiSelect[key].changesObject,
                            null,
                            verifyFinished,
                            {
                                isCustomAction: true
                            }
                        );
                    }
                }
            } else {
                clearUpdatingModal();
                setTimeout(function () {
                    action.preventAction = false;
                    config.suppressEditEventMessages = false;
                }, 50);
            }
        }

        //Function for modal window
        function showUpdatingModal() {
            if (!document.getElementById("eventArrayUpdatingModalDiv")) {
                var headerObject = document.createElement("h4");
                var headerDiv = document.createElement("div");
                var modalContentObject = document.createElement("div");
                var modalMainDiv = document.createElement("div");
                updatingModalDiv = document.createElement("div");
                updatingModalDiv.className = "modal fade in";
                updatingModalDiv.style.display = "block";
                modalMainDiv.className = "modal-dialog";
                Object.assign(modalMainDiv.style, updatingModalStyle);
                modalContentObject.className = "modal-content";
                Object.assign(
                    modalContentObject.style,
                    updatingModalContentStyle
                );
                headerDiv.className = "pad-large text-center";
                headerObject.innerText = "Updating Selected Events...";
                headerDiv.appendChild(headerObject);
                modalContentObject.appendChild(headerDiv);
                modalMainDiv.appendChild(modalContentObject);
                updatingModalDiv.appendChild(modalMainDiv);
                updatingModalDiv.id = "eventArrayUpdatingModalDiv";
                document.body.appendChild(updatingModalDiv);
            }
            config.suppressEditEventMessages = true;
        }

        ///Function for clearing modal window
        function clearUpdatingModal() {
            //Remove the updating modal div
            updatingModalDiv = document.getElementById(
                "eventArrayUpdatingModalDiv"
            );
            if (updatingModalDiv) {
                document.body.removeChild(updatingModalDiv);
            }
            setTimeout(function () {
                config.suppressEditEventMessages = false;
            }, 500);
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
