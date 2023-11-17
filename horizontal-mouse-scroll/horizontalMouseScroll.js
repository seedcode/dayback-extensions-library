

//Horizontal mouse scroll to page change

//Purpose:
//Listens to mouse scroll horizontal clicks and translates that to paging back and forth on the calendar

//Action Type: After Calendar Rendered
//Prevent Default Action: No

//More info on On Calendars Fetched actions and objects here:
//https://docs.dayback.com/article/140-custom-app-actions

var config = {
	delay: 1000,
}

setTimeout(function () { Initialize(seedcodeCalendar); }, 1000);

function Initialize(seedcodeCalendar) {
	console.log('initializing Horizontal Scroll to Date Change');
	var scroll = document.getElementsByClassName('calendar-scroll')[0];
	var view;
	var backTimeout;
	var fwdTimeout;
	var lastScrollDirection;
	var focusDate;

	if (scroll) {
		scroll.onwheel = function (e) {
			view = seedcodeCalendar.get('view');
			if (e.deltaX < 0 && (!backTimeout || lastScrollDirection === 'fwd')) {
				lastScrollDirection = 'back';
				if (view.name === 'month' || view.name === 'agendaResourceVert') {
					focusDate = moment(view.title).subtract(1, 'months');
				}
				else {
					focusDate = view.start.clone().subtract(view.end.clone().diff(view.start.clone(), 'days'), 'days');
				}
				location.hash = "/?date=" + focusDate.toISOString();
				backTimeout = true;
				setTimeout(function () { backTimeout = false; }, config.delay);
			}
			else if (e.deltaX > 0 && (!fwdTimeout || lastScrollDirection === 'back')) {
				lastScrollDirection = 'fwd';
				if (view.name === 'month' || view.name === 'agendaResourceVert') {
					focusDate = moment(view.title).add(1, 'months');
				}
				else {
					focusDate = view.end.clone();
				}
				location.hash = "/?date=" + focusDate.toISOString();
				fwdTimeout = true;
				setTimeout(function () { fwdTimeout = false; }, config.delay);
			}
		}
	}
}
