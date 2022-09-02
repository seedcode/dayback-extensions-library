// Navigate Calendar on Gesture v2.7 - After Events Rendered Component

// Purpose:

// Navigates the calendar forward or backward a page with swipe gestures or horizontal scroll
// Also refreshes the calendar when swiped down from the header on mobile devices
//
// Action Type: After Events Rendered
//
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
  
  // Enable track pad support. Default is set to off
  options.trackpadSupport = false;

  // Timeout to detect trackpad
  options.trackpadTimeout = 200;

  // Timeout between date changes when holding the mouse scroll in one direction
  options.wheelHoldInterval = 1000;

  // Timeout to detect wheel has been released
  options.wheelTimeout = 325;

  // required min distance traveled to be considered swipe
  // Specify as decimal number to use percentage of screen size, or whole number for absolute pixels
  // (e.g., 0.45 for 45% of screen width, or 150 for 150 pixels)
  // Percentage value is calculated based on the shortest side of the screen.
  options.threshold = 0.2;

  // maximum distance allowed at the same time in perpendicular direction
  // Specify as decimal number to use percentage of screen size, or whole number for absolute pixels
  // (e.g., 0.45 for 45% of screen width, or 150 for 150 pixels)
  options.restraint = 0.25;

  // maximum time allowed to travel that distance
  options.allowedTime = 300;

  // required min distance traveled to be considred a refresh swipe
  // Specify as decimal number to use percentage of screen size, or whole number for absolute pixels
  // (e.g., 0.45 for 45% of screen width, or 150 for 150 pixels)
  options.refreshThreshold = 0.25;

  // maximum time allowed to travel that distance for refresh swipe
  options.refreshAllowedTime = 1000;

  // Any input data for the action should be specified here

  // The currently signed in account email
  inputs.account = seedcodeCalendar.get('config').account;

  //----------- End Configuration -------------------
} catch (error) {
  reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
  var lastScrollDirection;
  var moveTimeout;
  var wheelTimeout;
  var holdTimeout;
  var ySum = 0;
  var xSum = 0;

  var calendarContainer = document.querySelector('.calendar');
  var headerContainer = document.getElementById('header');
  
  // Register wheel and swipe handlers
    if (calendarContainer && !seedcodeCalendar.get('calendarOnWheel')) {
        calendarContainer.onwheel = function (e) {

        // Directionality detection
        ySum += e.deltaY;
        xSum += e.deltaX;
        clearTimeout(holdTimeout);
        holdTimeout = setTimeout(function () {           

            if ((options.trackpadSupport == true && ySum != 0 && Math.abs(xSum) * .5 > Math.abs(ySum)) || (options.trackpadSupport == false && ySum == 0)) {
            
                if (xSum < -1) {
                    document.getElementById('dbkswn_container_left').classList.toggle('active');
                    pageDate('back', 'wheel');              
                    setTimeout(function() {
                        document.getElementById('dbkswn_container_left').classList.toggle('active');
                    }, 300);                   
                } else if (xSum > 1) {
                    document.getElementById('dbkswn_container_right').classList.toggle('active');
                    pageDate('fwd', 'wheel');
                    setTimeout(function() {
                        document.getElementById('dbkswn_container_right').classList.toggle('active');
                    }, 300);
                }
            }
            xSum = 0; ySum = 0;
        }, options.trackpadTimeout);                

        clearTimeout(wheelTimeout);
            wheelTimeout = setTimeout(function () {
            moveTimeout = false;
        }, options.wheelTimeout);
    };
    seedcodeCalendar.init('calendarOnWheel', calendarContainer.onwheel);

    if (
      seedcodeCalendar.get('config').isMobileDevice &&
      !seedcodeCalendar.get('calendarOnSwipe')
    ) {
      seedcodeCalendar.init(
        'calendarOnSwipe',
        swipeDetect(calendarContainer, function (swipedir) {
          // swipedir contains either "none", "left", "right", "top", or "down"
          if (swipedir === 'left' || swipedir === 'right') {
            if (swipedir === 'left') {
              document.getElementById('dbkswn_container_right').classList.toggle('active');
              pageDate('fwd','swipe');
              setTimeout(function() {
                  document.getElementById('dbkswn_container_right').classList.toggle('active');
              }, 300);                   
            } else {
              document.getElementById('dbkswn_container_left').classList.toggle('active');
              pageDate('back','swipe');
              setTimeout(function() {
                document.getElementById('dbkswn_container_left').classList.toggle('active');
              }, 300);
            }
          }
        })
      );
    }
  }

  // Register refresh swipe handler
  if (
    headerContainer &&
    seedcodeCalendar.get('config').isMobileDevice &&
    !seedcodeCalendar.get('calendarOnRefreshSwipe')
  ) {
    seedcodeCalendar.init(
      'calendarOnRefreshSwipe',
      swipeDetect(
        headerContainer,
        function (swipedir) {
          // swipedir contains either "none", "left", "right", "top", or "down"
          if (swipedir === 'down') {
            seedcodeCalendar.get('element').fullCalendar('refetchEvents');
          }
        },
        true
      )
    );
  }

  function pageDate(direction, type) {
    var navButton;
    if (direction !== lastScrollDirection || type === 'swipe' || !moveTimeout) {
      // Issue DayBack Left nad Right arrow click events
      moveTimeout = true;
      clearTimeout(holdTimeout);
      holdTimeout = setTimeout(function () {
        moveTimeout = false;
      }, options.wheelHoldInterval);
      navButton =
        direction === 'fwd'
          ? document.querySelector('.dbk_icon_arrow_right')
          : document.querySelector('.dbk_icon_arrow_left');
      lastScrollDirection = direction;
      navButton.click();
    }
  }

  function swipeDetect(el, callback, refresh) {
    var touchsurface = el,
      swipedir,
      startX,
      startY,
      distX,
      distY,
      elapsedTime,
      startTime,
      handleswipe = callback || function (swipedir) {},
      threshold = refresh ? options.refreshThreshold : options.threshold,
      restraint = refresh ? 0.99 : options.restraint,
      allowedTime = refresh ? options.refreshAllowedTime : options.allowedTime;

    touchsurface.ontouchstart = function (e) {
      var touchobj = e.changedTouches[0];
      swipedir = 'none';
      //dist = 0
      startX = touchobj.pageX;
      startY = touchobj.pageY;
      startTime = new Date().getTime(); // record time when finger first makes contact with surface
    };

    touchsurface.ontouchend = function (e) {
      var touchobj = e.changedTouches[0];
      distX = touchobj.pageX - startX; // get horizontal dist traveled by finger while in contact with surface
      distY = touchobj.pageY - startY; // get vertical dist traveled by finger while in contact with surface
      elapsedTime = new Date().getTime() - startTime; // get time elapsed
      if (elapsedTime <= allowedTime) {
        // Swipe detection uses either a percentage of screen size, or absolue pixels
        var hThreshold = refresh
          ? restraint < 1
            ? screen.width * restraint
            : restraint
          : threshold < 1
          ? Math.min(screen.width, screen.height) * threshold
          : threshold;
        var vThreshold = refresh
          ? threshold < 1
            ? screen.height * threshold
            : threshold
          : restraint < 1
          ? screen.height * restraint
          : restraint;

        // 1st condition for swipe met
        if (Math.abs(distX) >= hThreshold && Math.abs(distY) <= vThreshold) {
          // 2nd condition for horizontal swipe met
          swipedir = distX < 0 ? 'left' : 'right'; // if dist traveled is negative, it indicates left swipe
        } else if (
          // 2nd condition for vertical swipe met
          Math.abs(distY) >= vThreshold &&
          Math.abs(distX) <= hThreshold
        ) {
          // 2nd condition for vertical swipe met
          swipedir = distY < 0 ? 'up' : 'down'; // if dist traveled is negative, it indicates up swipe
        }
      }
      handleswipe(swipedir);
    };
    return touchsurface.ontouchstart;
  }
} // End Run

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
    setTimeout(run, 1000);
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
