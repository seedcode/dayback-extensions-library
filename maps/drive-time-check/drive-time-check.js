// Purpose: Check Drive Times between events that are close and warn if the events are closer than the required travel time
// Action Type: On Event Save, Button Action
// Prevent Default Action: No
// Requires: Map core functions
// Version: v1.0.0

// @ts-ignore
const globals = {dbk, seedcodeCalendar, utilities, editEvent, event};

const globalPrefix = 'dbk_maps_';

// Global imports
const surroundingEventDriveTimes = globals.seedcodeCalendar.get(
	`${globalPrefix}surroundingEventDriveTimes`
);

/** @typedef {{format: Function, diff: Function}} Moment */
/** @typedef {{event: Event}} EditEvent */
/** @typedef {{start: Moment, end: Moment, unscheduled: boolean, schedule: {isMapOnly: boolean}}} Event */
/** @typedef {{distance: number, duration: number, event: Event}} EventDistance */

checkDriveTimes(globals.editEvent.event || globals.event);

/** @type {(event: Event) => void} */
function checkDriveTimes(event) {
	if (event.unscheduled || event.schedule.isMapOnly) {
		return;
	}

	surroundingEventDriveTimes(event)
		.then((/** @type {Array<EventDistance>} */ eventDistances) => {
			let conflict;
			for (const placement in eventDistances) {
				const compareEvent = eventDistances[placement].event;
				const compareDuration = eventDistances[placement].duration;

				let compareDate;
				let compareTargetDate;
				let diff;

				if (placement === 'during') {
					globals.utilities.showModal(
						'Drive Time Conflict',
						`You have conflicting overlapping events regardless of travel time.`,
						null,
						null,
						'OK'
					);
					return;
				} else if (placement === 'before') {
					compareDate = compareEvent.end;
					compareTargetDate = event.start;
					diff = compareTargetDate.diff(compareDate, 'minutes');
				} else if (placement === 'after') {
					compareDate = compareEvent.start;
					compareTargetDate = event.end;
					diff = compareDate.diff(compareTargetDate, 'minutes');
				}

				const discrepency = compareDuration - diff;
				if (
					discrepency > 0 &&
					(!conflict || conflict.discrepency > discrepency)
				) {
					conflict = {
						event: compareEvent,
						discrepency: compareDuration - diff,
						duration: compareDuration,
						diff: diff,
						compareDate: compareDate,
						compareTargetDate: compareTargetDate,
						compareString:
							placement === 'before' ? 'ends at' : 'starts at',
					};
				}
			}

			if (conflict) {
				globals.utilities.showModal(
					'Drive Time Conflict',
					`You have only alloted ${conflict.diff} minutes between the event that ${conflict.compareString} ${conflict.compareDate?.format('LT')} and this one, but it requires ${conflict.duration} minutes of travel time.`,
					null,
					null,
					'OK'
				);
			}
		})
		.catch((/** @type {Error} */ err) => {
			globals.utilities.showModal(
				'Error Checking Drive Times',
				err,
				'OK'
			);
		});
}
