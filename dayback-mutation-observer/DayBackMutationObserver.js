// DayBack Mutation Observer Library - v1.0

// Purpose:
// Installs a mutation observer library for
// monitoring real-time DOM changes. This
// library is designed to be used with other
// app actions and does not perform any
// functions on its own.

// Action Type: Before Calendar Rendered
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

	//----------- End Configuration -------------------

	/******************************************************************************************

    Mutation Observer Library Usage Instructions
    --------------------------------------------

    App action installs seedcodeCalendar.get("dbkObserver") object
    which contains a .new() constructor function. Each new observer 
    instance must be given four parameters. 

    seedcodeCalendar.get("dbkObserver").new({
        name:   "uniqueNameForObserver",
        watch:  document.getElementById("The Dom Element We are Observering"),
        until:  "#query .selector .condition-that-triggers .custom-code-injection",
        then:   functionToRunWhenConditionIsMet
    });

    function functionToRunWhenConditionIsMet(observer) {

        // The most important functions inside observer are

        observer.stop();        // Stops further observation, if you only need
                                // to run the first time something happens

        observer.destroy();     // Stops further observation, and destroys
                                // named observer, in case you want to reuse
                                // the same name's observer. Can be used in
                                // place of stop

        observer.restart();     // Restarts observation of the same node, if 
                                // you expect your injects to go away, and they
                                // need to be plugged in each time the node is changed

        // You also have access to the entire node tree and the last
        // mutation that returned true

        observer.lastMutation;

        observer.mutationList;

        // If you used a query selector for your 'until' clause, and you want to grab
        // it to issue events on that node, you can reference it using

        observer.foundNode;
    }

    Example Scenario:
    -----------------

    // Change Text Filter in sidebar to have a red background

    seedcodeCalendar.get("dbkObserver").new({
        name: "modifySidebar",
        watch: document.getElementById("sidebar"),
        until: "#sidebar .filters-popover-container text-filter .header-block-content",
        then: injectCustomCode,
    });

    function injectCustomCode(observer) {
        if (!observer.foundNode.classList.contains("tag-filters-container")) {
            observer.stop();
            observer.foundNode.classList.add("tag-filters-container");
            observer.foundNode.style.backgroundColor = "red";
            observer.restart();
        }
    }        

    Contents of Observer Object:
    ----------------------------

    The following are the most useful functions and values you can access in the object
    that will be passed to your injectCustomCode(observer) function when your stop
    condition is triggered

    observer.stop()
    observer.start()
    observer.restart()
    observer.destroy()

    observer.foundNode      // A reference to the node element matching your querySelector, if you used one
    observer.foundOnStart   // True if we did not need to start observer, as node was present
    observer.lastMutation   // Last mutation that triggered your custom code function
    observer.mutationList   // The full list of node changes that trigged the lastMutation
    observer.params         // Your original parameters that you passed
    observer                // True browser's native mutation object

    Configuration Options:
    ----------------------

    name: "uniqueName"

        A unique short string identifying the observer. 
        Prevents collision if app actions start multiple observers

    watch: node

        The DOM node element that is being observed. Constructor
        will return undefined if node is undefined

    until: conditionCheck() or querySelector string 

        You can specify a function that checks whether the mutation matches
        a truth condition, such as the modification of an event or editEvent 
        value, or you can use a simple querySelector string to identify
        if a node has been built (probably the most common usage)

    then: functionToRun

        The function will be passed the observer object configuration collection
        including stop/start/restart/destroy functions as well as the
        last matched mutation, and mutation observer object itself.
        Details on this collection provided later

    Optional Parameters:
    --------------------

    The following prameters provide advanced flow control for your mutation
    observer. All of these have defaults, so you may not need to use these
    settings.


    checkStopConditionOnStart: true

        Immediately run stop condition check on start, in case the DOM tree
        matches your stop condition and we don't need to start the observer

    whenFoundStopObserving: false

        By default, if a mutation is found, we will continue to observe for
        future mutations, unless the stop condition is met, and the user
        calls observer.stop() inside of their code injection function.

        observer.stop() should always be ran inside of the code injection
        function if you are injecting code into the node that is being
        observed. If you don't call observer.stop(), you will trigger an
        infinate loop. You can always call observer.restart() if you
        wish to continue to observe the node after you have  applied
        your changes.

    whenFoundStopProcessing: true

        Each DOM change to will include an array of all mutations. If we 
        find a stop condition, we very likely do not need to loop through the 
        remaining mutations. Leave this set to true to save CPU cycles.

    autoStart: true
    startDelay: 0

        By default we will start observing right away and not wait. You
        can optionally have the mutation observer start after a delay of a
        set number of milliseconds, or you can start your observer manually
        as follows:

        let observer = seedcodeCalendar.get("dbkObserver").new({
            name:   ...,
            watch:  ...,
            until:  ...,
            then:   ...,

            autoStart: false

        });        

        ... do stuff ...

        observer.start();

    debug: false

        If true will print debug statements to console at each major
        stage of mutation observation

    options: { attributes: false, childList: true, subtree: true }

        The above specifies what type of DOM changes are monitored. 
        The most common scenario is that we want to monitor change in
        immediate child nodes, as well as the subtree of nodes. 
        You may only need to change this if you want to observe attribute

    mutationType: "childList" || "attribute" || "both"      Default: childList

        If the mutation type is one of the above types of mutations,
        then check whether the stop condition meets the mutation type.
        You will likely not need to change this.

    *******************************************************************************************/
} catch (error) {
	reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
	// Define collection to store all mutation observers

	var _observers = {};

	seedcodeCalendar.init('dbkObserver', {
		new: newObserver,
		_observers: _observers,
	});

	// Constructor function for object

	function newObserver(params) {
		// Each observer must be named
		if (!params.hasOwnProperty('name')) {
			utilities.showModal(
				'Observer Needs Name',
				'Please provide a name for your observer.',
				'ok'
			);
			return;
		}

		// If we have an observer registered by that name already, return this obserer
		if (_observers.hasOwnProperty(params.name)) {
			return _observers[params.name];
		}

		// Define object holding observer configuraiton and related functions
		var observerObj = {
			start: start,
			stop: stop,
			restart: restart,
			destroy: destroy,
			params: params,
		};

		// Declare what we're watching and what to do when we find it
		//
		//  watch:  element
		//  until:  conditionIsMet(observerObject) || "#querySelector .string"
		//  then:   performCustomCode(observerObject)

		observerObj.watch = params.hasOwnProperty('watch')
			? params.watch
			: undefined;
		observerObj.until = params.hasOwnProperty('until')
			? params.until
			: function () {
					return true;
			  };
		observerObj.then = params.hasOwnProperty('then')
			? params.then
			: function () {
					return true;
			  };

		// Observer Mutation Type Configuration Options. By default the observer will watch
		// the child list and all subtree changes. You do not need to modify these defaults
		// unless you have a special case where you don't need to monitor childList or
		// subtree changes. By default the stop condition will be checked when a
		// childList mutation is detected. Change this to "attribute" if you want to
		// react to attribute changes
		//
		// options:         { attributes: false, childList: true, subtree: true };
		// mutationType:    "childList" || "attribute"

		observerObj.options = params.hasOwnProperty('options')
			? params.options
			: {attributes: false, childList: true, subtree: true};

		// Process child list changes by default
		observerObj.mutationType = params.hasOwnProperty('mutationType')
			? params.mutationType
			: 'childList';

		// ----------------------------------------------------------------------------------------
		// Additional Stop/Start/Break Options
		// ----------------------------------------------------------------------------------------

		// Check stop condition when observer first starts - Default true
		observerObj.checkStopConditionOnStart = params.hasOwnProperty(
			'checkStopConditionOnStart'
		)
			? params.checkStopConditionOnStart
			: true;

		// Stop observing further mutations when first matching mutation is found - Default false
		observerObj.whenFoundStopObserving = params.hasOwnProperty(
			'whenFoundStopObserving'
		)
			? params.whenFoundStopObserving
			: false;

		// Stop processing remaining list of mutions when first instance is found - Default true
		observerObj.whenFoundStopProcessing = params.hasOwnProperty(
			'whenFoundStopProcessing'
		)
			? params.whenFoundStopProcessing
			: true;

		// Stop processing remaining list of mutions when first instance is found - Default true
		observerObj.debug = params.hasOwnProperty('debug')
			? params.debug
			: false;

		// Auto-start is true by default
		observerObj.autoStart = params.hasOwnProperty('autoStart')
			? params.autoStart
			: true;

		// Start delay
		observerObj.startDelay = params.hasOwnProperty('startDelay')
			? params.startDelay
			: 0;

		// ------------------ End Configuration ------------------

		// Define callback function for observer
		observerObj.callback = function (mutationsList, observer) {
			observerObj.mutationList = mutationsList;
			for (const mutation of mutationsList) {
				if (
					observerObj.mutationType == 'both' ||
					mutation.type === observerObj.mutationType
				) {
					observerObj.lastMutation = mutation;

					if (
						typeof observerObj.until !== 'function' &&
						document.querySelector(observerObj.until) !== null
					) {
						observerObj.foundNode = document.querySelector(
							observerObj.until
						);

						if (observerObj.whenFoundStopObserving) stop();
						if (observerObj.debug)
							console.log('O: Mutation Triggering Custom Code');
						observerObj.then(observerObj);
						if (observerObj.whenFoundStopProcessing) break;
					} else if (
						typeof observerObj.until === 'function' &&
						observerObj.until(observerObj)
					) {
						if (observerObj.whenFoundStopObserving) stop();
						if (observerObj.debug)
							console.log('O: Mutation Triggering Custom Code');
						observerObj.then(observerObj);
						if (observerObj.whenFoundStopProcessing) break;
					}
				}
			}
		};

		observerObj.running = false;

		_observers[params.name] = observerObj;

		if (observerObj.autoStart) {
			if (observerObj.startDelay > 0) {
				setTimeout(start, observerObj.startDelay);
			} else {
				start();
			}
		}

		return _observers[params.name];

		// ------------------ Observer Functions ------------------

		function start() {
			if (observerObj.checkStopConditionOnStart) {
				if (observerObj.debug)
					console.log('O: Check Condition on Stat');

				observerObj.checkStopConditionOnStart = false;

				if (
					typeof observerObj.until !== 'function' &&
					document.querySelector(observerObj.until) !== null
				) {
					observerObj.foundNode = document.querySelector(
						observerObj.until
					);
					observerObj.foundOnStart = true;
					observerObj.then(observerObj);
				} else if (
					typeof observerObj.until === 'function' &&
					observerObj.until(observerObj)
				) {
					observerObj.foundOnStart = true;
					observerObj.then(observerObj);
				}
			}

			if (observerObj.hasOwnProperty('observer')) {
				return;
			}

			if (observerObj.debug)
				console.log('O: Creating New MutationObserver Object');

			observerObj.observer = new MutationObserver(observerObj.callback);
			observerObj.observer.observe(
				observerObj.watch,
				observerObj.options
			);
			observerObj.running = true;
		}

		function restart() {
			if (observerObj.debug) console.log('O: Restarting Observer');
			observerObj.foundOnStart = false;
			observerObj.lastMutation = undefined;
			observerObj.observer = new MutationObserver(observerObj.callback);
			observerObj.observer.observe(
				observerObj.watch,
				observerObj.options
			);
			observerObj.running = true;
		}

		function destroy() {
			if (
				observerObj.hasOwnProperty('observer') &&
				observerObj.observer !== undefined
			) {
				observerObj.observer.disconnect();
				observerObj.running = false;
			}
			delete _observers[observerObj.params.name];
		}

		function stop() {
			if (
				observerObj.hasOwnProperty('observer') &&
				observerObj.observer !== undefined
			) {
				observerObj.observer.disconnect();
				observerObj.running = false;
			}
			if (observerObj.debug) console.log('O: Stopped Observer');
		}
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
