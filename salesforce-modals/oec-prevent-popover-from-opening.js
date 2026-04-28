// On Event Click
//
// This code handles the click event on a calendar event.
// It prevets the accidental opening of the Event popover
// if the user requested the opening of a chatter activity modal.
//
// Prevent Default: True

if (seedcodeCalendar.get('preventEventClick')) {
    action.callbacks.cancel();
} else {
    action.callbacks.confirm();
}
