// Event Validation - On Field Change - v1.0
//
// Purpose:
// Validates event fields when they are changed
//
// Action Type: On Field Change
// Prevent Default Action: Yes

sc.get('validationHandler')?.onFieldChange(event, editEvent, params, action);
