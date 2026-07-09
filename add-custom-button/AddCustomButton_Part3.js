// Add Custom Button - Part 3 v2.0
//
// Name: Add Custom Button - After Events Rendered
// Type: App Action
// Trigger: After Events Rendered
// Prevent Default Action: No

// Purpose:
// Thin delegate for the customButtonTray registry.
// Calls the centralized afterEventsRendered() lifecycle method
// defined in AddCustomButton_Part1.js (On Startup).
//
// USER NOTE: You do NOT need to modify this file.
// All button configuration and registration happens in Part 1.
// This file simply handles button visibility updates when the view changes.

var tray = seedcodeCalendar.get('customButtonTray');
tray?.appActions?.afterEventsRendered({action: action});
