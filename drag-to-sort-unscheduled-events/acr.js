// Drag to Sort Unscheduled Events v1.0 - Part 1 of 5
//
// Purpose:
// Adds support for Unscheduled Event sorting 
// using drag and drop 
//
// Action Type: After Calendar Rendered
// Prevent Default Action: No
// 
// More info on custom actions here:
// https://docs.dayback.com/article/140-custom-app-actions

// Declare globals

var options = {}; var inputs = {};

try {
    //----------- Configuration -------------------

    // Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)
    // Leave this set to 0 to avoid unexpected behavior

    options.runTimeout = 0;

    // Define whether newly-added unscheduled events appear at the top, or on
    // bottom of the unscheduled event drawer

    inputs.newEventsOnTop = false;

    // You must also have at least one Calendar Source with Unscheduled 
    // Events enabled. Additionally, this app action requires the definition 
    // of 1 custom fields in every Calendar Source for which you wish to
    // enable Drag Drop sorting.
    //
    //    sortSequence   - stores the sort order of an unscheduled event.
    //                     this can be a number field with 0 decimals, 
    //                     or a text field.
    //                   - Set the field to "Hidden" to remove it from
    //                     your Custom Fields popover side-panel
    //

    inputs.sequenceFieldName = 'sortSequence';

    // You can optionally enable audio confirmation of drag drop events

    inputs.playSounds = true;

    // ------ You likely won't need to make configuration changes below this line ------

    // Defines what constitutes a Sortable Unscheduled Event. By default all Unscheduled Events 
    // that have the Sequence Field defined will be considered a Sortable Event. 

    inputs.isSortableEvent = function (event) {
        let sequenceFieldName = dbk.getCustomFieldIdByName(inputs.sequenceFieldName, event.schedule);
        return event.unscheduled && event.schedule.editable && sequenceFieldName && event.hasOwnProperty(sequenceFieldName) ? true : false;
    }

    //----------- End Configuration -------------------        
}
catch (error) {
    reportError(error);
}


//----------- The action itself: you may not need to edit this. -------------------


