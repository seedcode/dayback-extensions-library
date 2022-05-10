// Mutate Events by Resource v1.10

// Purpose:
// Allows you to mutate the properties of a new event depending on which resource the event is assigned to
// Action Type: On Event Create
// Prevent Default Action: Yes

// More info on custom Event Actions here:
// https://docs.dayback.com/article/20-event-actions

// Declare globals
var options = {}; var inputs = {};

try {

    //----------- Configuration -------------------

        // Options specified for this action
        
        // Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)
        options.runTimeout = 8;
        // Array of account emails for whom this action will run. Leave blank to allow the action to run for everyone.
        // Example: ['person@domain.com', 'someone@domain.com']
        options.restrictedToAccounts = [];

        // Any input data for the action should be specified here

        //Define event mutations for each resource here
        //There are 4 different types of mutations
        //For each type, you can specify the field to mutate as a property
        //The prepends type adds to the beginning of the value
        //The appends type adds to the end of the value
        //The replacements type replaces the entire value
        //The dateTimeMutations type adjusts the value of the start or end time
        //dateTimeMutations has a special 'duration' property
        //allowing you to change the duration of a new event without manually mutating the start or end
        inputs.resources = {
            'KC Embrey': {
                dateTimeMutations: {
                    duration: moment.duration('00:45:00'),
                },
                prepends: {
                    titleEdit: 'KC - ',
                },
                appends: {
                    description: '\n<dbk-css style="font-weight:bold;">This event mutated by an action.</dbk-css>'
                }
            },
            'John Sindelar': {
                dateTimeMutations: {
                    end: moment.duration(-15, 'minutes'),
                },
                replacements: {
                    titleEdit: 'Mutated Event',
                }
            }
        }

    //----------- End Configuration -------------------

}
catch(error) {
    reportError(error);
}



//----------- You shouldn’t need to edit below this line -------------------


// Action code goes inside this function
function run() {

    //Mutate the event according to the config
    mutateEvent(event, inputs.resources);
    
    //Tell DayBack to continue creating the mutated event
    confirmCallback();


    function mutateEvent (event, config){

        //Loop through each resource in the config
        Object.keys(config).forEach(
            function(key) {
                var currentResource = inputs.resources[key];
                if (event.resource[0] == key){

                    //Loop through each defined mutation type in the config
                    Object.keys(currentResource).forEach(
                        function(mutationType){
                            var mutations = currentResource[mutationType];

                            //Loop through each defined mutation and apply to the event object
                            Object.keys(mutations).forEach(
                                function(mutationTarget){

                                    //Verify that this is a valid field for this source before trying to mutate it
                                    if (validateField(mutationTarget, event)){
                                        if (mutationType == 'dateTimeMutations'){
                                            if (mutationTarget == 'duration'){
                                                event.end = event.start.clone().add(mutations[mutationTarget])
                                            }
                                            else{
                                                event[mutationTarget].add(mutations[mutationTarget]);
                                            }
                                        }
                                        else if (mutationType == 'replacements'){
                                            event[mutationTarget] = mutations[mutationTarget];
                                        }
                                        else if (mutationType == 'prepends'){
                                            event[mutationTarget] = mutations[mutationTarget] + (event[mutationTarget] || '');
                                        }
                                        else if (mutationType == 'appends'){
                                            event[mutationTarget] = (event[mutationTarget] || '') + mutations[mutationTarget];
                                        }
                                    }
                                }
                            );
                        }
                    );
                }
            }
        );
    }

    function validateField(field, event){
        return field === 'duration' || event.schedule.fieldMap[field];
    }
}


//----------- Run function wrapper and helpers - do not edit unless you know what these do -------------------

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
            message: 'The action was unable to execute within the alloted time and has been stopped'
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
    var errorMessage = '<p>There was a problem running the action "<span style="white-space: nowrap">' + action.name + '</span>"</p><p>Error: ' + error.message + '.</p><p>This may result in unexpected behavior of the calendar.</p>'
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
