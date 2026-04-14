//DayBack Meetings API integration custom action v6.0
// License: MIT

//Purpose:
//Communicates with the DayBack Meetings API to Create/Delete/Reschedule a meeting

//This code is designed to be used for all custom and event actions required for
//connecting with screen-share meeting services.
//The same code will be used for each action. For each action, be sure to
//specify the "meetingType" and "action" values in the config variable just below.

//Action Type: Custom Button Action
//Open in new window: No

//More info on custom button actions here:
//https://docs.dayback.com/article/5-custom-actions

Initialize(editEvent, location, innerWidth, innerHeight);

//Set Config and initialize call to Meetings API
function Initialize(editEvent, location, innerWidth, innerHeight) {
	//----------- You shouldn’t need to edit below this line -------------------

	seedcodeCalendar.get('ado-zoomFunction')(
		'deauthorize',
		editEvent,
		changesObject,
		location,
		innerWidth,
		innerHeight,
		screenY,
		screenX
	);
}
