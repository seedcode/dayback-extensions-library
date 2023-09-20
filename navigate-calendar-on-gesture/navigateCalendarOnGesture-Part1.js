// Navigate Calendar on Gesture v2.7 - Add Nav Buttons Component

// Purpose:
//
// Add Swipe Pagination Buttons to the root Calendar container.
// Swipe animation show using the After Events Rendered app action
// which detects the Wheel, Trackpad and Swipe gestures
//
// Action Type: After Calendar Rendered
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

  //----------- End Configuration -------------------
} catch (error) {
  reportError(error);
}

//----------- The action itself: you may not need to edit this. -------------------

// Action code goes inside this function
function run() {
 
  var maxRetries = 20;
  var retries    = 0;

  addPaginationGraphics();

  function addPaginationGraphics() {

    var cssGroupName = 'dbkswn';
    var leftBtnContainer;
    var leftBtn;
    var leftBtnWrap;
    var leftBtnI;
    var rightBtnContainer;
    var rightBtn;
    var rightBtnWrap;
    var rightBtnI;

    var calenderDiv = document.querySelector('.calendar');  

    if (calenderDiv) {                        

      // Add Left Button
      leftBtnContainer               = document.createElement('div');
      leftBtnWrap                    = document.createElement('div');
      leftBtn                        = document.createElement('div');
      leftBtnI                       = document.createElement('i');

      leftBtnContainer.classList     = cssGroupName + '_container_left';
      leftBtnContainer.id            = cssGroupName + '_container_left';
      leftBtnWrap.classList          = cssGroupName + '_btn_left';
      leftBtn.classList              = cssGroupName + '_icon_holder_left';
      leftBtnI.classList             = 'fa fa-chevron-left';

      // Add Button Icon to Container
      leftBtn.append(leftBtnI);
      leftBtnWrap.append(leftBtn);
      leftBtnContainer.append(leftBtnWrap);
      calenderDiv.append(leftBtnContainer);

      // Add Right Button
      rightBtnContainer               = document.createElement('div');
      rightBtnWrap                    = document.createElement('div');
      rightBtn                        = document.createElement('div');
      rightBtnI                       = document.createElement('i');

      rightBtnContainer.classList     = cssGroupName + '_container_right';
      rightBtnContainer.id            = cssGroupName + '_container_right';
      rightBtnWrap.classList          = cssGroupName + '_btn_right';
      rightBtn.classList              = cssGroupName + '_icon_holder_right';
      rightBtnI.classList             = 'fa fa-chevron-right';

      // Add Button Icon to Container
      rightBtn.append(rightBtnI);
      rightBtnWrap.append(rightBtn);
      rightBtnContainer.append(rightBtnWrap);
      calenderDiv.append(rightBtnContainer);

    } else if(++retries <= maxRetries) {
      setTimeout(addPaginationGraphics, 200);
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
