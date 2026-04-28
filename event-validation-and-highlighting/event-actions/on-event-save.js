// Event Validation - On Event Save - v1.0
//
// Purpose:
// Validates event fields before they are
// written to the data source. Please modify
// the changesObject to remove any fields
// that might change Formula fields before
// invoking the onEventSave method below
//
// Action Type: On Event Save
// Prevent Default Action: Yes

sc.get('validationHandler')?.onEventSave(event, editEvent, changesObject, action);