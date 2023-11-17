//Horizontal mouse scroll to page change

//Purpose:
//Listens to mouse scroll horizontal clicks and translates that to paging back and forth on the calendar

//Action Type: After Calendar Rendered
//Prevent Default Action: No

//More info on On Calendars Fetched actions and objects here:
//https://docs.dayback.com/article/140-custom-app-actions

var config = {
	delay: 1000,
};

setTimeout(function () {
	Initialize(seedcodeCalendar);
}, 1000);

function Initialize(seedcodeCalendar) {
	console.log('initializing Horizontal Scroll to Date Change');
	var scroll = document.getElementsByClassName('calendar-scroll')[0];
	var view;
	var backTimeout;
	var fwdTimeout;
	var lastScrollDirection;
	var clickTimeout;

	let navButtonLeft = document.querySelector('.dbk_icon_arrow_left');
	let navButtonRight = document.querySelector('.dbk_icon_arrow_right');

	if (scroll) {
		scroll.onwheel = function (e) {
			view = seedcodeCalendar.get('view');
			if (
				e.deltaX < 0 &&
				e.deltaY == 0 &&
				!clickTimeout &&
				(!backTimeout || lastScrollDirection === 'fwd')
			) {
				lastScrollDirection = 'back';
				backTimeout = true;
				clickTimeout = true;
				navButtonLeft.click();
				setTimeout(function () {
					backTimeout = false;
					clickTimeout = false;
				}, config.delay);
			} else if (
				e.deltaX > 0 &&
				e.deltaY == 0 &&
				!clickTimeout &&
				(!fwdTimeout || lastScrollDirection === 'back')
			) {
				lastScrollDirection = 'fwd';
				fwdTimeout = true;
				clickTimeout = true;
				navButtonRight.click();
				setTimeout(function () {
					fwdTimeout = false;
					clickTimeout = false;
				}, config.delay);
			}
		};
	}
}
