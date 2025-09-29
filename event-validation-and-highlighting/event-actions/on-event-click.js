// Event Validation - On Event Click - v1.0
//
// Purpose:
// Validates event fields when they are clicked on
// triggering recalculation of any required
// or hidden fields.
//
// Action Type: On Event Click
// Prevent Default Action: Yes

sc.get('validationHandler')?.onEventClick(event, editEvent, action);