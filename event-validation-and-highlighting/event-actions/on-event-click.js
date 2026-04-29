// Event Validation - On Event Click - v1.0
//
// Name: Event Validation
// Type: Event Action
// Purpose:
// Validates event fields when they are clicked on
// triggering recalculation of any required
// or hidden fields.
//
// Action Type: On Event Click
// Prevent Default Action: Yes

sc.get('validationHandler')?.onEventClick(event, editEvent, action);