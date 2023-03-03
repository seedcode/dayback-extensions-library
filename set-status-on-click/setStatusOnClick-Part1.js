// Set Status on Click - Part 1 v1.0
//
// Purpose:
// Allows point and click Status changes when a key is
// held down. Different sounds can be configured to play
// for different status changes scenarios. Function can
// be configured to check for errors and play an error
// sound if a permission check fails
//
// Action Type: On Event Click
// Prevent Default Action: Yes
//
// More info on custom actions here:
// https://docs.dayback.com/article/20-event-actions

// Declare globals

var options = {};
var inputs = {};

try {
    //----------- Configuration -------------------

    // Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)
    // Leave this set to 0 to avoid unexpected behavior

    options.runTimeout = 0;

    // Get Account name for custom configurations

    inputs.account = seedcodeCalendar.get("config").accountName;

    // Define the Keyboard Shortcut that tiggers a Status update

    inputs.keyStatusMap = {
        KeyP: "Pending",
        KeyR: "Ready",
        KeyD: "Done",
        KeyO: "Out of Office",
        KeyF: "Finished",
        KeyN: "none"
    };

    // Define a sound for each status change. If no sound is
    // specified, or the whole object is left blank, all status
    // updates will play the same sound. Available sounds include:
    //
    //      1. success
    //      2. error
    //
    // The object should look like the following:
    //
    //      inputs.statusSoundMap = {
    //          'statusName':   'soundname', // Sounds are defined inside input.sounds object
    //          'statusName':   'soundname',
    //          ...:            ...
    //      }

    inputs.statusSoundMap = {
        Done: "successHigh",
        Finished: "drumpMP3",
        none: "resetStatus"
    };

    // Set sound volume level. The default is -10 percent of regular volume

    inputs.volume = -10;

    // Some event changes take a while to save, so it can be helpful
    // to display a Please Wait message before the confirmation
    // dialogue appears. If your source saves quickly, you may switch
    // this to false

    inputs.showPleaseWaitMessage = true;

    // Define a function that checkes if the status change is permitted
    // function should return true if the change is permitted and
    // return false if not. If the change is not permitted an erro
    // sound will play.

    inputs.statusChangeAllowed = function (statusCode) {
        // Return error if the Status being set is already
        // the same as the current Event status

        if (event.status[0] == statusCode) {
            return false;
        }

        return true;
    };

    //----------- User-specific Sound Preferences -------------

    // If you would like to override volume and/or sound definitions for
    // your account, please define sound names in the sound configuration
    // settings below, and then set your user-specific defaults as
    // follows:
    //
    //      inputs.userSettings = {
    //
    //          'FirstName LastName': {
    //              volume: -10,            // -100 mutes sounds
    //              sounds: {
    //                  statusName: 'soundName',
    //                  statusName: 'soundName',
    //                  ...
    //                  customSuccessSound: 'myCustomSuccessSoundName',
    //                  customErrorSound: 'myCustomErrorSoundName'
    //              }
    //          },
    //          ...
    //      }
    //
    // Please note that customSuccessSound and customErrorSound are not status
    // code names, but are reserved words that define optional default and error
    // sounds for all status changes, unless a status-specific sound is specified

    inputs.userPreferences = {};

    //----------- Sound Configurations -----------------

    // Configure your sounds here. You may add muliple notes with different
    // frequencies, durations, time, and velocity
    //
    //      note:
    //           The frequency of the note you want to trigger
    //
    //      duration: (optional)
    //           How long the note should be held for beforetriggering the release. This value must be greater than 0.
    //
    //      time: (optional)
    //           When the note should be triggered.
    //
    //      velocity: (option)
    //           The velocity the note should be triggered at.
    //
    // Full documentation can be found here:
    // https://tonejs.github.io/docs/14.7.77/FMSynth.html#triggerAttackRelease

    inputs.sounds = {
        success: function (fmSynth) {
            let now = Tone.now();
            fmSynth.triggerAttackRelease("C4", "36n", now, 0.5);
            fmSynth.triggerAttackRelease("E4", "36n", (now += 0.075), 0.5);
            fmSynth.triggerAttackRelease("G4", "36n", (now += 0.075), 0.5);
            fmSynth.triggerAttackRelease("C5", "36n", (now += 0.075), 0.5);
        },

        successHigh: function (fmSynth) {
            let now = Tone.now();
            fmSynth.triggerAttackRelease("F4", "36n", now, 0.5);
            fmSynth.triggerAttackRelease("A4", "36n", (now += 0.075), 0.5);
            fmSynth.triggerAttackRelease("C5", "36n", (now += 0.075), 0.5);
            fmSynth.triggerAttackRelease("F5", "36n", (now += 0.075), 0.5);
        },

        resetStatus: function (fmSynth) {
            let now = Tone.now();
            fmSynth.triggerAttackRelease("C5", "36n", now, 0.5);
            fmSynth.triggerAttackRelease("A#4", "36n", (now += 0.075), 0.5);
            fmSynth.triggerAttackRelease("G4", "36n", (now += 0.075), 0.5);
            fmSynth.triggerAttackRelease("F4", "36n", (now += 0.075), 0.5);
        },

        drumpMP3: function (fmSynth) {
            var player = new Tone.Player(
                "https://tonejs.github.io/audio/drum-samples/handdrum-loop.mp3"
            ).toDestination();
            player.volume.value = -10;
            player.autostart = true;
        },

        error: function (fmSynth) {
            let now = Tone.now();
            fmSynth.triggerAttackRelease("F4", "36n", now, 0.5);
            fmSynth.triggerAttackRelease("F4", "36n", (now += 0.15), 0.5);
        }

        // User Defined Sounds

        // .. Define your own user-specific sounds here ..
    };

    //----------- End Configuration -------------------
} catch (error) {
    reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function

function run() {

    // Ignore new On Create events which also issue On Event Click 
    if (!event.hasOwnProperty('eventID') || event['eventID'].length < 1) {
        return action.callbacks.confirm();        
    }

    // Configure synthesizer
    try {
        var fmSynth = seedcodeCalendar.get('fmSynth');
        if (!fmSynth) {
            fmSynth = new Tone.FMSynth().toDestination();
            fmSynth.volume.value = getUserVolume();
            seedcodeCalendar.init('fmSynth', fmSynth);
        }   
    } catch(ex) {
        return action.callbacks.confirm(); 
    }

    // Get current key being pressed
    var keyDown = seedcodeCalendar.get("keyDown");

    // Get DayBack Statuses so we can determine status color
    var statuses = seedcodeCalendar.get("statuses");

    // If an event change is taking place, block a click
    var blockClick = seedcodeCalendar.get("dbkBlockStatusChangeEventClick");

    if (blockClick) {
        // Prevent any event click from running while we are updating an event
        setStatusChangeSound(undefined, fmSynth);
        Tone.Transport.stop();
        Tone.Transport.start();

        return action.callbacks.cancel();
    } else if (keyDown) {
        // Check if we status that corresponds to a pressed key
        let found = false;
        Object.keys(inputs.keyStatusMap).forEach((key) => {
            if (!found && keyDown[key]) {
                action.callbacks.cancel();
                changeStatusWithSound(inputs.keyStatusMap[key]);
                found = true;
            }
        });

        if (!found) {
            return action.callbacks.confirm();
        }
    } else {
        // No key held, can pass click through and open
        // event popover
        return action.callbacks.confirm();
    }

    // Function fires when a keyboard key is being held down
    // that matches a status code

    function changeStatusWithSound(statusCode) {
        // Grab the event color at the current status
        // and the color that the event will be after
        // the status change is finished saving.

        var beforeColor = getStatusColor(event.status[0]);
        var afterColor = getStatusColor(statusCode);

        // Get all events on the screen that match the current event id
        let events = document.querySelectorAll("[data-id='" + event._id + "']");

        // If our permission check returns false, play an error
        // sound and exit, otherwise, run animations and the status
        // change update

        if (!inputs.statusChangeAllowed(statusCode)) {
            setStatusChangeSound(undefined, fmSynth);
        } else {
            setStatusChangeSound(statusCode, fmSynth);

            for (let i = 0; i < events.length; i++) {
                events[i].classList.add('star-burst'); 
                events[i].classList.add('animate'); 
                events[i].classList.add("zoom-in-out-box"); 

                let parent = events[i].parentElement;
                let colorSwatch = events[i].querySelector('.color-swatch');
                
                if (!parent.classList.contains("sidebar-drag-item")) {
                    events[i].style.backgroundColor = afterColor;
                    events[i].style.color = utilities.generateTextColor(afterColor);			
                } else if (colorSwatch) {
                    colorSwatch.style.backgroundColor = afterColor;
                }
            }

            setTimeout(function () {
                for (let i = 0; i < events.length; i++) {
                    events[i].classList.remove("zoom-in-out-box");
                    events[i].classList.remove("animate");
                }
            }, 1000);

            // Optionally display a please wait message
            if (inputs.showPleaseWaitMessage) {
                helpers.showMessage("Saving. Please wait ...", 0, 5000);
            }

            // Block runtime of event clicks while saving is in progress
            seedcodeCalendar.init("dbkBlockStatusChangeEventClick", true);

            // Save changes. On error, revert to prior color.
            setTimeout(function () {
                dbk.updateEvent(
                    event,
                    { status: [statusCode] },
                    function () {
                        // Revert function
                        seedcodeCalendar.init(
                            "dbkBlockStatusChangeEventClick",
                            false
                        );
                        let afterRefresh = document.querySelectorAll(
                            "[data-id='" + event._id + "']"
                        );
                        for (let i = 0; i < afterRefresh.length; i++) {
                            afterRefresh[i].style.backgroundColor = beforeColor;
                            afterRefresh[i].style.color =
                                utilities.generateTextColor(beforeColor);
                        }
                    },
                    function () {
                        seedcodeCalendar.init(
                            "dbkBlockStatusChangeEventClick",
                            false
                        );
                    },
                    { isCustomAction: true }
                );
            }, 1000);
        }

        // Play sound
        Tone.Transport.stop();
        Tone.Transport.start();
    }

    // Helper function to get a status color

    function getStatusColor(statusCode) {
        if (statusCode == "none") {
            return event.schedule.backgroundColor;
        }

        for (let c = 0; c < statuses.length; c++) {
            if (statuses[c].name == statusCode) {
                return statuses[c].color;
            }
        }
    }

    // Get user's preferred volume, or use default

    function getUserVolume() {
        return inputs.userPreferences.hasOwnProperty(inputs.account) &&
            inputs.userPreferences[inputs.account].hasOwnProperty("volume")
            ? inputs.userPreferences[inputs.account].volume
            : inputs.volume;
    }

    function getUserSoundPreference(statusCode, defaultSound) {
        return inputs.userPreferences.hasOwnProperty(inputs.account) &&
            inputs.userPreferences[inputs.account].hasOwnProperty("sounds") &&
            inputs.userPreferences[inputs.account].sounds.hasOwnProperty(
                statusCode
            )
            ? inputs.sounds[
                  inputs.userPreferences[inputs.account].sounds[statusCode]
              ]
            : defaultSound;
    }

    // Function sets the sound by status code
    // If no status code is specified, it will
    // set the error sound.

    function setStatusChangeSound(statusCode, fmSynth) {
        let setSound;

        if (statusCode != undefined) {
            if (
                inputs.hasOwnProperty("statusSoundMap") &&
                inputs.statusSoundMap.hasOwnProperty(statusCode) &&
                inputs.sounds.hasOwnProperty(inputs.statusSoundMap[statusCode])
            ) {
                setSound = getUserSoundPreference(
                    statusCode,
                    inputs.sounds[inputs.statusSoundMap[statusCode]]
                );
            } else {
                setSound = getUserSoundPreference(
                    "customSuccessSound",
                    inputs.sounds.success
                );
            }
        } else {
            setSound = getUserSoundPreference(
                "customErrorSound",
                inputs.sounds.error
            );
        }

        setSound(fmSynth);
    }
}

// End Custom Popover Panel code

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
