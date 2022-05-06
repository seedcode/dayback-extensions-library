// Multi Update Button Menu - Part 1 v1.0
//
// Purpose:
// Adds a single button, multiple buttons, or container
// of buttons to DayBack bottom right. This is Part 1 of
// a 2-part Custom App Action. Action reuse code from
// Add Custom Button app action.
// https://dayback.com/listing/custom-action-menu/
// 
// Action Type: Before Calendar Rendered
// Prevent Default Action: Yes
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
        
        // If you only intend to create one group of buttons, you may leave this option 
        // set to 'custom_btn' by default. If you want multiple collapsible button groups,
        // define the CSS class group name used for styling this particular button group.
        //
        // If creating multple button groups, you may duplicate this app action multiple 
        // times with a whole new list of button definitions, and unique cssGroupName. 
        // the CSS will need to be modified to align multiple groups on the screen.

        options.cssGroupName = 'custom_btn';

        // Defines the current account name running this action. Leave this defined
        // to the default. You may use the inputs.accountName to restrict buttons to 
        // certain individuals.
        
        inputs.accountName = seedcodeCalendar.get('config').accountName;

        // Defines whether you wish to have a parent button that acts like a container
        // drawer for multiple grouped buttons. By default this is set to false. 
        // Containers work best if you are defining more than 1 button and don't want to 
        // clutter your screen.
        //
        // If you don't mind having multiple buttons that always appear on the screen, 
        // or you just have a single button leave this set to false.

        inputs.showContainer = true;

        // If showing button container drawer, specify if the button should be 
        // closed, or open when DayBack loads. The default is to show the container
        // as closed so the buttons appear when you hover over the container.
        
        inputs.showContainerAsOpen = false;

        // Define Your Buttons:
        // --------------------
        //
        // Define an array of buttons. Available parameters are as follows:
        // An asterisk denoted a required parameter:
        // 
        //      * icon:     Specify the icon you want shown for a given button. 
        //                  Instructions provided below.
        //
        //      * action:   Defines the JavaScript function the button should run
        //                  when clicked. You will need to define each function 
        //                  in the specific section below.
        //
        //      label:      Define a label name that should appear next to your button.
        //                  This is optional, and does not need to be defined if 
        //                  you don't need a label next to your button.
        //
        //      color:      Specify a button's color (e.g., #FFFFF or white, or 
        //                  rgb(256,256,256)). The color is optional. If you omit
        //                  color the default color will be used.
        //      
        //      restrict:   By default a button will be shown to all users. If you 
        //                  want to restrict who sees this button, you can specify a 
        //                  JavaScript function that returns true if a button is 
        //                  allowed, and false if it should be hidden.
        //
        //      uniqueId:   Specify a unique ID of the button. This ID can be used
        //                  Custom App Actions to show/hide a button on specific 
        //                  pages. To specify which buttons show on which view pages
        //                  please also install the Hide Custom Button On View Change
        //                  custom app action.

        // Example JavaScript Action:
        // --------------------------
        //
        // By default, we provide an example customButtonAction_goToBookmark() function
        // which will accept a Bookmark ID as a parameter. DayBack will open the Bookmark
        // when the button is clicked. You can use this as an outline for how to hook
        // functions. 
        //
        // How to specify button icons:
        // ----------------------------
        //
        // Find your Icon's Unicode definition:
        //
        // 1. Locate icon on cheat sheet: https://fontawesome.com/v4.7/icons/
        // 2. Specify the icon using 'fa-' followed by the english name. 
        //    For example: check mark should be specified as fa-check

        // Specify buttons from bottom up

        inputs.buttonList = [        
            {
                'label': 'Set Status: Done',
                'icon': 'fa-check',
                'color': '#3164d2',
                'action': function() { 

                    // Define a list of changes that should be made in the editEvent
                    // object when this button is clicked. Please see this reference
                    // for a collection of editable fields inside the editEvent object
                    // https://docs.dayback.com/article/124-action-objects-methods#editEvent
                    
                    let eventChanges = {
                        status: ['Done']
                    };

                    return confirmEventChanges(eventChanges); 
                },
            },
            {
                'label': 'Set Status: Pending',
                'icon': 'fa-calendar',
                'color': '#00AA00',
                'action': function() { 

                    let eventChanges = {
                        status: ['Pending']
                    };

                    return confirmEventChanges(eventChanges); 
                },
            },
        ];

        //----------- Define Custom Button functions here -----------
    
        // Generic Event changes confirmation function that takes an object
        // of values that should be applied to the editEvent object for all
        // selected events

        function confirmEventChanges(eventChanges) {
            
            var multiSelect = seedcodeCalendar.get("multiSelect");
            var itemCount   = multiSelect !== undefined ? Object.keys(multiSelect).length : 0;

            if (itemCount > 0) {
                utilities.showModal(
                    "Confirm Changes", 
                    "Please confirm you want to update " + itemCount + " events",
                    'Cancel', 
                    function() {}, 
                    'Confirm', 
                    function() { updateEvents(multiSelect, eventChanges); }
                );
            } else {
                helpers.showMessage("Please select one or more events", 0, 3000);
            }        
        }
     
        // Example button access restriciton function that checks if a button should be shown or not

        function restrictButtonAccess(buttonName) {
            // Validate access for specific named buttons
            if (buttonName === 'Sales Workflow' && inputs.accountName !== 'Michael Dabrowski') {                
                // Hide Button
                return false;
            }
            
            // Show button
            return true;
        }

    //----------- End Configuration --------------------  

    // Multi Select Update Code base on Keycombo batch edit code app action
    // https://github.com/seedcode/dayback-keycombo-batch-edit
    // You should not need to edit below this line 
    //
    // Function takes a multiSelect object, and an object of changes to be
    // applied to an event. You can supply any editable event variables that should
    // https://docs.dayback.com/article/124-action-objects-methods#editEvent

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
            "<span translate>Selected Events Updated</span>" +
            '<span class="message-separator"> | </span>' +
            "<span translate>Undo</span>" +
            '<span class="message-icon-separator" style="opacity: 0.8;"><i class="fa fa-lg fa-undo"></i></span>';

        showUpdatingModal();
    
        Object.keys(multiSelect).forEach(function (ce) {
            var changesObject = {};
            Object.keys(changes).forEach(function (property) {
                if (property === 'start' || property === 'end') {
                    if (moment.isDuration(changes[property])) {
                        changesObject[property] = multiSelect[ce].event[property].clone().add(moment.duration(changes[property]));
                    }
                    else{
                        changesObject[property] = moment(changes[property]);
                    }
                }
                else {
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
                verifyFinished,{
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
                Object.assign(modalContentObject.style, updatingModalContentStyle);
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
        }
    }

    // End Multi Select Update Code
}
catch(error) {
    reportError(error);
}


//----------- The action itself: you may not need to edit this. -------------------


// Action code goes inside this function
function run() {

    // Define variables that wait for parent CSS page element to be loaded
    var maxRetries = 20;
    var retries    = 0;

    // Create the button drawer while checking CSS parent element load status
    createButtonDrawer();

    // Once all is loaded, confirm callback and run other functions configured for this handler
    return confirmCallback();

    // Handle creation of button
    function createButtonDrawer() {

        var cssGroupName = options.cssGroupName;
        var drawerBtnContainer;
        var drawerBtn;
        var drawerBtnI;
        var drawerBtnUlList;
        
        var rootBtnContainer = document.querySelector('.calendar-button-container');

        if (rootBtnContainer) {                        

            // Add Drawer Container
            drawerBtnContainer               = document.createElement('div');
            drawerBtnContainer.id            = options.cssGroupName + "_containerId";
            drawerBtnContainer.classList     = inputs.showContainer ? cssGroupName + '_container' : cssGroupName + '_container_static';
            drawerBtnContainer.style.cursor  = 'pointer';

            // Add Drawer Button
            drawerBtn                        = document.createElement('div');
            drawerBtn.id                     = cssGroupName + 'Icon';
            drawerBtn.dataset.rotatedFlag    = 0;
            drawerBtn.classList              = cssGroupName + ' ' + cssGroupName + '_icon_holder';
            drawerBtn.onclick                = drawerButtonClick;

            // Add Drawer Button Icon
            drawerBtnI                       = document.createElement('i');
            drawerBtnI.id                    = cssGroupName + 'IconClass';
            drawerBtnI.classList             = 'fa';

            // Add a Button Container Drawer if we have a multi-button group
            // Otherwise allow users to display a static list of buttons, or 
            // single button if they don't need more than one.

            if (inputs.showContainer) {

                // Add Button Icon to Container
                drawerBtn.append(drawerBtnI);
                drawerBtnContainer.append(drawerBtn);

                // Add Sub List to Container
                drawerBtnUlList              = document.createElement('ul');
                drawerBtnUlList.id           = cssGroupName + 'IconOptionList';
                drawerBtnUlList.classList    = cssGroupName + '_options ' + cssGroupName + '_option_hidden'; 

            } else {

                // Add Sub List to Container
                drawerBtnUlList              = document.createElement('ul');
                drawerBtnUlList.id           = cssGroupName + 'IconOptionList';
                drawerBtnUlList.classList    = cssGroupName + '_options_static'; 
            }

            // Build buttons from bottom to top
            for (var i = inputs.buttonList.length -1; i >= 0; i--) {                        

                // Grab button object
                var bObj = inputs.buttonList[i];

                // Check permissions
                if (bObj.hasOwnProperty('restrict') && bObj.restrict() == false) {
                    continue;
                }

                // Make list element containing sub-buttons
                var btnLi                   = document.createElement('il');
                var btnLi_span              = document.createElement('span'); 
                var btnLi_contDiv           = document.createElement('div');
                var btnLi_div               = document.createElement('div');
                var btnLi_i                 = document.createElement('i');
                var labelId                 = cssGroupName + '_IconLabel_' + i;
                var labelText;

                btnLi_div.id                = cssGroupName + '_IconDiv_' + i;
                btnLi.classList             = inputs.showContainer ? cssGroupName + '_options_li' : cssGroupName + '_options_li_static';

                if (bObj.hasOwnProperty('uniqueId') && bObj.id !== null) {
                    btnLi.id = bObj.uniqueId;
                }

                if (bObj.hasOwnProperty('color') && bObj.label !== null) {
                    btnLi_div.style.background = bObj.color;
                }

                if (bObj.hasOwnProperty('label') && bObj.label !== null) {
                    btnLi_span.id = labelId;
                    labelText     = bObj.label; 

                    if (inputs.showContainer) {
                        btnLi_span.innerText        = labelText;
                        btnLi_span.classList        = cssGroupName + '_label ';
                        btnLi_contDiv.classList     = cssGroupName + '_sub_icon_container';
                        btnLi_div.classList         = cssGroupName + '_sub_icon_holder';
                        btnLi_i.classList           = 'fa ' + bObj.icon;
                    } else {                        
                        btnLi_span.classList        = cssGroupName + '_label_locked ';
                        btnLi_contDiv.classList     = cssGroupName + '_sub_icon_container_static';
                        btnLi_div.classList         = cssGroupName + '_sub_icon_holder_static';
                        btnLi_i.classList           = 'fa ' + bObj.icon;

                        btnLi_div.addEventListener('mouseover', (function(l_id, l_text) { return function(e) { toggleLabel(e, l_id, l_text); }; }) (labelId, labelText), false);
                        btnLi_div.addEventListener('mouseout',  (function(l_id, l_text) { return function(e) { toggleLabel(e, l_id, l_text); }; }) (labelId, ''), false);
                    }
                }

                // Add Button click listener
                btnLi_div.addEventListener("click", bObj.action, false);                

                // Add Button to button
                btnLi_div.append(btnLi_i);

                if (bObj.hasOwnProperty('label') && bObj.label !== null) {
                    btnLi.append(btnLi_span);
                }
                btnLi_contDiv.append(btnLi_div);
                btnLi.append(btnLi_contDiv);
                drawerBtnUlList.append(btnLi);
            }

            // Append button list to final container
            drawerBtnContainer.append(drawerBtnUlList);
             rootBtnContainer.append(drawerBtnContainer);
        
            // Open the button drawer if we are using the container 
            // drawer and user specified it should be open by default
            if (inputs.showContainer == true && inputs.showContainerAsOpen == true) {
                drawerButtonClick();
            }

        } else if(++retries <= maxRetries){
            setTimeout(createButtonDrawer, 200);
        }
    }
    
    // Mouseover Label Making 
    function toggleLabel (e, labelId, labelText) {   
        var lObj = document.getElementById(labelId);

        if (lObj === null) {
            return;
        }

        lObj.innerText = labelText;
        lObj.classList.toggle(options.cssGroupName + '_label_div_hover'); 
    }

    function toggleLabelDynamic (e, labelId, labelText, wbIcon) {   
        if (wbIcon.dataset.rotatedFlag != 1) {
            return;
        }
        var lObj = document.getElementById(labelId);

        if (lObj === null) {
            return;
        }

        lObj.innerText = labelText;
        lObj.classList.toggle(options.cssGroupName + '_label_locked'); 
    }

    // Handle drawer click to add lock icon
    function drawerButtonClick() {
        var cssGroupName        = options.cssGroupName;
        var wbIcon              = document.getElementById(cssGroupName + 'Icon');
        var wbIconOptionList    = document.getElementById(cssGroupName + 'IconOptionList');

        // Change icon to lock and rotate
        if (!wbIcon.dataset.rotatedFlag || wbIcon.dataset.rotatedFlag == 0) {
            wbIcon.dataset.rotatedFlag = 1;
            wbIconOptionList.classList.remove(cssGroupName + '_option_hidden');
            wbIcon.classList = cssGroupName + '_locked ' + cssGroupName + '_icon_holder_lock';
        } else {
            wbIcon.dataset.rotatedFlag = 0;
            wbIconOptionList.classList.add(cssGroupName + '_option_hidden');
            wbIcon.classList = cssGroupName + ' ' + cssGroupName + '_icon_holder';
        }

        // Remove labels
        for (var i = inputs.buttonList.length -1; i >= 0; i--) {           
            var labelId     = cssGroupName + '_IconLabel_' + i;
            var bObj        = inputs.buttonList[i];
            var lObj        = document.getElementById(labelId);
            var dObj        = document.getElementById(cssGroupName + '_IconDiv_' + i);

            if (lObj === null) {
                continue;
            }

            var labelText   = bObj.hasOwnProperty('label') && bObj.label !== null ? bObj.label : null;
            lObj.innerText  = labelText !== null && lObj.innerText == '' ? labelText : null;

            // Add mouseover handing functions to remove label text 
            var mOverHandler = (function(l_id, l_text, l_rot) { return function(e) { toggleLabelDynamic(e, l_id, l_text, l_rot); }; }) (labelId, labelText, wbIcon);
            var mOutHandler  = (function(l_id, l_text, l_rot) { return function(e) { toggleLabelDynamic(e, l_id, l_text, l_rot); }; }) (labelId, '', wbIcon);

            dObj.addEventListener('mouseover', mOverHandler, false);
            dObj.addEventListener('mouseout',  mOutHandler, false);
            lObj.classList.toggle(cssGroupName + '_label_locked');
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
