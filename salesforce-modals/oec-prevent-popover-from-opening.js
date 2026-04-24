// Name: Prevent Popover from Opening
// Type: Event Action
// Trigger: On Event Click
//
// Purpose:
// This code handles the click event on a calendar event.
// It prevets the accidental opening of the Event popover
// if the user requested the opening of a chatter activity modal.
//
// Prevent Default: True

// More info on custom actions here:
// https://docs.dayback.com/article/20-event-actions


if (seedcodeCalendar.get('preventEventClick')) {
    action.callbacks.cancel();
} else {
    action.callbacks.confirm();
}
