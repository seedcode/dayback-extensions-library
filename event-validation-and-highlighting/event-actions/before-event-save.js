// Event Validation - Before Event Save - v1.0
//
// Name: Event Validation
// Type: Event Action
// Purpose:
// Validates event fields when they are
// about to be saved. 
//
// Action Type: Before Event Save
// Prevent Default Action: Yes

sc.get('validationHandler')?.beforeEventSave(event, editEvent, action);