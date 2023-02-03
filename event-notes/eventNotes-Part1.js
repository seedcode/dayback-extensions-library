// Event Notes - Part 1
//
// Purpose:
// Adds event notes feature to events in any view
// This component loops through rendered events and adds
// notes icons and note editing capabilities.
//
// Action Type: After Events Rendered
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

        // Define the Field Name of the Custom Field that contains notes for each calendar 
        //
        // If you have multiple sources and all share the same field name, simply
        // declare this as a string variable:
        //
        //      inputs.notesFieldName = 'notes';
        //
        // If you have multiple sources, with a different field names for each 
        // source, declare an object containing the calendar name, and the field
        // name that it applicable to that calendar:
        //
        //      inputs.notesFieldName = {
        //           'Marketing': 'notesFieldName1',
        //           'Sales': 'notesFieldName1',
        //      }
    
        inputs.notesFieldName = {
            'SeedCode Shared': 'notes'
        };
        
        // Define default icon color when a notes exists
        
        inputs.iconColorWithNote = "#0000AA";        

        // Define default icon color for events without a note.
        // The default is to leave this empty, which will automatically paint
        // empty icons with 150% brightness of existing event color

        inputs.iconColorWithoutNote = "";

        // Define default icon for empty notes cells in Horizon view. 
        // Since notes icons are not displayed within the event pill, but inside
        // the text portion, coloring by event color would be misleading users
        // into assuming there is a note. Leave this set to white by default.

        inputs.horizonIconColorWithoutNote = "#FFFFFF";

        // By default, all events are eligible for notes. If you would like to
        // exclude some events, you may define a custom exclusion function 
        // which returns false if an event should be excluded. This can be
        // useful if you only want some accounts to have the ability to comment
        // or if comments should be allowed only in certain statuses. If you don't
        // want to restrict comments, simply remove this function, or have it
        // always return true.
        //
        // Useful Filters:
        //
        //      // Exclude all day events in resource view
        //
        //          let isResourceView = inputs.currentView.name.match(/resource/i);
        //          return event.allDay == true && isResourceView ? false : true;
        //
        //      // Exclude completed items
        //
        //          return event['status'].includes('Completed') ? false : true;
        //
        //      // Allow for specific users
        //          
        //          return inputs.currentUser == 'John' || inputs.currentUser == 'Ann' ? true : false; 

        // The followig declares commonly used variables which can be used
        // to restrict which events are eligible for notes
        
        inputs.currentUser = seedcodeCalendar.get('config').accountName;
        inputs.currentView = seedcodeCalendar.get('view');
        inputs.isHorizonView = inputs.currentView.name.match(/horizon/i);

        inputs.includeEventIfTrue = function (event) {

             // All events are eligible
            return true;
        }

   //----------- End Configuration -------------------        
}
catch(error) {
    reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
    
    addNotesIcons();
    
    function addNotesIcons() {
        
        const tooltipFunction = seedcodeCalendar.get("tooltipFunction");
    
        var clientEvents = seedcodeCalendar
            .get("element")
            .fullCalendar("clientEvents");
        
        var events;

        if (typeof inputs.includeEventIfTrue == 'function') {        
            events = clientEvents.filter((event) => {
                return inputs.includeEventIfTrue(event) && getNotesFieldId(event) !== undefined
            }); 
        } else {
            events = clientEvents.filter((event) => {
                return getNotesFieldId(event) !== undefined
            }); 
        }
    
        // Add notes elements to events 
    
        events.forEach((event) => {
    
            let pills = [];

            let regularpills = document.querySelectorAll(
                '[data-id="' + event._id + '"]>div>.fc-event-time'
            );
    
            let micropills = document.querySelectorAll(
                '[data-id="' + event._id + '"]>div.fc-event-inner.event-constrain'
            );

            if (inputs.isHorizonView) {
                let horizonpills = document.querySelectorAll(
                    '[data-id="' + event._id + '"]>div.nub-content'
                );

                if (horizonpills) 
                 pills.push(...horizonpills);

            } else {

            if (regularpills) 
                pills.push(...regularpills);

            if (micropills)
                pills.push(...micropills);

            }

            if (!pills || pills.length < 1) {
                return;
            }
    
            pills.forEach((e) => {
                
                if (e.classList.contains('wrapTime')) {
                    return;
                }
    
                e.classList.add("wrapTime");
                e.innerHTML = '<div class="wrapper">' + e.innerHTML + "</div>";
    
                let div = document.createElement("DIV");
                div.dataset.notesEventId = event._id;
                div.dataset.id = 'notes_' + event._id;
    
                // By default, only register click handler if we have no annotatation
                // If notess exist, register mouse over listener
    
                let notesText = getNotesText(event);
                
                div.addEventListener("mouseenter", function() { showNotesTooltip('hover', div); } );
                div.addEventListener("mouseleave", function() {setTimeout(function() { seedcodeCalendar.init('disableEventClick', undefined); }, 150); });
    
                let i = document.createElement("I");
                i.classList = "fa fa-comment";
    
                if (notesText == '') {
                    i.onclick = function() { showNotesTooltip('click', div); };
                } else {
                    i.onclick = null; 
                }

                paintNotesIcon(event);
    
                function paintNotesIcon(event) {
    
                    let notesText = getNotesText(event);
    
                    if (notesText != "") {
                        div.classList = "eventNotes annotated";
                    } else {
                        div.classList = "eventNotes empty";
                    }
    
                    if (notesText != "") {
                        i.style.setProperty("--background", inputs.iconColorWithNote);
                        i.style.filter = "brightness(150%) !important";
                    } else if (inputs.isHorizonView && inputs.horizonIconColorWithoutNote != '') {
                        i.style.setProperty("--background", inputs.horizonIconColorWithoutNote);
                    } else if (!inputs.isHorizonView && inputs.iconColorWithoutNote != '') {
                        i.style.setProperty("--background", inputs.iconColorWithoutNote);
                    } else {
                        var opacityFix = event.color;
                        opacityFix = opacityFix.replace(
                            /rgba\(([\d\.]+, ?[\d\.]+, ?[\d\.]+), ?[\d\.]+\)/,
                            "rgba($1,1)"
                        );
    
                        i.style.setProperty("--background", opacityFix);
                        i.style.filter = "brightness(150%) !important";
                    }
                }
    
                div.appendChild(i);
                e.appendChild(div);
    
                function showNotesTooltip(trigger, div) {
    
                    // Obtain the active event
    
                    let eventId = div.dataset.notesEventId;
    
                    var clientEvents = seedcodeCalendar
                        .get("element")
                        .fullCalendar("clientEvents");
                    var events = clientEvents.filter((event) => {
                        return event._id == eventId;
                    });
    
                    if (!events || events.length < 1) {
                        return;
                    }
    
                    // Disable event pill clicking
                    seedcodeCalendar.init('disableEventClick', true);
    
                    // Grab whether we have notes or not
    
                    var notesText = getNotesText(events[0]);
                    var hasNotes = notesText == '' ? false : true;
    
                    // Disable clicking on the event pill
                    if (hasNotes && trigger == 'click') {
                        return;
                    } else if (!hasNotes && trigger == 'hover') {
                        return;
                    }
    
                    notesText =
                        '<div class="editNotes scrollableNotes">' +
                        encodeHTMLEntities(notesText) +
                        "</div>";
    
                    const showDelay = trigger == 'click' ? 0 : 350;
    
                    var tooltip = tooltipFunction(notesText, {
                        delay: { show: showDelay, hide: 100 },
                        targetElement: div,
                        postRenderFunction: postRenderFunction,
                        postDestroyFunction: postDestroyFunction
                    });
    
                    
                    function postDestroyFunction() {
                        // Enable event pill clicking after tooltip is destroyed
                        tooltip.setKeepAlive(false);
                        seedcodeCalendar.init('lastOpenTooltip', undefined);
                        setTimeout(function() { seedcodeCalendar.init('disableEventClick', undefined); }, 150);
                    }
    
                    function postRenderFunction() {
                        seedcodeCalendar.init('lastOpenTooltip', tooltip);
    
                        var config = seedcodeCalendar.get("config");
    
                        // Disable clicking on event pills while tooltip is showing
                        seedcodeCalendar.init('disableEventClick', true);
    
                        // Add click handlers to the popover to start notes editing
                        var retries = 200;
                        var changesBackup = {};
                        
                        registerClickHandlers();
    
                        function registerClickHandlers() {
    
                            let tooltipContainer = document.querySelector(".tooltip.tooltip-custom");
    
                            let clickable = document.querySelector(".tooltip.tooltip-custom .editNotes");
    
                            if (clickable && hasNotes) {    
                                tooltipContainer.addEventListener("click", buildEditRow);
                            } else if (clickable && !hasNotes) {
                                buildEditRow();
                            } else if (retries > 0) {
                                retries--;
                                setTimeout(registerClickHandlers, 50);
                            }
                        }
    
                        // Row construction functions
    
                        function buildEditRow() {
    
                            let tooltipContainer = document.querySelector(".tooltip.tooltip-custom");
                            let clickable = document.querySelector(".tooltip.tooltip-custom .editNotes");
    
                            let moveTooltip = false;
                            let position = tooltipContainer.classList.contains('top') ? 'top' : 'bottom';
    
                            clickable.classList.remove('scrollableNotes');
    
                            // Remove click listener and repaint inner text
    
                            tooltip.setKeepAlive(true);
                            tooltipContainer.removeEventListener("click", buildEditRow);
                            clickable.innerText = "";
    
                            let notesText = getNotesText(events[0]);
    
                            let textareaDiv = document.createElement("DIV");
                            textareaDiv.classList = "textareaDiv";
    
                            let textarea = document.createElement("TEXTAREA");
                            textarea.rows = 3;
                            textarea.classList =
                                "form-control ng-pristine ng-valid ng-touched";
                            textarea.value = notesText;
    
    
                            let buttonsDiv = document.createElement("DIV");
                            buttonsDiv.classList = "buttonsDiv";
    
                            let saveButton = document.createElement("BUTTON");                        
                            saveButton.classList =
                                "btn btn-xs btn-success dbk_button_success saveButton";
                            saveButton.innerHTML = '<i class="fa fa-fw fa-check"></i>';
                            saveButton.onclick = function () { saveButton.disabled = true; updateEvent(events[0], textarea.value, clickable); };
    
                            let deleteButton = document.createElement("BUTTON");
                            deleteButton.classList =
                                "btn btn-xs btn-default text-danger dbk_button_text_danger deleteButton";
                            deleteButton.innerHTML =
                                '<i class="fa fa-fw fa-trash"></i>';
                            deleteButton.onclick = function () { deleteButton.disabled = true; updateEvent(events[0], '', clickable); };
    
                            if (notesText == '') {
                                deleteButton.style.display = 'none';
                            }
    
                            let cancelButton = document.createElement("BUTTON");
                            cancelButton.classList =
                                "btn btn-xs btn-default text-danger dbk_button_text_danger cancelButton";
                            cancelButton.innerHTML =
                                '<i class="fa fa-fw fa-times"></i>';
                            cancelButton.onclick = function () { closeNotesTooltip(); };
    
                            buttonsDiv.appendChild(saveButton);
                            buttonsDiv.appendChild(deleteButton);  
                            buttonsDiv.appendChild(cancelButton);  
    
                            // Clear out text
    
                            textareaDiv.appendChild(textarea);
                            clickable.appendChild(textareaDiv);
                            clickable.appendChild(buttonsDiv);

                            textarea.focus();
                        }
    
                        function closeNotesTooltip() {
                            // Handle Tooltip color changes
                            tooltip.setKeepAlive(false);
                            tooltip.hide(true);
                            paintNotesIcon(event);
                        }
    
                        // Action Buttons
    
                        function updateEvent(event, notesText, clickable) {
                            let fieldKey = getNotesFieldId(event);
                            let changes = {};
                            changes[fieldKey] = notesText;
                            changesBackup[fieldKey] = event[fieldKey];
    
                            let messageText;
    
                            if (changesBackup[fieldKey] != '' && notesText == '') {
                                messageText = 'Note Deleted';
                            } else if (changesBackup[fieldKey] == '' && notesText != '') {
                                messageText = 'Note Created';
                            } else {
                                messageText = 'Note Updated';
                            }
    
                            var revertMessage =
                            '<span class="message-icon-separator success">' +
                            '<i class="fa fa-lg fa-check"></i>' +
                            "</span>" +
                            "<span translate>" + messageText + "</span>" +
                            '<span class="message-separator"> | </span>' +
                            "<span translate>Undo</span>" +
                            '<span class="message-icon-separator" style="opacity: 0.8;"><i class="fa fa-lg fa-undo"></i></span>';
    
                            action.preventAction = true;
                            config.suppressEditEventMessages = true;
    
                            dbk.updateEvent(
                                event,
                                changes,
                                null,
                                verifyFinished,
                                {  isCustomAction: true }
                            );
    
                            function verifyFinished() {
    
                                action.preventAction = false;
                                config.suppressEditEventMessages = false;
        
                                setTimeout(function () {
                                    helpers.showMessage(
                                        revertMessage,
                                        0,
                                        5000,
                                        null,
                                        revertChanges
                                    )
                                }, 100);
        
                                // Handle Tooltip color changes
                                closeNotesTooltip();
                            }
        
                            function revertChanges() {
                                action.preventAction = true;
                                config.suppressEditEventMessages = true;
        
                                dbk.updateEvent(
                                    event,
                                    changesBackup,
                                    null,
                                    verifyUndone,
                                    { endShifted: false, isCustomAction: true, isUndo: false }
                                );
        
                            }
        
                            function verifyUndone() {
                                
                                action.preventAction = false;
                                config.suppressEditEventMessages = false;
        
                                setTimeout(function () {
                                    helpers.showMessage(
                                        '<span class="message-icon-separator success">' +
                                        '<i class="fa fa-lg fa-check"></i>' +
                                        "</span>" +
                                        "<span translate>Changes Reverted</span>"
                                    );
                                }, 100);
                            }                        
                        }                    
    
                    } // End Post Render Function
    
                } // End showNotesTooltip
            });
    
        });
    }
    
    // ----- Helper Function -----
    
    // Get notes text from the correct custom field name for the given schedule
    
    function getNotesFieldId(event) {
        let fieldName;

        if (typeof inputs.notesFieldName !== 'object') {        
            fieldName = inputs.notesFieldName;
        } else if (typeof inputs.notesFieldName === 'object' && inputs.notesFieldName.hasOwnProperty(event.schedule.name)) {
            fieldName = inputs.notesFieldName[event.schedule.name];
        } else {
            return;
        }
        
        return dbk.getCustomFieldIdByName(fieldName, event.schedule);
    }
    
    function getNotesText(event) {
        let fieldId = getNotesFieldId(event);
        return event.hasOwnProperty(fieldId) ? event[fieldId] : '';                   
    }
    
    function encodeHTMLEntities(s) {
        let textArea = document.createElement('textarea');
        textArea.innerText = s;
        return textArea.innerHTML;
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
catch(error) {
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
    timeout = setTimeout(function() {
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
    
    setTimeout(function() {
        utilities.showModal(errorTitle, errorMessage, null, null, 'OK', null, null, null, true, null, true);
    }, 1000);
}  

