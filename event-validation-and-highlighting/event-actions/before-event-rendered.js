// Event Validation - Before Event Rendered - v1.0
//
// Purpose:
// Validates events before they are rendered 
// and highlights them if they have errors or 
// warnings.
// 
// Action Type: Before Event Rendered
// Prevent Default Action: No

sc.get('validationHandler')?.beforeEventRendered(event);