// Action code goes inside this function
function run() {

    // A Master Drag Drop Management Object will share all functions and state management
    // variables between all app actions.

    let ddmo = {};

    setDefaults();

    function setDefaults() {

        // Set Master Drag Drop Management Object defaults

        ddmo = {

            // Functions typically called from other libraries

            isSortableEvent: inputs.isSortableEvent,
            afterEventsRendered: afterEventsRendered,
            attachEventListeners: attachEventListeners,

            // Variable Getting/setting functions

            set: (item, value = undefined) => {
                ddmo.stateVariables[item] = value;
            },

            get: (item) => {
                return ddmo.stateVariables[item];
            },

            // Muti-time delay helper function

            delay: (items) => {

                Object.keys(items).forEach(function (i) {
                    setTimeout(items[i], i);
                });
            },

            // Sounds collection

            sounds: {
                moveComplete: undefined,
            },

            // Internal State Variables

            stateVariables: {
                sequenceFieldName: inputs.sequenceFieldName,
                newEventsOnTop: inputs.newEventsOnTop,

                draggingItem: false,
                mouseReleased: false,
                eventClickLock: false,
                enteredEvent: undefined,
                draggedEvent: undefined,
            }
        };

        seedcodeCalendar.init('_ddmoObject', ddmo);

        // Preload audiofiles and set volume

        if (inputs.playSounds) {
            setTimeout(function () {
                ddmo.sounds.moveComplete = new Audio('http://dayback.com/wp-content/calendar_sounds/move.mp3');
                ddmo.sounds.moveComplete.volume = 0.1;
            }, 1000);
        }

        // Adds a Mouse Up listener to detect when a native drag drop event concludes  
        // If the user drags the event over to the scheduling area, disable drag drop
        // state tracking for drag drop sort 

        document.addEventListener("mouseup", mouseUpListener);

        setTimeout(function () {
            let calendar = document.getElementById('calendar');
            calendar?.addEventListener('mouseenter', clearedEventDragStates);
        }, 1000);

        function mouseUpListener() {
            if (ddmo.get('draggingItem') == true) {
                ddmo.set('mouseReleased', true);
            }
        }
    }

    // Helper function clears the Drag/Drop state if a Dragged 
    // item enteres the Calendar space for scheduling.

    function clearedEventDragStates() {
        ddmo.set('mouseReleased', true);
        ddmo.set('draggingItem', false);
        ddmo.set('draggedEvent', null);
        ddmo.set('enteredevent', null);
    }

    // Main Helper Functon called from After Events Rendered.
    // Function adds the "Add To Do" scheduling form and adds
    // state change listeners for filtering events that trigger
    // a repopulation of the event list.

    function afterEventsRendered() {

        // After all elements are painted, attach event listeners.
        // Also attach listeners to the textarea filter to detect if the
        // unscheduled event list triggers a change. If a filter results 
        // in a change, we need to reattach all event listeners again 
        // after all objects are loaded. 

        setTimeout(function () {
            ddmo.attachEventListeners();
            let textarea = document.querySelector('.unscheduled textarea');
            let button = document.querySelector('.unscheduled-filter button');
            textarea.onkeyup = detectChange;
            textarea.onpropertychange = detectChange;
            button.onclick = detectChange;
            function detectChange() {
                setTimeout(ddmo.attachEventListeners, 50);
            }
        }, 50);

    }

    function attachEventListeners() {

        var events = seedcodeCalendar.get('element').fullCalendar('unscheduledClientEvents');

        events.forEach(event => {

            let cells = document.querySelectorAll('[data-id="' + event['_id'] + '"]');
            if (!cells) {
                return;
            }

            cells.forEach(cell => {

                // Add drag and mouseenter handlers

                if (ddmo.isSortableEvent(event) || (event.schedule.editable && !cell.classList.contains('sortableUnscheduledEvent'))) {
                    cell.draggable = true;
                    cell.classList.add('sortableUnscheduledEvent');
                    cell.ondragstart = function (ev) { dragStartHandler(ev, cell, event); };
                    cell.addEventListener("mouseenter", mouseEnterHandler);
                } else {
                    cell.ondragstart = undefined;
                    cell.removeEventListener("mouseenter", mouseEnterHandler);
                    cell.classList.remove('sortableUnscheduledEvent');
                }
            });

            function mouseEnterHandler() {

                if (ddmo.get('draggingItem') == true && event.unscheduled) {
                    ddmo.set('enteredEvent', event);

                    if (ddmo.get('mouseReleased')) {
                        ddmo.set('mouseReleased', false);
                        ddmo.set('draggingItem', false);
                        let textarea = document.querySelector('.unscheduled textarea');
                        if (textarea.value == '') {
                            moveEvents();
                        } else {
                            alert("Cannot sort a filtered list");
                        }
                    }
                }
            }
        });

        // Helper function sets variables that track which events
        // are being dragged and dropped. Function also removes the
        // No events found modal, and Drop Target Cover if the dragged
        // event is an Unscheduled event. This allows the Drag drop
        // to initiate a sorting function when the mouse is released.

        function dragStartHandler(ev, cell, event) {

            cell.classList = ev.currentTarget.classList;

            ddmo.set('mouseReleased', false);
            ddmo.set('draggingItem', true);
            ddmo.set('draggedEvent', event);
            ddmo.set('enteredevent', null);

            const noEventsModal = document.querySelector('.no-events-modal');
            if (noEventsModal) {
                noEventsModal.style.display = 'none';
            }

            dbk.observe({
                name: 'dragCover' + event['_id'],
                watch: '.alt-view-container',
                until: '.drag-target-cover',
                then: function (o) {
                    o.destroy();
                    let cover = document.querySelector('.drag-target-cover');
                    cover.parentNode.removeChild(cover);
                }
            });
        }
    }

    // Helper function actually performs the appropriate re-sorting of events
    // building a multiSelect object of Event changes to propagate the 
    // new sequence of the events after sorting of the drop/drag list is finished

    function moveEvents() {

        // Get Sorted Events

        var unscheduled = seedcodeCalendar.get('element').fullCalendar('unscheduledClientEvents');
        var events = unscheduled.filter((e) => ddmo.isSortableEvent(e));

        events.sort((a, b) => {
            let fa = dbk.getCustomFieldIdByName(inputs.sequenceFieldName, a.schedule);
            let fb = dbk.getCustomFieldIdByName(inputs.sequenceFieldName, b.schedule);
            return a[fa] - b[fb];
        });

        let entered = ddmo.get('enteredEvent');
        let dragged = ddmo.get('draggedEvent');

        let index1 = events.findIndex(e => e.eventID === entered.eventID);
        let index2 = events.findIndex(e => e.eventID === dragged.eventID);

        // Get re-sorted array

        let sEvents = moveArrayIndex(events, index2, index1);
        if (sEvents.length > 0) {

            let sequence = 0;
            sEvents.forEach((e) => {
                sequence++;
                e.newUnscheduledSequence = sequence;
            });

            // Build multiUpdate object

            let multiUpdate = {};

            sEvents.forEach((e) => {
                let fieldId = dbk.getCustomFieldIdByName(inputs.sequenceFieldName, e.schedule);
                if (e[fieldId] != e.newUnscheduledSequence && e.newUnscheduledSequence != '') {
                    multiUpdate[e.eventID] = { event: e };
                }
            });

            if (Object.keys(multiUpdate).length > 0) {

                // Clear no-events popover
                const noEventsModal = document.querySelector('.no-events-modal');
                if (noEventsModal) {
                    noEventsModal.style.display = 'none';
                }

                updateEvents(multiUpdate, dragged.eventID);
            }
        }

        // Helper function to move an element within an array from the 'old_index' to the 'new_index'

        function moveArrayIndex(arr, old_index, new_index) {
            while (old_index < 0) {
                old_index += arr.length;
            }
            while (new_index < 0) {
                new_index += arr.length;
            }
            if (new_index >= arr.length) {
                var k = new_index - arr.length;
                while ((k--) + 1) {
                    arr.push(undefined);
                }
            }
            arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
            return arr;
        }
    }

    // Multi-update function to update the sequence number of events after new sort has been achieved

    function updateEvents(multiSelect, updatedEventId) {
        var updatedEventCount = 0;
        var eventCount = Object.keys(multiSelect).length;
        var config = seedcodeCalendar.get("config");

        var updatingModalDiv;
        var updatingTimeout;
        var isUndo = false;
        var updatingModalStyle = {
            height: "auto",
            width: "400px",
            "margin-top": "20%",
        };
        var updatingModalContentStyle = {
            background: "rgba(0,0,0,0.75)",
            color: "white",
        };
        var revertMessage =
            '<span class="message-icon-separator success">' +
            '<i class="fa fa-lg fa-check"></i>' +
            "</span>" +
            "<span translate>Events have been re-sorted</span>" +
            '<span class="message-separator"> | </span>' +
            "<span translate>Undo</span>" +
            '<span class="message-icon-separator" style="opacity: 0.8;"><i class="fa fa-lg fa-undo"></i></span>';

        showUpdatingModal();

        Object.keys(multiSelect).forEach(function (ce) {
            var changesObject = {};
            var event = multiSelect[ce].event;
            const fieldId = dbk.getCustomFieldIdByName(inputs.sequenceFieldName, event.schedule);

            changesObject[fieldId] = event.newUnscheduledSequence;

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
                verifyFinished, {
                isCustomAction: true,
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
            var matchingEvent = multiSelect[
                Object.keys(multiSelect).filter(function (mi) {
                    return multiSelect[mi].event.eventID === updatedEvent.eventID;
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
                                failedEvents[0].error + ". Changes will be reverted.",
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
                        multiSelect[key].changesObject = multiSelect[key].revertObject;
                        dbk.updateEvent(
                            multiSelect[key].event,
                            multiSelect[key].changesObject,
                            null,
                            verifyFinished,
                            {
                                isCustomAction: true,
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

        // Function for modal window

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
                Object.assign(modalContentObject.style, updatingModalContentStyle);
                headerDiv.className = "pad-large text-center";
                headerObject.innerText = "Sorting Events...";
                headerDiv.appendChild(headerObject);
                modalContentObject.appendChild(headerDiv);
                modalMainDiv.appendChild(modalContentObject);
                updatingModalDiv.appendChild(modalMainDiv);
                updatingModalDiv.id = "eventArrayUpdatingModalDiv";
                document.body.appendChild(updatingModalDiv);
            }
            config.suppressEditEventMessages = true;

            let ulist = document.querySelector('.unscheduled-container .unscheduled-list');
            ulist.classList.add('unscheduledSaveFade');

        }

        // Function for clearing modal window
        function clearUpdatingModal() {

            // Remove the updating modal div
            updatingModalDiv = document.getElementById("eventArrayUpdatingModalDiv");
            if (updatingModalDiv) {
                document.body.removeChild(updatingModalDiv);
            }
            setTimeout(function () {
                config.suppressEditEventMessages = false;
            }, 500);

            // Reprocess the sorted list, and add a fade animation to highlight to new drag 
            // target position when the resequencing of events finishes. 

            let ulist = document.querySelector('.unscheduled-container .unscheduled-list');
            ulist.classList.remove('unscheduledSaveFade');
            ddmo.set('draggedEvent', null);
            reprocessEvents();
        }

        // Helper function applies the respective animations

        function reprocessEvents() {

            var events = seedcodeCalendar.get('element').fullCalendar('unscheduledClientEvents');

            seedcodeCalendar.get('element').fullCalendar('rerenderUnscheduledEvents');

            var events = seedcodeCalendar.get('element').fullCalendar('unscheduledClientEvents');
            let draggedEvent = events.filter(event => event.eventID == updatedEventId);

            if (draggedEvent.length) {
                let div = document.querySelector('[data-id="' + draggedEvent[0]._id + '"]');
                div.classList.add('unscheduledDropFade');
                ddmo.sounds.moveComplete?.play();
                setTimeout(function () {
                    div.classList.remove('unscheduledDropFade');
                }, 1000);
            }
        }
    }
}

//----------- Run function wrapper and helpers - you shouldn’t need to edit below this line. -------------------

// Variables used for helper functions below
var timeout;

// Execute the run function as defined above
try {

    if (!options.restrictedToAccounts ||
        !options.restrictedToAccounts.length ||
        (options.restrictedToAccounts && options.restrictedToAccounts.indexOf(inputs.account) > -1)
    ) {
        if (action.preventDefault && options.runTimeout) {
            timeoutCheck();
        }
        run();
    }
    else if (action.preventDefault) {
        confirmCallback();
    }
}
catch (error) {
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
    timeout = setTimeout(function () {
        var error = {
            name: 'Timeout',
            message: 'The action was unable to execute within the allotted time and has been stopped'
        };
        reportError(error, true);
    }, (options && options.runTimeout ? options.runTimeout * 1000 : 0));
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
    var errorMessage = '<p>There was a problem running the action "<span style="white-space: nowrap">' + action.name + '</span>"</p><p>Error: ' + error.message + '.</p><p>This may result in unexpected behavior of the calendar.</p>';
    if (action.preventDefault && timeout) {
        confirmCallback();
    }
    else {
        cancelCallback();
    }

    setTimeout(function () {
        utilities.showModal(errorTitle, errorMessage, null, null, 'OK', null, null, null, true, null, true);
    }, 1000);
}