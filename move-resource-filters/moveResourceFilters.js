// Move Resource Filters in Sidebar v1.0
//
// Purpose:
// Moves the resource filters in the side bar
// above the Status filters
//
// Action Type: After Events Rendered
// Prevent Default Action: Yes
//
// More info on custom actions here:
// https://docs.dayback.com/article/140-custom-app-actions

// Declare globals

var options = {};
var inputs = {};

try {
  //----------- Configuration -------------------

  // Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)
  // Leave this set to 0 to avoid unexpected behavior

  options.runTimeout = 0;

  //----------- End Configuration -------------------
} catch (error) {
  reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {

  // Grab the currenlty active mutation observer;
  var observer = seedcodeCalendar.get("sidebarObserver");

  // If we don't have one running, start one, and check if
  // sidebar is already upon for possible code injection

  if (!observer) {
      startSidebarObserver();
      checkNodesForInjections();
  }

  action.callbacks.confirm();

  function startSidebarObserver() {

      // Get sidebar element to observe
      let sideBarContainer = document.getElementById('sidebar');

      if (!sideBarContainer) 
          return;

      const callback = function(mutationsList, observer) {
          for(const mutation of mutationsList) {
              if (mutation.type === 'childList') {
                  if (sideBarContainer.hasChildNodes() == true) {
                      checkNodesForInjections();
                  }
              }
          }
      };

      // Start observer and save to seedCodeCalendar object
      observer = new MutationObserver(callback);
      observer.observe(sideBarContainer, { attributes: false, childList: true, subtree: true });
      seedcodeCalendar.init("sidebarObserver", observer);
  }

  // Function checks for existance of filters container
  // Grabs the menu and checks if we've already ordered it 
  // previously or not

  function checkNodesForInjections() {

      let menubar = document.querySelector(".filters-popover-container");
      if (menubar && !menubar.classList.contains('reordered')) {
          switchMenu(menubar);
      }
  }

  function switchMenu(menubar) {

      // Disconnect observer while we perform the DOM change
      observer.disconnect();

      // Set the class which records that we have re-ordered the sidebar
      menubar.classList.add('reordered');

      // Get currently active child nodes
      let mkids = menubar.childNodes;

      // Move the 7th element down
      moveElementTo(mkids[7], 1);

      // Restart observer
      startSidebarObserver();    
  }

  // Function reorders an element 1=up or -1=down
  // based on its current context in the node list

  function moveElementTo(selected_element, direction) {

      var element_to_move = selected_element,
          td = element_to_move.parentNode;
  
      if (direction === -1 && element_to_move.previousElementSibling) {
          td.insertBefore(element_to_move, element_to_move.previousElementSibling);
      } else if (direction === 1 && element_to_move.nextElementSibling) {
          td.insertBefore(element_to_move, element_to_move.nextElementSibling.nextElementSibling)
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
          "The action was unable to execute within the allotted time and has been stopped",
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

