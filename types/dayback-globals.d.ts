// =============================================================================
// DayBack Calendar — Global Type Declarations
// Provides IntelliSense / autocomplete for DayBack action globals in VS Code.
// =============================================================================

// ---------------------------------------------------------------------------
// Moment (minimal shape used by DayBack)
// ---------------------------------------------------------------------------

interface DayBackMoment {
	format(fmt?: string): string;
	toDate(): Date;
	toISOString(): string;
	valueOf(): number;
	unix(): number;
	clone(): DayBackMoment;
	isBefore(other: DayBackMoment | Date | string): boolean;
	isAfter(other: DayBackMoment | Date | string): boolean;
	isSame(other: DayBackMoment | Date | string, granularity?: string): boolean;
	isBetween(
		a: DayBackMoment | Date | string,
		b: DayBackMoment | Date | string
	): boolean;
	add(amount: number, unit: string): DayBackMoment;
	subtract(amount: number, unit: string): DayBackMoment;
	startOf(unit: string): DayBackMoment;
	endOf(unit: string): DayBackMoment;
	diff(
		other: DayBackMoment | Date | string,
		unit?: string,
		precise?: boolean
	): number;
	year(): number;
	month(): number;
	date(): number;
	day(): number;
	hour(): number;
	minute(): number;
	second(): number;
	isValid(): boolean;
	tz(timezone: string): DayBackMoment;
	utc(): DayBackMoment;
	local(): DayBackMoment;
}

// ---------------------------------------------------------------------------
// Schedule / Source
// ---------------------------------------------------------------------------

/** A DayBack calendar source (schedule) configuration object. */
interface DayBackSchedule {
	/** DayBack's internal unique ID for this source. */
	id: string;
	/** The display name of this calendar source, as configured in DayBack admin. */
	name: string;
	/** The platform-level source identifier. */
	sourceID: string;
	/**
	 * Numeric source type identifying the data platform.
	 * 1 = FileMaker Client, 2 = FileMaker CWP, 3 = Google Calendar, 4 = Salesforce,
	 * 5 = Microsoft 365, 6 = DayBack, 7 = Basecamp, 8 = FileMaker JS (Data API), 9 = Google Sheets.
	 */
	sourceTypeID: number;
	/** Default event text color for this source. */
	color: string;
	/** Default event background color for this source. */
	backgroundColor: string;
	/** Whether this source is currently toggled on in the sidebar. */
	selected: boolean;
	/** Whether the current user has edit permissions for this source. */
	editable: boolean;
	localParent?: boolean;
	/** Custom field definitions keyed by DayBack field ID. Use to look up field labels, types, and picklist values. */
	customFields?: Record<string, DayBackCustomFieldDef>;
	/** Reverse lookup: maps DayBack field name to raw source field ID. */
	customFieldMapLookup?: Record<string, string>;
	/** Maps DayBack standard field names (title, start, status, etc.) to source field names. */
	fieldMap?: Record<string, string>;
	projectObjects?: any[];
	[key: string]: any;
}

/** Definition of a custom field configured for a DayBack calendar source. */
interface DayBackCustomFieldDef {
	/** Raw source field ID (e.g., Salesforce API name, FileMaker field name). */
	id: string;
	/** DayBack's internal field name alias. */
	name: string;
	/** Human-readable label shown in the DayBack UI. */
	label: string;
	/** Field type: 'text' | 'select' | 'date' | 'number' | 'checkbox' | etc. */
	type: string;
	[key: string]: any;
}

// ---------------------------------------------------------------------------
// Filter Item
// ---------------------------------------------------------------------------

/** Selection and expansion state for a DayBack filter item. */
interface DayBackFilterItemStatus {
	/** Whether the folder is expanded in the sidebar. Defaults to false. */
	folderExpanded?: boolean;
	/** Whether this item is currently selected/filtered-on. */
	selected?: boolean;
}

/** A filter item used in DayBack's sidebar (resource, status, contact, or project list entry). */
interface DayBackFilterItem {
	/** Display name of the filter item (e.g., resource name, status label). */
	name: string;
	/** Optional source record ID associated with this filter item. */
	id?: string;
	/** Display color for this filter item in the sidebar. */
	color?: string;
	/** Folder name if this item is grouped under a folder in the sidebar. */
	folderName?: string;
	/** Selection and expansion state for this filter item. */
	status?: DayBackFilterItemStatus;
	/** Numeric sort position controlling display order. */
	sort?: number;
	/** Short display name. Resources only. */
	shortName?: string;
	/** CSS class assigned to this filter item. Resources only. */
	class?: string;
	/** Description text; may contain HTML. Resources only. */
	description?: string;
	/** ID of the folder this item belongs to. */
	folderID?: string;
	/** When true, this item is a folder rather than a leaf filter. */
	isFolder?: boolean;
	/** Read-only name without special characters. */
	nameSafe?: string;
	/** Read-only display string. */
	display?: string;
	/** Array of tag objects for this filter item. */
	tags?: {name: string; class?: string}[];
	[key: string]: any;
}

// ---------------------------------------------------------------------------
// Event
// ---------------------------------------------------------------------------

/**
 * A DayBack calendar event object. Available as `event` and `editEvent` in action code.
 * `event` is the original saved state; `editEvent` is the live working copy in the open popover.
 * Custom field values are accessible by their mapped field names as index properties.
 */
interface DayBackEvent {
	/** Display title shown on the calendar block. Read-only during rendering. */
	title: string;
	/** Editable title in the open event popover. Modify this to rename the event before saving. */
	titleEdit: string;
	/** Event start time as a Moment object. Use `.format()`, `.add()`, `.diff()` etc. */
	start: DayBackMoment;
	/** Event end time as a Moment object. */
	end: DayBackMoment;
	/** True when this is an all-day event with no time component. */
	allDay: boolean;
	/** True when the event lives in the unscheduled/to-do sidebar rather than the calendar grid. */
	unscheduled?: boolean;
	/** Notes or description for the event. May contain HTML depending on the source configuration. */
	description: string;
	/** Location string for the event. */
	location: string;
	/** DayBack's stable unique identifier for this event across renders. Use to match events in callbacks. */
	eventID: string;
	/** The data source's native record ID (Salesforce `Id`, FileMaker record ID, Google event ID, etc.). */
	recordID?: string;
	/** The name of the DayBack calendar source this event belongs to. Matches `schedule.name`. */
	eventSource: string;
	/** URL opened when clicking the event title link (configured in source settings). */
	eventURL?: string;
	/** Background fill color of the event block as a CSS hex string (e.g., '#4285F4'). */
	color: string;
	/** Border color of the event block. Falls back to `color` when unset. */
	borderColor?: string;
	/** Text color of the event title on the calendar block. */
	textColor?: string;
	/** CSS class names applied to the rendered event element. Always an array at runtime — FullCalendar normalizes string inputs before actions execute. Use `event.className.push('my-class')` to add classes. */
	className: string[];
	/** Whether the current user can drag or resize this event. Controlled by source edit permissions. */
	editable: boolean;
	/**
	 * Array of resource names assigned to this event.
	 * For single-resource events use `event.resource[0]`.
	 * To change the resource in an action: `editEvent.resource = ['Resource Name']`
	 */
	resource: string[];
	/** Array of resource record IDs corresponding to `resource` entries, in the same index order. */
	resourceID?: string[];
	/**
	 * Array of status values. DayBack always reads the active status from index 0.
	 * @example
	 * if (event.status[0] === 'Confirmed') { ... }
	 * editEvent.status = ['In Progress'];
	 */
	status: string[];
	/** Array of contact/attendee names linked to this event. */
	contactName: string[];
	/** Array of contact record IDs corresponding to `contactName`, in the same index order. */
	contactID?: string[];
	/** Pre-formatted display string for contacts (e.g., "Alice, Bob"). Read-only. */
	contactDisplay?: string;
	/** Array of project names linked to this event. */
	projectName: string[];
	/** Array of project record IDs corresponding to `projectName`, in the same index order. */
	projectID?: string[];
	/** Pre-formatted display string for projects. Read-only. */
	projectDisplay?: string;
	/** Comma-separated tag string. Parse with `event.tags?.split(',').map(t => t.trim())`. */
	tags?: string;
	/** Start time as a formatted string from the source (not derived from the `start` Moment). */
	timeStart?: string;
	/** End time as a formatted string from the source (not derived from the `end` Moment). */
	timeEnd?: string;
	/** Google Calendar or Microsoft 365 attendee objects. Shape varies by platform. */
	attendees?: any[];
	/** Internal DayBack render-state object. Do not modify. */
	eventStatus?: any;
	/** True when this is a cloned rendering of a recurring event instance, not the root record. */
	isClone?: boolean;
	/**
	 * The schedule (calendar source) configuration this event belongs to.
	 * Use `event.schedule.fieldMap` for field mappings and `event.schedule.customFields` for custom field definitions.
	 */
	schedule: DayBackSchedule;
	/** Raw source payload. Shape varies by platform (Salesforce REST record, FileMaker JSON row, etc.). */
	source: any;
	/** For recurring event instances, the ID of the parent series. The instance-specific ID is in `eventID`. */
	recurringEventID?: string;
	/** Creation timestamp in Unix milliseconds. */
	created?: number;
	/**
	 * Numeric source type identifying the data platform.
	 * 1 = FileMaker Client, 2 = FileMaker CWP, 3 = Google Calendar, 4 = Salesforce,
	 * 5 = Microsoft 365, 6 = DayBack, 7 = Basecamp, 8 = FileMaker JS (Data API), 9 = Google Sheets.
	 */
	sourceTypeID?: number;
	shareSourceTypeID?: number;
	/** Index signature for custom field access by mapped field name or raw source field ID. */
	[key: string]: any;
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

/** A live tooltip instance returned by `dbk.tooltip()`. */
interface DayBackTooltipInstance {
	uid: string;
	/** Displays the tooltip, optionally updating its content. */
	show(title?: string): void;
	/** Hides the tooltip. */
	hide(): void;
	/** When true, the tooltip stays open until explicitly hidden (useful for click-triggered tooltips). */
	setKeepAlive(keepAlive: boolean): void;
}

/** Options passed to `dbk.tooltip()`. */
interface DayBackTooltipOptions {
	/**
	 * Delay before showing/hiding in ms, or asymmetric `{ show, hide }` object.
	 * @example { show: 300, hide: 0 }
	 */
	delay?: number | {show: number; hide: number};
	/** If true, the tooltip starts hidden and must be shown via `.show()`. */
	hide?: boolean;
	/** Anchor placement for the tooltip bubble. Defaults to 'auto'. */
	placement?: 'auto' | 'top' | 'right' | 'bottom' | 'left';
	/** CSS class name(s) added to the tooltip wrapper element for custom styling. */
	className?: string;
	/** The DOM element the tooltip is anchored to. Required when calling from inside a popover. */
	targetElement?: HTMLElement;
	/** If true, clicking the target element dismisses the tooltip. */
	hideOnClick?: boolean;
	/** CSS selector or element used as the tooltip's DOM container. Defaults to 'body'. */
	container?: string;
	/** DayBack event context for event-aware tooltip positioning. */
	event?: DayBackEvent;
	/** Called after the tooltip element is inserted into the DOM. */
	postRenderFunction?: () => void;
	/** Called when the tooltip element is removed from the DOM. */
	postDestroyFunction?: () => void;
}

// ---------------------------------------------------------------------------
// Observer
// ---------------------------------------------------------------------------

/** A live observer instance returned by `dbk.observe()`. */
interface DayBackObserverInstance {
	/** Pauses this observer. Call `restart()` to resume without recreating. */
	stop(): void;
	/** Resumes a paused observer. Safe to call even if still running. Use after DOM re-renders to re-check. */
	restart(): void;
	/** Permanently tears down the observer. Cannot be resumed after `destroy()`. */
	destroy(): void;
	/** Manually activates an observer created with `autoStart: false`. */
	start(): void;
	/** The DOM element matched by the `until` selector when the observer fired. Inspect this in your `then` callback. */
	foundNode: HTMLElement | null;
	/** The MutationRecord that most recently triggered the stop-condition check. */
	lastMutation: MutationRecord | null;
	/** All MutationRecords accumulated since the observer started. */
	mutationList: MutationRecord[];
}

/** Configuration passed to `dbk.observe()`. */
interface DayBackObserveConfig {
	/** Unique name for this observer. Prevents duplicate registration; appears in debug logs. */
	name: string;
	/** DOM element or CSS selector to watch for mutations. If a selector string, DayBack waits for it to exist in the DOM before attaching. Accepts any `Element` (e.g. from `document.querySelector()`). */
	watch: string | Element;
	/** CSS selector or predicate that signals completion. The `then` callback fires when a matching element is found or the function returns true. */
	until: string | (() => boolean);
	/** Callback executed when the `until` condition is met. Access the matched element via `observer.foundNode`. */
	then: (observer: DayBackObserverInstance) => void;
	/** Evaluate the `until` condition immediately on start, before any DOM mutations occur. Defaults to false. */
	checkStopConditionOnStart?: boolean;
	/** Stop watching for further mutations after the stop condition is first met. Defaults to false. */
	whenFoundStopObserving?: boolean;
	/** Prevent the `then` callback from firing again if the condition re-triggers. Defaults to false. */
	whenFoundStopProcessing?: boolean;
	/** Start observing immediately on creation. Set to false to start manually with `observer.start()`. Defaults to true. */
	autoStart?: boolean;
	/** Milliseconds to wait before activating. Useful for elements that appear after async rendering. */
	startDelay?: number;
	/** Log observer lifecycle events to the console for timing diagnosis. */
	debug?: boolean;
	/** Raw MutationObserver init options override. Defaults to `{ childList: true, subtree: true }`. */
	options?: MutationObserverInit;
	/** Mutation type to watch: 'childList' | 'attribute' | 'both'. Defaults to 'childList'. */
	mutationType?: 'childList' | 'attribute' | 'both';
}

// ---------------------------------------------------------------------------
// Popover config
// ---------------------------------------------------------------------------

/**
 * Configuration for `dbk.popover()` / `utilities.popover()`.
 * Any extra properties added here are accessible in the template as `popover.config.*`.
 */
interface DayBackPopoverConfig {
	/** CSS selector or element that the popover is rendered inside. Use '#calendar-container' or '#app-container'. */
	container?: HTMLElement | string;
	/** Optional DOM id to assign the popover element. */
	id?: string;
	/** Display style: 'modal' for a centered dialog overlay, 'popover' for an inline panel. */
	type?: 'modal' | 'popover' | (string & {});
	/** CSS class name(s) added to the outermost popover wrapper. Use for scoped styling. */
	class?: string;
	/** Width of the popover in pixels. */
	width?: number;
	/** Height of the popover in pixels. */
	height?: number;
	/** Horizontal position offset in pixels (popover type only). */
	positionX?: number;
	/** Vertical position offset in pixels (popover type only). */
	positionY?: number;
	/** If true, the height does not resize to content. */
	staticHeight?: boolean;
	direction?: string;
	/** Called just before the popover becomes visible. */
	onShow?: () => void;
	/** Called after the popover is fully visible. Use to run DOM setup (e.g., focus an input). */
	onShown?: () => void;
	/** Called just before the popover starts hiding. */
	onHide?: () => void;
	/** Called after the popover is fully hidden. */
	onHidden?: () => void;
	/** Controls visibility. Set to false in a callback to close the popover: `popover.config.show = false`. */
	show?: boolean;
	/** If true, the popover DOM element is removed when hidden. Use for one-time dialogs. */
	destroy?: boolean;
	/** Index signature: any additional properties are accessible in templates as `popover.config.myProp`. */
	[key: string]: any;
}

// ---------------------------------------------------------------------------
// Manage Filters
// ---------------------------------------------------------------------------

/** Sidebar filter management API. Access via `dbk.manageFilters`. */
interface DayBackManageFilters {
	/** Deselects all active filters. Pass `refetch: true` to immediately re-query events. */
	clearFilters(refetch?: boolean): void;
	/** Applies a keyword search to the given filter list (e.g., searching resources by name). */
	applyFilterSearch(
		keyWord: string,
		type: string,
		updateView?: boolean,
		forceApply?: boolean,
		callback?: () => void
	): void;
	/**
	 * Toggles a filter item on or off.
	 * @param type - 'statuses' | 'resources' | 'contacts' | 'projects'
	 * @example
	 * dbk.manageFilters.toggle({ name: 'Confirmed' }, 'statuses');
	 */
	toggle(filterItem: DayBackFilterItem, type: string): void;
	/** Persists the current filter selection state so it is restored on next load. */
	saveState(filterList: string, type: string): void;
}

// ---------------------------------------------------------------------------
// Resource Manager
// ---------------------------------------------------------------------------

/** Programmatic resource list management. Access via `dbk.resourceManager`. */
interface DayBackResourceManager {
	/** Returns the array of resource filter items currently displayed on screen. */
	getViewed(): DayBackFilterItem[];
	/** Sets the number of resource columns in the resource view layout. */
	updateColumns(columns: number, refetch?: boolean): void;
	/** Reloads and re-renders the resource list sidebar. */
	reset(
		refetch?: boolean,
		resetScroll?: boolean,
		preventFilterRefetch?: boolean
	): void;
}

// ---------------------------------------------------------------------------
// Custom field proxy
// ---------------------------------------------------------------------------

interface DayBackCustomFieldProxy {
	[fieldName: string]: any;
}

// ---------------------------------------------------------------------------
// dbk
// ---------------------------------------------------------------------------

/**
 * DayBack's primary API object. Available as the `dbk` global in all app and event actions.
 *
 * @example
 * dbk.showMessage('Saved!', 0, 3000);
 *
 * @example
 * dbk.createEvent({
 *   event: { title: 'Follow Up', start: moment(), end: moment().add(30, 'minutes') },
 *   calendarName: 'Salesforce Events',
 *   callback: function (result) {
 *     if (result.error) { reportError(result.error); }
 *   }
 * });
 *
 * @example
 * dbk.observe({
 *   name: 'waitForSaveBtn',
 *   watch: '.dbk_editEvent',
 *   until: '.dbk_button_success',
 *   then: function (observer) {
 *     observer.stop();
 *     observer.foundNode.addEventListener('click', handleSave);
 *   }
 * });
 */
interface DBK {
	// ---------------------------------------------------------------------------
	// UI: Tooltips, Messages & Popovers
	// ---------------------------------------------------------------------------

	/**
	 * Displays a tooltip anchored to a DOM element.
	 * Always provide `options.targetElement` when calling from inside a custom popover.
	 * @example
	 * const tip = dbk.tooltip('<b>Required field</b>', { targetElement: el, placement: 'top' });
	 * el.addEventListener('mouseleave', () => tip.hide());
	 */
	tooltip(
		content: string,
		options?: DayBackTooltipOptions
	): DayBackTooltipInstance;

	/**
	 * Shows a dismissible banner message in the calendar UI.
	 * @param content - HTML string for the message body
	 * @param showDelay - Milliseconds before the message appears (0 = immediate)
	 * @param hideDelay - Milliseconds before auto-dismissing (0 = stays until dismissed)
	 * @param type - Visual style: null = default blue, 'success', 'warning', 'error'
	 * @example
	 * dbk.showMessage('Event saved!', 0, 3000);
	 * dbk.showMessage('<b>Processing…</b>', 0, 0); // stays until dismissed
	 */
	showMessage(
		content: string,
		showDelay?: number,
		hideDelay?: number,
		type?: string | null,
		actionFunction?: (() => void) | null,
		logError?: boolean
	): void;

	/**
	 * Closes all currently open event edit popovers.
	 */
	closePopovers(): void;

	/**
	 * Forces the open event edit popover to re-render from the current `editEvent` state.
	 * Use after programmatically modifying `editEvent` fields to reflect the change in the UI.
	 * @example
	 * editEvent.title = 'Renamed';
	 * dbk.refreshEditPopover(editEvent);
	 */
	refreshEditPopover(editEvent: DayBackEvent): void;

	/**
	 * Opens an Angular-bound modal or popover with a custom HTML template.
	 * `ng-click`, `ng-model`, and `ng-repeat` directives work inside the template.
	 * Extra properties added to `config` are accessible in the template as `popover.config.*`.
	 * Set `config.type: 'modal'` for a centered dialog or `'popover'` for an inline panel.
	 * @example
	 * dbk.popover(
	 *   { type: 'modal', show: true, destroy: true, message: 'Hello!',
	 *     onClose: function () { action.callbacks.confirm(); } },
	 *   `<div>
	 *     <p>{{popover.config.message}}</p>
	 *     <button ng-click="popover.config.onClose()">OK</button>
	 *   </div>`
	 * );
	 */
	popover(
		config: DayBackPopoverConfig,
		content: string
	): {element: HTMLElement; destroy(): void};

	// ---------------------------------------------------------------------------
	// Event CRUD
	// ---------------------------------------------------------------------------

	/**
	 * Renders a display-only event directly on the calendar without saving to any source.
	 * Use for visual overlays, background blocks, and computed time markers.
	 * @example
	 * dbk.addEvent({ title: 'Buffer', start: moment(), end: moment().add(1, 'hour'), color: '#ccc', editable: false });
	 */
	addEvent(event: Partial<DayBackEvent>): void;

	/**
	 * Renders multiple display-only events at once. More efficient than repeated `addEvent` calls.
	 * @example
	 * dbk.addEvents(slots.map(s => ({ title: 'Open', start: s.start, end: s.end, color: '#9f9' })));
	 */
	addEvents(events: Partial<DayBackEvent>[]): void;

	/**
	 * Creates and saves a new event in a data source calendar.
	 * Identify the target calendar with either `calendarID` or `calendarName`.
	 * @example
	 * dbk.createEvent({
	 *   event: { title: 'Follow Up', start: moment(), end: moment().add(30, 'minutes') },
	 *   calendarName: 'Salesforce Events',
	 *   callback: function (result) {
	 *     if (result.error) { return reportError(result.error); }
	 *   }
	 * });
	 */
	createEvent(params: {
		event: Partial<DayBackEvent>;
		calendarID?: string;
		calendarName?: string;
		renderEvent?: boolean;
		callback?: (result: {
			event: DayBackEvent;
			isShown: boolean;
			error?: any;
		}) => void;
		preventWarnings?: boolean;
	}): void;

	/**
	 * Saves field changes to an existing event in its data source.
	 * Pass only the changed fields in `changesObject` — never the full event object.
	 * Use `options.isCustomAction: true` to suppress DayBack's built-in save dialogs.
	 * @param revertFunc - Called if the save fails. Receives `(callback, targetEvent, error)`. Pass `null` to skip.
	 * @param callback - Called on completion (success or error). Pass `null` to skip.
	 * @example
	 * dbk.updateEvent(
	 *   event,
	 *   { status: ['Confirmed'] },
	 *   revertObject,
	 *   function (result) { if (result?.error) { reportError(result.error); } },
	 *   { isCustomAction: true }
	 * );
	 */
	updateEvent(
		event: DayBackEvent,
		changesObject: Record<string, any>,
		revertFunc:
			| ((
					callback: () => void,
					targetEvent: DayBackEvent,
					error: any
			  ) => void)
			| null,
		callback: ((result: any) => void) | null,
		options?: {
			isCustomAction?: boolean;
			isUndo?: boolean;
			endShifted?: boolean;
		}
	): void;

	/**
	 * Deletes an event from its data source. Supply either `event` or `editEvent`.
	 * @example
	 * dbk.deleteEvent({
	 *   event: event,
	 *   callback: function (result) { if (result?.error) { reportError(result.error); } }
	 * });
	 */
	deleteEvent(params: {
		event?: DayBackEvent;
		editEvent?: DayBackEvent;
		/** For recurring events: 'single' = this instance only, 'future' = this and following, 'all' = entire series. */
		repetitions?: 'future' | 'all' | 'single';
		closePopovers?: boolean;
		callback?: (result: null | {error: {message: string}}) => void;
	}): void;

	/**
	 * Syncs changes from `event` into the live `editEvent` object without saving.
	 * Use after programmatically modifying an event to reflect those changes in the open popover UI.
	 */
	updateEditEvent(event: DayBackEvent, editEvent: DayBackEvent): void;

	/**
	 * Returns an object of changed fields by diffing `editEvent` against the original `event`,
	 * or `false` if nothing has changed. Use to conditionally skip saves.
	 * @example
	 * const diff = dbk.eventChanged(editEvent, event);
	 * if (!diff) { return action.callbacks.confirm(); }
	 */
	eventChanged(
		editEvent: DayBackEvent,
		event: DayBackEvent,
		endShifted?: boolean
	): Record<string, any> | false;

	/**
	 * Creates a shallow copy of an event object, optionally re-targeting it to a different schedule.
	 * Use when duplicating events before passing to `createEvent`.
	 */
	cloneEventObject(
		event: DayBackEvent,
		destinationSchedule?: DayBackSchedule
	): DayBackEvent;

	/**
	 * Returns true if the given field name is mapped and available for this event's calendar source.
	 * Use before writing to a custom field that may not exist on all sources.
	 * @example
	 * if (dbk.fieldExistsForEvent(editEvent.schedule, 'CF_Priority')) {
	 *   editEvent['CF_Priority'] = 'High';
	 * }
	 */
	fieldExistsForEvent(schedule: DayBackSchedule, field: string): boolean;

	// ---------------------------------------------------------------------------
	// Filters, Resources & Calendars
	// ---------------------------------------------------------------------------

	/**
	 * Normalizes a raw filter item into DayBack's internal filter format.
	 * Pass `stored: true` to return the persisted-state variant used in bookmarks.
	 */
	mutateFilterField(
		item: DayBackFilterItem,
		stored?: boolean
	): DayBackFilterItem;

	/** Sorts a filter item array alphabetically with an optional "no filter" label at the top. */
	filterFieldSort(
		filterItems: DayBackFilterItem[],
		noFilterLabel?: string,
		sortField?: string
	): DayBackFilterItem[];

	/** Converts a plain string name into a minimal DayBack filter item object `{ name: string }`. */
	nameToFilterItem(name: string): DayBackFilterItem;

	/**
	 * Reloads and re-renders the resource list in the left sidebar.
	 * @param refetch - Re-query sources for fresh resource data before rendering
	 */
	resetResources(
		refetch?: boolean,
		resetScroll?: boolean,
		preventFilterRefetch?: boolean
	): void;

	/** Programmatic resource list management. See `DayBackResourceManager` for available methods. */
	resourceManager: DayBackResourceManager;

	/**
	 * Sets the number of resource columns in the resource view layout.
	 * @example
	 * dbk.updateResourceColumns(3, true);
	 */
	updateResourceColumns(columns: number, refetch?: boolean): void;

	/**
	 * Direct access to DayBack's sidebar filter management API.
	 * @example
	 * dbk.manageFilters.toggle({ name: 'Confirmed' }, 'statuses');
	 * dbk.manageFilters.clearFilters(true);
	 */
	manageFilters: DayBackManageFilters;

	/**
	 * Toggles a calendar source visible or hidden in the sidebar.
	 * @example
	 * const cal = seedcodeCalendar.get('schedules').find(s => s.name === 'My Cal');
	 * dbk.toggleCalendar(cal);
	 */
	toggleCalendar(calendar: DayBackSchedule): void;

	/** Returns true if the given event would be visible given all currently active filters. */
	isEventShown(event: DayBackEvent): boolean;

	/**
	 * Fetches raw filter data of the given type from DayBack's internal store.
	 * @param type - 'statuses' | 'resources' | 'contacts' | 'projects'
	 */
	getRawFilterData(type: string, callback: (data: any) => void): void;

	/** Applies a keyword text filter to the sidebar filter panel. */
	applyListFilter(keyWord: string, type?: string): void;

	/**
	 * Returns items from `matchItems` that are also present in `listItems`, matched on the given property.
	 * Used to intersect two DayBack filter arrays.
	 */
	objectArrayMatch(
		matchItems: any[],
		listItems: any[],
		property?: string,
		contains?: boolean
	): any[];

	// ---------------------------------------------------------------------------
	// Multi-Select & Sorting
	// ---------------------------------------------------------------------------

	/**
	 * Adds or removes an event from the multi-select set.
	 * Pass `forceDeselect: true` to always remove the event from the selection.
	 */
	toggleMultiSelect(
		event: DayBackEvent | null,
		shiftKey: boolean,
		targetElement: HTMLElement | null,
		view: any,
		forceDeselect?: boolean
	): void;

	/**
	 * Sets the render sort priority so an event appears above others in the same time slot.
	 * Resets on the next calendar redraw.
	 */
	setEventSortPriority(event: DayBackEvent, sortValue: string | number): void;

	/**
	 * Overrides the persistent sort order for an event across redraws.
	 * Unlike `setEventSortPriority`, this persists until explicitly reset.
	 */
	setEventSortOverride(event: DayBackEvent, sortValue: string | number): void;

	// ---------------------------------------------------------------------------
	// Date/Time & Timezone
	// ---------------------------------------------------------------------------

	/**
	 * Converts a local browser-time Moment to the calendar's active display timezone.
	 * Use when computing times that must respect the "Show in Timezone" setting.
	 */
	localTimeToTimezoneTime(
		date: DayBackMoment,
		isAllDay?: boolean
	): DayBackMoment;

	/** Converts a display-timezone Moment back to browser local time. */
	timezoneTimeToLocalTime(
		date: DayBackMoment,
		isAllDay?: boolean
	): DayBackMoment;

	// ---------------------------------------------------------------------------
	// Custom Fields
	// ---------------------------------------------------------------------------

	/**
	 * Looks up the raw source field ID for a DayBack custom field by its mapped display name.
	 * @example
	 * const fieldId = dbk.getCustomFieldIdByName('Priority', event.schedule);
	 */
	getCustomFieldIdByName(
		storeInFieldName: string,
		schedule: DayBackSchedule
	): string;

	/**
	 * Returns a proxy object whose keys are human-readable custom field labels.
	 * Reads and writes through this proxy update the underlying raw field IDs on the event.
	 * @example
	 * const cf = dbk.resolveCustomFields({ event, schedule: event.schedule });
	 * const priority = cf['Priority'];
	 * cf['Approval Status'] = 'Confirmed';
	 */
	resolveCustomFields(params: {
		event?: DayBackEvent;
		schedule?: DayBackSchedule;
		changes?: Record<string, any>;
	}): DayBackCustomFieldProxy;

	// ---------------------------------------------------------------------------
	// Configuration & Theme
	// ---------------------------------------------------------------------------

	/** Changes a DayBack global config setting by key and optionally re-initializes. */
	changeConfigSetting(settingName: string, preventInit?: boolean): void;

	/** Re-applies a specific config section to the live calendar without a full reload. */
	updateConfig(settingKey: string): void;

	/**
	 * Switches the active calendar CSS theme.
	 * @param theme - 'light' | 'dark', or a custom theme name registered in settings
	 * @example
	 * dbk.applyTheme('dark');
	 */
	applyTheme(theme: string): void;

	// ---------------------------------------------------------------------------
	// Kiosk & Bookmarks
	// ---------------------------------------------------------------------------

	/**
	 * Activates kiosk mode, auto-refreshing the calendar at a fixed interval.
	 * @param refreshInterval - Seconds between automatic refreshes
	 * @param preventDateChange - If true, locks the calendar on the current date view
	 */
	startKioskMode(refreshInterval: number, preventDateChange?: boolean): void;

	/** Fetches the current user's saved bookmark list. */
	getBookmarkList(
		callback: (result: Record<string, any> | null) => void
	): void;

	// ---------------------------------------------------------------------------
	// Language & Translations
	// ---------------------------------------------------------------------------

	/** Returns the active DayBack language code (e.g., 'en', 'de', 'fr'). */
	getLanguage(): string;

	/**
	 * Looks up one or more translation keys and returns their localized strings.
	 * @example
	 * const t = dbk.getTranslations(['save', 'cancel']);
	 * button.textContent = t['save'];
	 */
	getTranslations(
		translationTerms: string | string[],
		translationValues?: Record<string, string>
	): Record<string, string>;

	/** Initializes the calendar's display language and optional locale. Use in an app action to override at runtime. */
	initializeLanguage(language: string, locale?: string): void;

	/**
	 * Adds or overrides translation strings for the given (or active) language.
	 * @example
	 * dbk.setTranslations({ save: 'Speichern', cancel: 'Abbrechen' }, 'de');
	 */
	setTranslations(
		translations: Record<string, string>,
		language?: string
	): void;

	// ---------------------------------------------------------------------------
	// View & Sidebar Control
	// ---------------------------------------------------------------------------

	/**
	 * Shows or hides the alt view (right-side panel: unscheduled events list or map).
	 * @example
	 * dbk.updateAltView({ show: true, type: 'map' });
	 */
	updateAltView(options: {show?: boolean; type?: string}): void;

	// ---------------------------------------------------------------------------
	// DOM Observation
	// ---------------------------------------------------------------------------

	/**
	 * Watches for a DOM condition and calls `then` when satisfied.
	 * Always prefer `dbk.observe()` over `setTimeout` for waiting on DOM elements — timing
	 * is reliable across all devices and view transitions.
	 * @example
	 * dbk.observe({
	 *   name: 'waitForSaveBtn',
	 *   watch: '.dbk_editEvent',
	 *   until: '.dbk_button_success',
	 *   then: function (observer) {
	 *     observer.stop();
	 *     observer.foundNode.addEventListener('click', handleSave);
	 *   }
	 * });
	 */
	observe(config: DayBackObserveConfig): DayBackObserverInstance;

	// ---------------------------------------------------------------------------
	// Utilities
	// ---------------------------------------------------------------------------

	/**
	 * Rate-limited request queue. Instantiate with `new dbk.requestThrottle(n)` to allow `n`
	 * calls per second. Useful for preventing API rate-limit errors in batch operations.
	 * @example
	 * const throttle = new dbk.requestThrottle(3);
	 * items.forEach(item => throttle.executeRequest(() => sf.update({ ... })));
	 */
	requestThrottle: new (requestsPerSecond: number) => {
		executeRequest(request: () => void): void;
	};

	// ---------------------------------------------------------------------------
	// FileMaker Integration — FileMaker platform only
	// ---------------------------------------------------------------------------

	/**
	 * @remarks FileMaker platform only.
	 * Executes a named FileMaker script with an optional parameter string and callback.
	 */
	performFileMakerScript(
		script: string,
		parameter: any,
		callback?: (result: {status: number; payload: any; error?: any}) => void,
		directCall?: boolean
	): void;

	/**
	 * @remarks FileMaker platform only.
	 * Builds a `fmp://` URL for invoking a FileMaker script via URL protocol.
	 */
	scriptURL(script: string, queryID?: string): string;

	/**
	 * @remarks FileMaker platform only.
	 * Navigates to the FileMaker layout associated with the given event's record.
	 */
	navigate(event: DayBackEvent): void;

	/**
	 * @remarks FileMaker platform only.
	 * Switches to the specific FileMaker layout record for the given event.
	 */
	showEventOnLayout(event: DayBackEvent): void;

	/**
	 * Registers a named JavaScript function that FileMaker can call asynchronously.
	 * The function is stored on the `dbk_fmFunctions` global registry and can be
	 * invoked from FM via `Perform JavaScript in Web Viewer`.
	 *
	 * @example
	 * dbk.registerFunctionCall('myCallback', function (result) {
	 *     if (result && result.payload) {
	 *         seedcodeCalendar.init('myData', result.payload);
	 *     }
	 * });
	 */
	registerFunctionCall(name: string, fn: (...args: any[]) => any): void;

	// ---------------------------------------------------------------------------
	// Map Manager — Map view only
	// ---------------------------------------------------------------------------

	/** Map data store and Google Maps API loader. Available when a map view is active. */
	mapManager: {
		/**
		 * Loads the Google Maps JavaScript API. Returns the `google` global once loaded.
		 * @example await dbk.mapManager.initialize({ apiKey: dbkEnv.GOOGLE_MAPS_KEY });
		 */
		initialize(options: {apiKey: string}): Promise<any>;
		/**
		 * Synchronous get from the map data store.
		 * Returns `null` if the key has not been set (except `'options'` which resolves immediately).
		 */
		get(key: string): any;
		/**
		 * Sets a value in the map data store.
		 * Resolves any pending `getAsync()` calls waiting for that key.
		 */
		set(key: string, value: any): void;
		/**
		 * Returns a Promise that resolves when the requested key is available.
		 * If the key already exists, resolves immediately.
		 */
		getAsync(key: string): Promise<any>;
	};
}

// ---------------------------------------------------------------------------
// seedcodeCalendar
// ---------------------------------------------------------------------------

interface DayBackView {
	name: string;
	getColWidth(): number;
	[key: string]: any;
}

interface DayBackConfig {
	// Views
	compressedView?: boolean;
	showAdminSettings?: boolean;
	showSidebar?: boolean;
	lockSidebar?: boolean;
	fluidMonths?: boolean;
	snapToMonth?: boolean;
	weekends?: boolean;
	distances?: boolean;
	hideEmptyBreakout?: boolean;
	horizonBreakoutField?: string;
	breakout?: boolean;
	allDaySlot?: boolean;
	slotEventOverlap?: boolean;
	maxAllDayEvents?: number;
	resourceColumns?: number;
	resourceDays?: number;
	resourcePosition?: number;
	weekCount?: number;
	horizonDays?: number;
	horizonSlider?: number;
	defaultSidebarTab?: string;
	/** @type {'month' | 'agendaWeek' | 'agendaDay' | 'basicHorizon' | 'basicResourceHorizon' | 'agendaResourceVert' | 'basicResourceVert'} */
	view?: string;
	defaultView?: string;
	/** Array of view/menu labels to hide from header navigation. Values: `'day'`, `'week'`, `'month'`, `'horizon'`, `'resource'`, `'resource daily'`, `'resource list'`, `'pivot list'`, `'share'`, `'notifications'`. */
	hideMenuItems?: string[];
	homeUrl?: string;
	breakoutTooltips?: boolean;
	unscheduledEnabled?: boolean;
	unscheduledSort?: string;
	showAltView?: boolean;
	altViewType?: string;
	altViewWidth?: number;
	mapActivated?: boolean;
	mapEnabled?: boolean;
	mapApiKey?: string;
	mapUnscheduled?: boolean;
	isVertical?: boolean;

	// Time Scales
	defaultTimedEventDuration?: string;
	slotDuration?: string;
	scrollTime?: string;
	minTime?: string;
	maxTime?: string;
	nextDayThreshold?: string;
	gridTimeColumns?: number;
	editTimeDuration?: string;

	// Date/Time Formats
	dateStringFormat?: string;
	dateStringShortFormat?: string;
	timeFormat?: string;
	firstDay?: number;
	minDate?: string;
	fiscalYearStarts?: number;
	weekNumbers?: boolean;
	locale?: string;

	// Event Styles
	defaultEventColor?: string;
	defaultBorderColor?: string;
	defaultTextColor?: string;
	defaultLightBorderColor?: string;
	defaultLightTextColor?: string;
	returnSub?: string;

	// Analytics
	measureAggregate?: string;
	measureThousandsSeparator?: string;

	// Platform & Identity
	account?: string;
	accountName?: string;
	/** First name of the logged-in user. Read-only; set by DayBack at startup. */
	firstName?: string;
	/** Last name of the logged-in user. Read-only; set by DayBack at startup. */
	lastName?: string;
	/** Internal user ID. Read-only; set by DayBack at startup. */
	userID?: string;
	admin?: boolean;
	isMobileDevice?: boolean;
	isShare?: boolean;
	defaultDate?: string;
	clientTimezone?: string;
	/** Timezone of the user's OS. Read-only; lazily populated via `moment.tz.guess()` on first conversion. */
	localTimezone?: string;
	language?: string;
	darkMode?: boolean;
	cssTheme?: string;
	noFilterLabel?: string;
	lazyFetching?: boolean;
	snapToToday?: boolean;
	sharePrivileges?: string;
	undoTimeout?: number;
	showInTimezone?: boolean;
	timezonesAvailable?: string;
	suppressEditEventMessages?: boolean;
	passthroughEditErrors?: boolean;
	doNotTrack?: boolean;
	useLocalSettings?: boolean;
	resourceListFilter?: string;
	unscheduledFilter?: string;
	bookmarkFilter?: string;
	/** When true, the entire calendar is read-only. No event editing is allowed. */
	readOnly?: boolean;
	/** Breakout field for shared/public calendar views. */
	shareBreakout?: string;
	/** Currently active breakout field for shared views. Read-only. */
	shareBreakoutField?: string;

	// Methods
	eventShown?(event: DayBackEvent, constrainToView?: boolean): boolean;
}

interface DayBackAnalytics {
	breakdownSummary: any;
	breakdownItems: any[];
}

interface DayBackMultiSelectMap {
	[eventId: string]: {event: DayBackEvent};
}

/**
 * The DayBack calendar state object. Provides read access to calendar data,
 * configuration, and persistent key/value storage.
 *
 * Available methods: get, getPersistent, init, set, setPersistent.
 * There is no `.log` method on this object.
 *
 * @example
 * // Read the current calendar config
 * const config = seedcodeCalendar.get('config');
 * const account = config.account;
 *
 * @example
 * // Read the list of loaded resources
 * const resources = seedcodeCalendar.get('resources');
 *
 * @example
 * // Read all schedules (calendars)
 * const schedules = seedcodeCalendar.get('schedules');
 *
 * @example
 * // Store and retrieve a persistent value across sessions
 * seedcodeCalendar.setPersistent('myKey', { value: 42 });
 * const stored = seedcodeCalendar.getPersistent('myKey');
 */
interface SeedcodeCalendar {
	get(key: 'resources'): DayBackFilterItem[];
	get(key: 'statuses'): DayBackFilterItem[];
	get(key: 'contacts'): string;
	get(key: 'projects'): string;
	get(key: 'schedules'): DayBackSchedule[];
	get(key: 'view'): DayBackView;
	get(key: 'date'): DayBackMoment;
	get(key: 'element'): DayBackCalendarElement;
	get(key: 'textFilters'): string;
	get(key: 'sidebar'): any;
	get(key: 'multiSelect'): DayBackMultiSelectMap;
	get(key: 'analytics'): DayBackAnalytics;
	get(key: 'config'): DayBackConfig;
	get(key: 'customFields'): any;
	get(key: 'sources'): any[];
	get(key: 'sourceTemplates'): any[];
	get(key: 'user'): any;
	get(key: 'userSettings'): any;
	get(key: 'settings'): any;
	get(key: 'calendarActions'): any;
	get(key: 'alt-view'): {
		enabled?: boolean;
		show?: boolean;
		type?: string;
		width?: number;
	};
	get(key: 'share'): any;
	get(key: 'shareSources'): any;
	get(key: 'breakoutSchedules'): DayBackFilterItem[];
	get(key: 'breakoutCustomFields'): DayBackFilterItem[];
	get(key: string & {}): any;

	init(key: 'closePopovers', value: boolean): void;
	init(key: 'resources', value: DayBackFilterItem[]): void;
	init(key: 'bookmarkID', value: string): void;
	init(key: string & {}, value: any, preventBroadcast?: boolean): void;

	set(item: string, key: string, value: any): void;

	getPersistent(key: string): any;
	setPersistent(key: string, value: any): void;
}

// ---------------------------------------------------------------------------
// Calendar element (fullCalendar jQuery wrapper)
// ---------------------------------------------------------------------------

interface DayBackCalendarElement {
	fullCalendar(method: 'clientEvents'): DayBackEvent[];
	fullCalendar(
		method: 'clientEvents',
		filter: string | ((event: DayBackEvent) => boolean)
	): DayBackEvent[];
	fullCalendar(method: 'unscheduledClientEvents'): DayBackEvent[];
	fullCalendar(
		method: 'unscheduledClientEvents',
		filter: string | ((event: DayBackEvent) => boolean)
	): DayBackEvent[];
	fullCalendar(
		method: 'mapClientEvents',
		filter?: string | ((event: DayBackEvent) => boolean)
	): DayBackEvent[];
	fullCalendar(method: 'updateEvent', event: DayBackEvent): void;
	fullCalendar(method: 'rerenderEvents', eventId?: string): void;
	fullCalendar(method: 'rerenderUnscheduledEvents', eventId?: string): void;
	fullCalendar(
		method: 'removeEvents',
		filter?: string | number | ((event: DayBackEvent) => boolean)
	): void;
	fullCalendar(
		method: 'changeView',
		viewName: string,
		forceRedraw?: boolean
	): void;
	fullCalendar(method: 'gotoDate', date: DayBackMoment | string | Date): void;
	fullCalendar(method: 'refetchEvents', refresh?: boolean): void;
	fullCalendar(method: 'getDate'): DayBackMoment;
	fullCalendar(method: 'getView'): DayBackView;
	fullCalendar(method: 'prev', alt?: boolean): void;
	fullCalendar(method: 'next', alt?: boolean): void;
	fullCalendar(method: 'today', alt?: boolean): void;
	fullCalendar(
		method: 'select',
		start: DayBackMoment,
		end: DayBackMoment
	): void;
	fullCalendar(method: 'unselect'): void;
	fullCalendar(method: 'moment', ...args: any[]): DayBackMoment;
	fullCalendar(method: 'getContentWidth'): number;
	fullCalendar(method: 'getScrollPosition'): number;
	fullCalendar(method: 'setScrollPosition', top: number): void;
	fullCalendar(method: 'redraw', alt?: boolean): void;
	fullCalendar(method: 'getNow'): DayBackMoment;
	fullCalendar(method: 'getEventEnd', event: DayBackEvent): DayBackMoment;
	fullCalendar(
		method: 'formatDate',
		mom: DayBackMoment,
		formatStr: string
	): string;
	fullCalendar(
		method: 'formatRange',
		m1: DayBackMoment,
		m2: DayBackMoment,
		formatStr: string
	): string;
	fullCalendar(method: string & {}, ...args: any[]): any;
}

// ---------------------------------------------------------------------------
// utilities
// ---------------------------------------------------------------------------

/**
 * Helper utilities available in all DayBack action contexts.
 *
 * @example
 * // Show a confirmation modal
 * utilities.showModal(
 *   'Confirm Delete',
 *   'Are you sure you want to delete this event?',
 *   'Cancel', function () { action.callbacks.cancel(); },
 *   'Delete', function () { action.callbacks.confirm(); }
 * );
 *
 * @example
 * // Detect the platform
 * const platform = utilities.getDBKPlatform();
 * // Returns: 'dbksf' | 'dbkfmwd' | 'dbkfmjs' | 'dbko'
 *
 * @example
 * // Open a custom popover modal
 * const template = '<div class="p-3"><h4>Hello</h4><button ng-click="close()">Close</button></div>';
 * const pop = utilities.popover({ type: 'modal', width: 400 }, template);
 *
 * @example
 * // Observe a DOM node before interacting with it
 * utilities.observe({
 *   name: 'waitForPanel',
 *   watch: '.popover-content',
 *   until: '.detail-panel',
 *   then: function (observer) { observer.foundNode.style.display = 'none'; }
 * });
 */
interface DayBackUtilities {
	// ---------------------------------------------------------------------------
	// UI: Dialogs, Messages & Tooltips
	// ---------------------------------------------------------------------------

	/**
	 * Shows a modal dialog with up to three action buttons and optional HTML content.
	 * Pass `'hide'` as the title to close the currently open modal.
	 * @param warning - Adds red warning styling to the dialog
	 * @param htmlDescription - Renders `message` as HTML instead of plain text
	 * @example
	 * utilities.showModal(
	 *   'Confirm Delete',
	 *   'This cannot be undone.',
	 *   'Cancel', function () { action.callbacks.cancel(); },
	 *   'Delete', function () { deleteRecord(); action.callbacks.confirm(); },
	 *   null, null, true
	 * );
	 */
	showModal(
		title: string | 'hide',
		message?: string | null,
		cancelText?: string | null,
		cancelFn?: (() => void) | null,
		confirmText?: string | null,
		confirmFn?: (() => void) | null,
		secondaryButtonText?: string | null,
		secondaryFunction?: (() => void) | null,
		warning?: boolean,
		modalContainer?: HTMLElement | null,
		htmlDescription?: boolean
	): void;

	/**
	 * Shows a banner notification in the calendar UI.
	 * @param showDelay - Milliseconds before the message appears (0 = immediate)
	 * @param hideDelay - Milliseconds before auto-dismissing (0 = stays until dismissed)
	 * @param type - Visual style: null = default blue, 'success', 'warning', 'error'
	 * @example
	 * utilities.showMessage('Saved!', 0, 3000, 'success');
	 */
	showMessage(
		content: string,
		showDelay: number,
		hideDelay: number,
		type?: string | null,
		actionFn?: (() => void) | null,
		logError?: boolean
	): void;

	/** Dismisses all visible messages or modals. Pass `'modal'` to close only modal dialogs. */
	hideMessages(type?: 'message' | 'modal'): void;

	/**
	 * Shows a Bootstrap tooltip on a DOM element using positional parameters.
	 * @remarks For new code, prefer `dbk.tooltip(content, options)` which uses a cleaner options object.
	 * @param targetElement - The element to anchor the tooltip to
	 * @param content - HTML string for the tooltip body
	 * @param className - Optional extra CSS class applied to the tooltip container
	 * @param placement - 'top' | 'right' | 'bottom' | 'left' | 'auto'
	 * @param container - CSS selector for the tooltip's parent container (defaults to body)
	 * @param event - The triggering DOM event (or null)
	 * @param delay - Show delay in ms, or `{ show, hide }` object
	 * @param hideOnClick - Dismiss the tooltip when the user clicks anywhere
	 * @example
	 * utilities.tooltip(el, '<b>Required</b>', null, 'top', null, null, 250, true);
	 */
	tooltip(
		targetElement: HTMLElement,
		content: string,
		className?: string | null,
		placement?: string | null,
		container?: string | null,
		event?: any,
		delay?: number | {show: number; hide: number},
		hideOnClick?: boolean,
		options?: DayBackTooltipOptions
	): DayBackTooltipInstance;

	/**
	 * Opens an Angular-bound modal or popover with a custom HTML template.
	 * Equivalent to `dbk.popover()` — both call the same underlying implementation.
	 * @example
	 * utilities.popover(
	 *   { type: 'modal', show: true, destroy: true, onClose: function () { action.callbacks.confirm(); } },
	 *   '<div><button ng-click="popover.config.onClose()">Close</button></div>'
	 * );
	 */
	popover(
		config: DayBackPopoverConfig,
		template: string
	): {element: HTMLElement; destroy(): void};

	/**
	 * Watches for a DOM condition and calls `then` when it is met.
	 * Prefer this over `setTimeout` for waiting on calendar DOM elements.
	 * @example
	 * utilities.observe({
	 *   name: 'waitForPanel',
	 *   watch: '.popover-content',
	 *   until: '.detail-panel',
	 *   then: function (observer) { observer.foundNode.style.display = 'none'; }
	 * });
	 */
	observe(params: DayBackObserveConfig): DayBackObserverInstance;

	// ---------------------------------------------------------------------------
	// Calendar & Config Helpers
	// ---------------------------------------------------------------------------

	/**
	 * Returns a CSS text color (`'#ffffff'` or `'#000000'`) chosen for readability
	 * against the given background hex color.
	 * @example
	 * el.style.color = utilities.generateTextColor(event.color);
	 */
	generateTextColor(colorCode: string): string;

	/**
	 * Returns the active DayBack platform identifier.
	 * - `'dbksf'` — Salesforce
	 * - `'dbkfmwd'` / `'dbkfmjs'` — FileMaker WebDirect / Data API
	 * - `'dbko'` — Online (standalone)
	 */
	getDBKPlatform(): 'dbkfmwd' | 'dbkfmjs' | 'dbksf' | 'dbko';

	/** Returns true if the current DayBack platform is FileMaker-based. */
	isFMPlatform(currentPlatform?: string): boolean;

	/** Looks up the underlying source field ID for a DayBack custom field label. */
	getCustomFieldIdByName(
		fieldName: string,
		schedule: DayBackSchedule
	): string;

	/** Returns items from `matchItems` whose `property` value also appears in `listItems`. */
	objectArrayMatch(
		matchItems: any[],
		listItems: any[],
		property?: string,
		contains?: boolean
	): any[];

	/** Re-applies a config section to the live calendar. */
	updateConfig(settingKey: string): void;

	/**
	 * Rate-limited request queue. Instantiate with `new utilities.requestThrottle(n)` to allow `n`
	 * calls per second.
	 * @example
	 * const throttle = new utilities.requestThrottle(3);
	 * items.forEach(item => throttle.executeRequest(() => sf.update({ ... })));
	 */
	requestThrottle: new (requestsPerSecond: number) => {
		executeRequest(request: () => void): void;
	};

	// ---------------------------------------------------------------------------
	// Color Utilities
	// ---------------------------------------------------------------------------

	/** Converts a CSS `rgb(r, g, b)` string to a hex color string (`'#rrggbb'`). */
	rgbToHex(rgbString: string): string;

	/** Converts a hex color string to an `{ r, g, b }` object, or `null` for invalid input. */
	hexToRgb(hex: string): {r: number; g: number; b: number} | null;

	/**
	 * Blends a background color with white at the given opacity level (0–1).
	 * Use to compute tinted/transparent variants of event colors.
	 * @example
	 * el.style.backgroundColor = utilities.generateColorTransparency(event.color, 0.3);
	 */
	generateColorTransparency(backgroundColor: string, opacity: number): string;

	// ---------------------------------------------------------------------------
	// String Utilities
	// ---------------------------------------------------------------------------

	/**
	 * Splits a comma-separated string into a plain array, or an array of `{ name }` objects
	 * when `itemAsObject` is true.
	 * @example
	 * utilities.commaSeparatedToArray('Alice, Bob, Carol'); // ['Alice', 'Bob', 'Carol']
	 */
	commaSeparatedToArray(
		text: string,
		itemAsObject?: boolean,
		classPrefix?: string
	): any[];

	/** Converts HTML entities (`&amp;`, `&lt;`, etc.) back to plain characters. */
	decodeHtmlEntities(str: string): string;

	/** Escapes `<`, `>`, `"`, `'` characters to safe HTML entities. */
	htmlEscape(value: string, excludeAmpersand?: boolean): string;

	/** Strips special characters from a string, optionally keeping only alphanumeric characters. */
	filterSpecialChars(
		text: string,
		alphaNumericOnly?: boolean,
		convertToChar?: boolean
	): string;

	// ---------------------------------------------------------------------------
	// Array Utilities
	// ---------------------------------------------------------------------------

	/** Returns true if two arrays contain identical elements in the same order. */
	arraysEqual(arr1: any[], arr2: any[]): boolean;

	/** Merges two arrays, optionally filtering to items that have `requiredProperty` set. */
	mergeArrays(array1: any[], array2: any[], requiredProperty?: string): any[];

	/** Returns a deep copy of an array of plain objects. */
	cloneArrayObjects(arrayObjects: any[]): any[];

	/** De-duplicates an array of objects using `key` as the unique identifier. */
	removeObjectArrayDupes(
		arr: any[],
		key: string,
		preFilter?: boolean,
		sort?: boolean
	): any[];

	/** Converts an object's own enumerable properties into an array of their values. */
	objectToArray(obj: Record<string, any>): any[];

	/** Returns items in `array1` that are NOT present in `array2`. */
	arrayDiff(array1: any[], array2: any[]): any[];

	// ---------------------------------------------------------------------------
	// Date/Time Utilities
	// ---------------------------------------------------------------------------

	/** Converts a duration in milliseconds to a human-readable day string (e.g., `'2 days'`). */
	numberToDays(time: number): string;

	/**
	 * Counts working days between two Moment dates, skipping weekends.
	 * Pass `dayback: true` to use DayBack's configured work-week.
	 */
	workDays(
		dateStart: DayBackMoment,
		dateEnd: DayBackMoment,
		dayback?: boolean
	): number;

	/** Returns the full list of IANA timezone names DayBack knows about. */
	getTimezones(): any[];

	/** Returns the user's locale-specific time format string (e.g., `'h:mm A'` or `'HH:mm'`). */
	getLocalTimeFormat(): string;

	// ---------------------------------------------------------------------------
	// Number Formatting
	// ---------------------------------------------------------------------------

	/**
	 * Performs floating-point-safe arithmetic to avoid rounding errors.
	 * @param a - First operand.
	 * @param operator - Arithmetic operator: `'+'`, `'-'`, `'*'`, or `'/'`.
	 * @param b - Second operand.
	 * @example utilities.floatMath(0.1, '+', 0.2) === 0.3 // true
	 */
	floatMath(a: number, operator: '+' | '-' | '*' | '/', b: number): number;

	/**
	 * Formats a number for display with a given type/format string (currency, percentage, etc.).
	 * @remarks Rarely needed in custom actions — use JavaScript `Intl.NumberFormat` for simple cases.
	 */
	formatDisplayNumber(
		numberInput: number | string,
		type?: string,
		dataType?: string,
		format?: string,
		precision?: number,
		preventRounding?: boolean,
		noStyles?: boolean
	): string;

	// ---------------------------------------------------------------------------
	// Scroll Utilities
	// ---------------------------------------------------------------------------

	/**
	 * Smoothly scrolls an element to a target vertical pixel position.
	 * @param speed - Scroll duration in ms (default 2000)
	 * @param easing - Easing function name (default 'easeInOutSine')
	 */
	scrollToY(
		scrollElement: HTMLElement,
		scrollTargetY: number,
		speed?: number,
		easing?: string,
		callback?: () => void
	): void;

	/** Smoothly scrolls an element to a target horizontal pixel position. */
	scrollToX(
		scrollElement: HTMLElement,
		scrollTargetX: number,
		speed?: number,
		easing?: string,
		callback?: () => void
	): void;

	// ---------------------------------------------------------------------------
	// Layout Utilities
	// ---------------------------------------------------------------------------

	/** Returns the current browser viewport dimensions as `{ width, height }`. */
	getWindowDimensions(): {width: number; height: number};

	/** Forces the calendar to recalculate its layout. Pass `delay` in ms to debounce. */
	resizeCalendar(delay?: number): void;

	// ---------------------------------------------------------------------------
	// FileMaker — FileMaker platform only
	// ---------------------------------------------------------------------------

	/**
	 * @remarks FileMaker platform only.
	 * Executes a named FileMaker script with a parameter and optional callback.
	 */
	performFileMakerScript(
		script: string,
		parameter: any,
		callback?: (result: any) => void,
		directCall?: boolean
	): void;

	/**
	 * @remarks FileMaker platform only.
	 * Builds a `fmp://` URL for invoking a FileMaker script via URL protocol.
	 */
	scriptURL(script: string, queryID?: string): string;

	// ---------------------------------------------------------------------------
	// String & ID Helpers
	// ---------------------------------------------------------------------------

	/** Returns a random hex color string (e.g. `'#a3c2f0'`). */
	generateRandomColor(): string;

	/**
	 * Oxford-comma join of an array of strings.
	 * @example utilities.humanJoin(['a', 'b', 'c']) // 'a, b, and c'
	 */
	humanJoin(array: string[]): string;

	/**
	 * Returns a JavaScript-safe identifier string suitable for object keys.
	 * @param value - The input string to convert.
	 * @param alphaNumericOnly - When true, strips all non-alphanumeric characters.
	 */
	stringToID(value: string, alphaNumericOnly?: boolean): string;

	/**
	 * Returns a CSS-class-safe string from an arbitrary value.
	 * @param value - The input string to convert.
	 * @param prefix - Optional prefix prepended to the result.
	 */
	stringToClass(value: string, prefix?: string): string;

	/** Returns a timestamp-based unique ID string. Fast but not globally unique. */
	generateUID(): string;

	/**
	 * Counts the number of calendar days between two moment dates.
	 * @param start - Start moment.
	 * @param end - End moment.
	 */
	daySpan(start: DayBackMoment, end: DayBackMoment): number;

	// ---------------------------------------------------------------------------
	// File Loading
	// ---------------------------------------------------------------------------

	/**
	 * @remarks Rarely used in custom actions.
	 * Fetches a file asynchronously and delivers its content to a callback.
	 */
	getFile(
		file: string,
		callback: (data: any) => void,
		params?: any,
		callbackSet?: boolean
	): void;
}

// ---------------------------------------------------------------------------
// action
// ---------------------------------------------------------------------------

/** Callback functions available when 'Prevent Default Action' is enabled. */
interface DayBackActionCallbacks {
	/** Confirms the action and allows DayBack's default behavior to proceed. Must be called when `action.preventDefault` is true. */
	confirm(): void;
	/** Cancels the action and reverts any pending changes. Must be called when `action.preventDefault` is true. */
	cancel(): void;
	/** Registers a callback that fires when the event edit popover becomes visible. Receives `{ popover: HTMLElement }`. */
	createOnShownCallback(fn: (data: {popover: HTMLElement}) => void): void;
	/** Registers a callback that fires when the event edit popover is closed or hidden. */
	createOnHiddenCallback(fn: () => void): void;
	/** Registers a callback that fires when async action processing is complete. */
	createOnCompleteCallback(fn: () => void): void;
}

/**
 * Metadata about the currently running action. Available as the `action` global in all action types.
 * @example
 * // Check if prevent default is on, then confirm when done
 * if (action.preventDefault) {
 *   doAsyncWork().then(() => action.callbacks.confirm());
 * }
 */
interface DayBackAction {
	/**
	 * True when "Prevent Default Action" is enabled for this action type.
	 * When true, you MUST call `action.callbacks.confirm()` to proceed or `action.callbacks.cancel()` to abort.
	 */
	preventDefault: boolean;
	/** @deprecated Alias for `preventDefault`. Use `action.preventDefault` in new code. */
	preventAction: boolean;
	/** The display name of this action as configured in DayBack admin settings. */
	name: string;
	/** The action type key (e.g., 'beforeEventSave', 'afterCalendarRendered', 'onEventClick'). */
	type: string;
	/** Lifecycle category: 'event' for event actions, 'app' for app actions, 'button' for button actions. */
	category: 'event' | 'app' | 'button';
	callbacks: DayBackActionCallbacks;
	[key: string]: any;
}

// ---------------------------------------------------------------------------
// params
// ---------------------------------------------------------------------------

interface DayBackParams {
	data?: {
		fromFilterChange?: boolean;
		fromRefresh?: boolean;
		fromScheduleChange?: boolean;
		fromViewStateChange?: boolean;
		fromBookmark?: boolean;
		isLast?: boolean;
		item?: any;
		filterType?: 'statuses' | 'resources';
		field?: string;
		value?: any;
		selected?: boolean;
		objectName?: string;
		isDraftMode?: boolean;
		type?: 'enable' | 'discard' | 'publish' | 'save';
		draftId?: string;
		[key: string]: any;
	};
	[key: string]: any;
}

// ---------------------------------------------------------------------------
// environment
// ---------------------------------------------------------------------------

/** Runtime environment flags. Available as the `environment` global in all action contexts. */
interface DayBackEnvironment {
	/** True when running on a mobile device (phone or tablet). Use to adapt interaction patterns. */
	isMobileDevice: boolean;
	/** True specifically on a phone-class device. Use to switch between mobile and desktop UX. */
	isPhone: boolean;
}

// ---------------------------------------------------------------------------
// Platform: Salesforce — Sfdc (Canvas SDK)
// ---------------------------------------------------------------------------

interface SfdcCanvasClient {
	ajax(
		url: string,
		settings: {
			client: any;
			method?: string;
			contentType?: string;
			data?: string;
			success: (data: any) => void;
			params?: Record<string, string>;
		}
	): void;

	/**
	 * Subscribe to a named Canvas event. Used to receive messages from Aura/LWC components via the Canvas cross-domain messaging API.
	 * @param client - The signed-request client object from `fbk.client()`.
	 * @param subscription - Event name and data handler.
	 * @example
	 * Sfdc.canvas.client.subscribe(fbk.client(), {
	 *   name: 'dbk.postMessage',
	 *   onData: function (data) { console.log(data); }
	 * });
	 */
	subscribe(
		client: any,
		subscription: {name: string; onData: (data: any) => void}
	): void;

	/**
	 * Publish a named Canvas event. Used to send messages to Aura/LWC components via the Canvas cross-domain messaging API.
	 * @param client - The signed-request client object from `fbk.client()`.
	 * @param message - Event name and payload to send.
	 * @example
	 * Sfdc.canvas.client.publish(fbk.client(), {
	 *   name: 'dbk.editRecord',
	 *   payload: { recordId: editEvent.eventID }
	 * });
	 */
	publish(client: any, message: {name: string; payload?: any}): void;

	/**
	 * Unsubscribe from a previously subscribed Canvas event.
	 * @param client - The signed-request client object from `fbk.client()`.
	 * @param subscription - Event name to unsubscribe from.
	 */
	unsubscribe(client: any, subscription: {name: string}): void;
}

interface SfdcCanvas {
	client: SfdcCanvasClient;
}

interface SfdcGlobal {
	canvas: SfdcCanvas;
}

// ---------------------------------------------------------------------------
// Platform: Salesforce — SalesforceClient
// ---------------------------------------------------------------------------

interface SfResponse<T = any> {
	ok: boolean;
	status: number;
	data: T;
	raw: any;
	error?: {message: string; code?: string};
	method: string;
	url: string;
	source: string;
	meta?: any;
}

/**
 * A configured Salesforce REST API client returned by `new SalesforceClient(config)`.
 * Always check `resp.ok` before using `resp.data`. Use `showError` to surface failures.
 *
 * @example
 * const sf = new SalesforceClient({ errorMode: 'return' });
 * const resp = await sf.query({ soql: 'SELECT Id, Name FROM Contact LIMIT 10' });
 * if (!resp.ok) { return sf.showError(resp.error); }
 * const contacts = resp.data.records;
 */
interface SalesforceClientInstance {
	// ---------------------------------------------------------------------------
	// Query
	// ---------------------------------------------------------------------------

	/**
	 * Runs a SOQL query and returns the result set.
	 * Set `pageAll: true` to automatically follow `nextRecordsUrl` and return all pages.
	 * Use `sf.escapeSOQL()` / `sf.quote()` to safely interpolate user input into SOQL.
	 * @example
	 * const resp = await sf.query({ soql: `SELECT Id, Subject FROM Event WHERE OwnerId = ${sf.quote(userId)}` });
	 * if (!resp.ok) { return sf.showError(resp.error); }
	 * const events = resp.data.records;
	 */
	/**
	 * Accepts either a SOQL string directly or an options object with `soql` and optional `pageAll`.
	 * @example
	 * await sf.query('SELECT Id, Name FROM Contact LIMIT 10');
	 * await sf.query({ soql: 'SELECT Id FROM Contact', pageAll: true });
	 */
	query(
		params: string | {soql: string; pageAll?: boolean}
	): Promise<SfResponse>;

	/**
	 * Streams a large SOQL query row-by-row via `onRow`, optionally with throttling.
	 * Also usable as an async iterator: `for await (const row of sf.bulkQuery({ soql })) { ... }`
	 * Sub-methods: `sf.bulkQuery.pages({ soql })` iterates page arrays, `sf.bulkQuery.collect({ soql })` returns all rows.
	 * @remarks Use for result sets too large for a single `query` call. Less common in custom actions.
	 */
	bulkQuery: ((params: {
		soql: string;
		onRow?: (row: any) => void | Promise<void>;
		delayMs?: number;
		maxPages?: number;
	}) => Promise<SfResponse>) & {
		/** Async page iterator — yields arrays of records, one per SOQL page. */
		pages(params: {soql: string; delayMs?: number; maxPages?: number}): AsyncIterable<any[]>;
		/** Collects all rows into a single array. Convenience wrapper around bulkQuery. */
		collect(params: {soql: string; delayMs?: number; maxPages?: number}): Promise<any[]>;
	};

	/**
	 * Lists all sObjects in the org.
	 * @remarks Not available in all SalesforceClient versions. If absent, suggest upgrading from `lib/salesforce-client/`.
	 */
	objects?(): Promise<SfResponse>;

	/**
	 * Fetches a single record by ID with optional field list.
	 * @example
	 * const resp = await sf.retrieve({ objectName: 'Contact', id: contactId, fields: ['Name', 'Email'] });
	 */
	retrieve(params: {
		objectName: string;
		id: string;
		fields?: string[];
	}): Promise<SfResponse>;

	// ---------------------------------------------------------------------------
	// Mutations
	// ---------------------------------------------------------------------------

	/**
	 * Creates a new record and returns its new `Id` in `resp.data.id`.
	 * @example
	 * const resp = await sf.create({ objectName: 'Task', record: { Subject: 'Follow up', OwnerId: userId } });
	 * if (!resp.ok) { return sf.showError(resp.error); }
	 * const newId = resp.data.id;
	 */
	create(params: {
		objectName: string;
		record: Record<string, any>;
	}): Promise<SfResponse>;

	/**
	 * Updates an existing record by ID.
	 * @example
	 * const resp = await sf.update({ objectName: 'Event', id: eventId, record: { Description: 'Updated' } });
	 * if (!resp.ok) { return sf.showError(resp.error); }
	 */
	update(params: {
		objectName: string;
		id: string;
		record: Record<string, any>;
	}): Promise<SfResponse>;

	/**
	 * Upserts a record using an external ID field.
	 * Creates the record if no match is found; updates it if a match exists.
	 */
	upsert(params: {
		objectName: string;
		externalIdField: string;
		externalIdValue: string;
		record: Record<string, any>;
	}): Promise<SfResponse>;

	/**
	 * Deletes a record by ID.
	 * @example
	 * const resp = await sf.delete({ objectName: 'Task', id: taskId });
	 * if (!resp.ok) { return sf.showError(resp.error); }
	 */
	delete(params: {objectName: string; id: string}): Promise<SfResponse>;

	// ---------------------------------------------------------------------------
	// Batch & Composite Operations
	// ---------------------------------------------------------------------------

	/**
	 * Executes multiple Salesforce API requests in a single round-trip.
	 * Set `allOrNone: true` to roll back all changes if any sub-request fails.
	 * @remarks Use for moderate batch sizes. For very large batches prefer `compoundBatch`.
	 */
	batch(params: {
		requests: any[];
		allOrNone?: boolean;
		collateSubrequests?: boolean;
	}): Promise<SfResponse>;

	/**
	 * Breaks a large request array into chunks and executes each chunk in sequence.
	 * @remarks Specialized — use when a single `batch` call exceeds Salesforce's 25-request limit.
	 */
	compoundBatch(params: {
		requests: any[];
		allOrNone?: boolean;
		method?: string;
		batchSize?: number;
		envelopeSize?: number;
	}): Promise<SfResponse>;

	/**
	 * Creates a parent record and multiple related child records in one API call.
	 * @remarks Specialized — useful when creating sObjects with required parent-child relationships.
	 */
	createTree(params: {
		objectName: string;
		records: any[];
	}): Promise<SfResponse>;

	/**
	 * Calls a custom Apex REST endpoint.
	 * @remarks Specialized — use only when built-in CRUD methods are insufficient.
	 * @example
	 * const resp = await sf.apex({ method: 'POST', path: '/MyApexClass/', body: { key: 'value' } });
	 */
	apex(params: {
		method: string;
		path: string;
		body?: any;
	}): Promise<SfResponse>;

	// ---------------------------------------------------------------------------
	// Helpers
	// ---------------------------------------------------------------------------

	/**
	 * Escapes special characters in a string for safe use inside a SOQL `LIKE` clause.
	 * For equality clauses, use `quote()` instead.
	 * @example
	 * const soql = `SELECT Id FROM Account WHERE Name LIKE '%${sf.escapeSOQL(userInput)}%'`;
	 */
	escapeSOQL(str: string): string;

	/**
	 * Wraps a string in single quotes and escapes inner single quotes for safe SOQL injection.
	 * Always use this (or `escapeSOQL`) when interpolating user-controlled strings into SOQL.
	 * @example
	 * const soql = `SELECT Id FROM Contact WHERE Email = ${sf.quote(emailAddress)}`;
	 */
	quote(str: string): string;

	/**
	 * Displays a DayBack error message for a failed API response.
	 * Idiomatic pattern: `if (!resp.ok) { return sf.showError(resp.error); }`
	 * @example
	 * if (!resp.ok) { return sf.showError(resp.error); }
	 */
	showError(error: any): void;

	/**
	 * Converts a Moment date to the ISO 8601 format expected by Salesforce DateTime fields.
	 * @example
	 * const endTime = sf.formatDateTime(moment(end));
	 */
	formatDateTime(date: DayBackMoment): string;
}

/**
 * Constructs a `SalesforceClientInstance`. Assign to a local variable and share across an action.
 *
 * **Critical pattern**: always pass `errorMode: 'return'` so that API errors are returned in
 * `resp.error` rather than thrown as exceptions. Then check `resp.ok` before using `resp.data`.
 *
 * @example
 * const sf = new SalesforceClient({ errorMode: 'return' });
 * const resp = await sf.query({ soql: 'SELECT Id, Name FROM Account LIMIT 5' });
 * if (!resp.ok) { return sf.showError(resp.error); }
 * const accounts = resp.data.records;
 */
interface SalesforceClientConstructor {
	(config?: {
		mode?: 'auto' | 'canvas' | 'rest';
		sfApi?: any;
		errorMode?: 'return';
		auth?: any;
	}): SalesforceClientInstance;
}

// ---------------------------------------------------------------------------
// Platform: Salesforce — sfApi
// ---------------------------------------------------------------------------

interface SfApiSettings {
	restURL: string;
	token: string;
	custom_domain: string;
	apiVersion: string;
	config: {immediate: boolean};
}

/**
 * Low-level Salesforce REST API wrapper used internally by DayBack.
 * @remarks In custom actions, use `new SalesforceClient({ errorMode: 'return' })` instead.
 * `sfApi` is the underlying transport — direct calls are rarely needed.
 */
interface SfApi {
	/** Auth token and endpoint config, populated automatically by DayBack. */
	settings: SfApiSettings;
	/** Refreshes the OAuth token for the given user/source combination. */
	auth(userId?: string, sourceId?: string): void;
	/**
	 * Makes an authenticated REST request to Salesforce.
	 * @remarks Prefer `SalesforceClient` for new code — it handles auth, paging, and error normalization.
	 */
	ajaxRequest(params: {
		url: string;
		type: string;
		params?: Record<string, any>;
		data?: any;
		access_token: string;
		onSuccess: (data: any) => void;
		onError: (error: any) => void;
		preventErrorReporter?: boolean;
	}): void;

	// Schema introspection methods

	/**
	 * Lists all sObjects in the org.
	 * @param callback - Receives `{ sobjects: Array }` with object descriptors.
	 */
	objects(callback: (result: {sobjects: any[]}) => void): void;
	/**
	 * Full describe for one sObject: fields, recordTypeInfos, childRelationships.
	 * @param objectName - API name of the object (e.g. `'Account'`).
	 * @param callback - Receives the describe result, or `{ errorCode, message }` on error.
	 */
	objectInfo(objectName: string, callback: (result: any) => void): void;
	/**
	 * Field descriptors for an object, optionally filtered by field type.
	 * Results are cached in `settings.fields[objectName]`.
	 * @param objectName - API name of the object (e.g. `'Event'`).
	 * @param callback - Receives an array of field descriptor objects.
	 * @param typeArray - Optional array of field type strings to filter by (e.g. `['picklist', 'multipicklist']`).
	 */
	fields(
		objectName: string,
		callback: (fieldList: any[]) => void,
		typeArray?: string[]
	): void;
	/**
	 * Fetches picklist values for a field on a given object.
	 * @param objectName - API name of the object (e.g. `'Trip__c'`).
	 * @param fieldName - API name of the picklist field (e.g. `'Status__c'`).
	 * @param callback - Receives picklist data or `false` if not a picklist.
	 */
	picklist(
		objectName: string,
		fieldName: string,
		callback: (
			result:
				| {
						picklist: {
							label: string;
							value: string;
							active: boolean;
							defaultValue: boolean;
						}[];
						restricted: boolean;
				  }
				| false
		) => void
	): void;
	/**
	 * Queries RecordType records for an object.
	 * @param objectName - API name of the object.
	 * @param callback - Receives an array of `{ Id, DeveloperName }` records.
	 */
	recordTypes(
		objectName: string,
		callback: (records: {Id: string; DeveloperName: string}[]) => void
	): void;
	/**
	 * Synchronous check for object existence. Must pass the result from a prior `objects()` call.
	 * @param name - API name of the object to check.
	 * @param objectsResult - The result object from a prior `objects()` call.
	 */
	objectExists(name: string, objectsResult: {sobjects: any[]}): boolean;
}

// ---------------------------------------------------------------------------
// Platform: FileMaker — fbk
// ---------------------------------------------------------------------------

interface FbkContext {
	links: {
		queryUrl: string;
		sobjectUrl: string;
		restUrl: string;
	};
}

/** A single item returned from a FileMaker picklist value list. */
interface FbkPicklistItem {
	/** The stored value of the picklist option. */
	value: string;
	/** The display label of the picklist option (may match value). */
	label?: string;
}

/** The response object passed to the `fbk.picklist()` callback. */
interface FbkPicklistResult {
	/** Array of picklist items for the requested field. */
	picklist: FbkPicklistItem[];
}

/**
 * FileMaker bridge/context object available on the FileMaker platform.
 * Provides access to the Salesforce Canvas context links and a simple publish API.
 * @remarks FileMaker platform only.
 */
interface Fbk {
	/** Returns the raw FileMaker Data API client for low-level requests. */
	client(): any;
	/** Returns the current Canvas context, including REST and query endpoint URLs. */
	context(): FbkContext;
	/** Returns true when FileMaker is running inside a Salesforce Canvas session. */
	isSalesforce(): boolean;
	/** Broadcasts a named event with a data payload to listening FileMaker scripts. */
	publish(event: string, data: any): void;
	/**
	 * Fetches the picklist values for a field on a given FileMaker/Salesforce object.
	 * Commonly used in On Statuses Fetched and On Sources Fetched actions to dynamically
	 * populate DayBack filter items from a value list.
	 * @param objectName - API name of the object containing the picklist field (e.g. `'Trip__c'`).
	 * @param fieldName - API name of the picklist field (e.g. `'Status__c'`).
	 * @param callback - Called with the picklist data when ready.
	 * @example
	 * fbk.picklist('Trip__c', 'Status__c', function (data) {
	 *   data.picklist.forEach(function (item) {
	 *     statuses.push(dbk.mutateFilterField({ name: item.value }));
	 *   });
	 * });
	 */
	picklist(
		objectName: string,
		fieldName: string,
		callback: (data: FbkPicklistResult) => void
	): void;
	/**
	 * Lists all sObjects available in the org (Canvas/Salesforce schema introspection).
	 * @param callback - Receives `{ sobjects: Array }` with object descriptors.
	 */
	objects(callback: (result: {sobjects: any[]}) => void): void;
	/**
	 * Full describe for one sObject (Canvas/Salesforce schema introspection).
	 * @param objectName - API name of the object (e.g. `'Trip__c'`).
	 * @param callback - Receives the describe result, or `{ errorCode, message }` on error.
	 */
	objectInfo(objectName: string, callback: (result: any) => void): void;
}

// ---------------------------------------------------------------------------
// Platform: FileMaker — WebViewer JavaScript API
// ---------------------------------------------------------------------------

/**
 * The `FileMaker` object is injected by FileMaker Pro/Go into web viewers.
 * It provides direct script execution from JavaScript. DayBack wraps this
 * internally via `dbk.performFileMakerScript()` — prefer that API in action
 * code. The raw `FileMaker` global is used in specialized cases such as
 * auth-redirect web viewers that run outside the DayBack action context.
 * @remarks Only available inside a FileMaker Pro/Go web viewer (`dbkfmjs` platform).
 */
interface FileMakerWebViewer {
	/**
	 * Executes a named FileMaker script with an optional string parameter.
	 * @param script - The exact name of the FileMaker script to execute.
	 * @param parameter - Parameter string passed to the script. Objects must be JSON.stringify'd by the caller.
	 */
	PerformScript(script: string, parameter?: string): void;
	/**
	 * Executes a named FileMaker script with a processing option.
	 * @param script - The exact name of the FileMaker script to execute.
	 * @param parameter - Parameter string passed to the script.
	 * @param option - Processing option: 0 = continue, 1 = halt, 2 = exit, 3 = resume, 5 = pause.
	 */
	PerformScriptWithOption(
		script: string,
		parameter?: string,
		option?: number
	): void;
}

// ---------------------------------------------------------------------------
// Platform: Google Calendar — gBk
// ---------------------------------------------------------------------------

interface GBkSettings {
	token: string;
	calendarApi: string;
	timezone: {value: string};
	userinfo?: {email: string};
}

/**
 * Google Calendar API wrapper available in Google-sourced actions.
 * @remarks Google Calendar platform only. Injected by DayBack when a Google source is active.
 */
interface GBk {
	/** Auth token and calendar endpoint config, populated automatically by DayBack. */
	settings: GBkSettings;
	/** Returns the authenticated Google user's profile including email address. */
	getUserProfile(): {email: string};
	/**
	 * Checks or refreshes the current Google OAuth token.
	 * @param checkOnly - If true, only checks whether a valid token exists without refreshing
	 * @param callback - Called with `true` if the user is authenticated
	 * @example
	 * gBk.auth(null, null, true, null, null, null, function (authed) {
	 *   if (!authed) { return utilities.showMessage('Please sign in to Google.', 0, 5000); }
	 * });
	 */
	auth(
		_1: null,
		_2: null,
		checkOnly: boolean,
		_4: null,
		_5: null,
		_6: null,
		callback: (authed: boolean) => void
	): void;
	/** Makes an authenticated request to the Google Calendar REST API. */
	ajaxRequest(params: {
		url: string;
		type: string;
		params?: Record<string, any>;
		data?: any;
		retryCheck?: (result: any) => {reAuth?: boolean};
		onSuccess: (data: any) => void;
		onError: (error: any) => void;
	}): void;
	/**
	 * Fetches all Google Calendar calendars for the authenticated account.
	 * Handles pagination automatically via `nextPageToken`.
	 * @param callback - Receives the calendar list result.
	 * @param params - Optional sync-token or page-token parameters.
	 * @param retryCount - Optional retry count for transient failures.
	 */
	calendarList(
		callback: (result: {
			items: Array<{id: string; summary: string; [key: string]: any}>;
			nextSyncToken?: string;
		}) => void,
		params?: Record<string, any>,
		retryCount?: number
	): void;
	/** Deletes a Google Calendar event by calendar and event ID. */
	deleteEvent(
		calendarId: string,
		eventId: string,
		callback: (result: any) => void
	): void;
	/** Moves a Google Calendar event from one calendar to another. */
	changeCalendar(
		eventId: string,
		fromCalId: string,
		toCalId: string,
		fieldMap: any,
		callback: (result: any) => void
	): void;
}

// ---------------------------------------------------------------------------
// Platform: Microsoft 365 — officeBk
// ---------------------------------------------------------------------------

interface OfficeBkStorage {
	token: string;
}

/**
 * Microsoft 365 / Outlook Calendar API wrapper available in Microsoft-sourced actions.
 * @remarks Microsoft 365 platform only. Injected by DayBack when a Microsoft source is active.
 */
interface OfficeBk {
	/** The current Microsoft OAuth token, used for authenticated requests. */
	storage: OfficeBkStorage;
	/** Makes an authenticated request to the Microsoft Graph Calendar API. */
	ajaxRequest(params: {
		url: string;
		type: string;
		params?: Record<string, any>;
		data?: any;
		retryCheck?: (result: any) => {
			reAuth?: boolean;
			preventDeauth?: boolean;
			code?: string;
			message?: string;
		};
		onSuccess: (data: any) => void;
		onError: (error: string) => void;
	}): void;
	/**
	 * Triggers or checks Microsoft OAuth authentication.
	 * @example
	 * officeBk.auth({ statusOnly: true, callback: function (authed) { if (authed) { /* proceed */ } } });
	 */
	auth(options: {
		userID?: string;
		sourceID?: string;
		statusOnly?: boolean;
		forceConsent?: boolean;
		redirectAuth?: boolean;
		redirectAuthFunction?: Function;
		preventUserList?: boolean;
		callback?: (authed: boolean) => void;
		includeGroupCalendars?: boolean;
	}): void;
	/**
	 * Fetches all Microsoft 365 calendars for the authenticated user, including group calendars.
	 * Group calendar items have an `isGroup: true` flag.
	 */
	calendarList(callback: (calendars: Array<{id: string; name: string; isGroup?: boolean; [key: string]: any}>) => void): void;
	/**
	 * Fetches all Microsoft 365 users. Used internally for resource loading.
	 * Available when `preventUserList` is not set.
	 */
	getUsers(callback: (users: Array<{displayName: string; mail: string; [key: string]: any}>) => void): void;
	/**
	 * Returns the authenticated user's Microsoft 365 profile.
	 * @example const profile = officeBk.getUserProfile(); // profile.displayName, profile.mail
	 */
	getUserProfile(): {displayName: string; mail: string; memberOf?: any[]};
	/** Opens the current event in the Office 365 web interface. */
	viewInOffice(): void;
}

// ---------------------------------------------------------------------------
// Platform: FileMaker XML — fmxj (legacy)
// ---------------------------------------------------------------------------

interface Fmxj {
	findRecordsURL(...args: any[]): string;
	editRecordURL(...args: any[]): string;
	postQueryFMS(
		query: string,
		callback: (data: any) => void,
		errorFn: (error: any) => void,
		phpRelayUrl?: string
	): void;
	[key: string]: any;
}

// ---------------------------------------------------------------------------
// Global declarations
// ---------------------------------------------------------------------------

// DayBack core globals
declare var dbk: DBK;
declare var seedcodeCalendar: SeedcodeCalendar;
declare var utilities: DayBackUtilities;
declare var action: DayBackAction;
/**
 * Moment.js date/time library. Available in all action contexts.
 * @example
 * const start = moment(event.start).tz('America/New_York');
 * const nextWeek = moment().add(7, 'days');
 */
/** Global moment.js factory — creates, parses, and manipulates date/time values. */
declare var moment: MomentStatic;
/**
 * moment-timezone library. Prefer using `moment.tz()` for most timezone operations.
 * @example
 * const zones = momentTimezone.tz.names(); // All IANA timezone names
 */
declare var momentTimezone: any;
/**
 * @deprecated Legacy global alias. Use `dbk.showMessage()` and `dbk.tooltip()` instead.
 * Typed for IntelliSense in older files that still reference `helpers.*`.
 */
declare var helpers: {
	/** @deprecated Use `dbk.showMessage()` instead. */
	showMessage(
		content: string,
		showDelay: number,
		hideDelay: number,
		type?: string | null,
		actionFn?: (() => void) | null
	): void;
	/** @deprecated Use `dbk.tooltip()` instead. */
	tooltip(
		content: string,
		options?: DayBackTooltipOptions
	): DayBackTooltipInstance;
	[key: string]: any;
};
/** Query parameters from the current URL or bookmark. */
declare var params: DayBackParams;
declare var environment: DayBackEnvironment;

/**
 * Environment configuration object containing API keys, secrets, and org-specific constants.
 * Defined by the customer in their DayBack environment configuration — not in action file code.
 * Property names use `UPPER_SNAKE_CASE` by convention.
 * @example const apiKey = dbkEnv.GOOGLE_MAPS_KEY;
 */
declare var dbkEnv: Record<string, string>;

// DayBack event globals — available in event actions only
/**
 * The server-saved state of the event. Read-only mirror of what is stored in the data source.
 * Compare against `editEvent` to detect unsaved changes.
 * @remarks Available in event actions only (`beforeEventSave`, `onEventClick`, etc.).
 */
declare var event: DayBackEvent;
/**
 * The live in-progress state of the event being edited. Modify this object to change
 * field values before they are saved. Changes are reflected in the edit popover UI.
 * @remarks Available in event actions only. Call `dbk.refreshEditPopover(editEvent)` after
 * programmatic changes to update the popover display.
 */
declare var editEvent: DayBackEvent;
/**
 * Object containing only the fields that changed since the event was last saved.
 * Useful in `beforeEventSave` actions to inspect which fields were modified.
 */
declare var changesObject: Record<string, any>;
/**
 * A snapshot of the original field values before any unsaved edits, keyed the same way as `event`.
 * Pass to `dbk.updateEvent` as the `revertFunc` parameter to undo changes on failure.
 */
declare var revertObject: DayBackEvent;

// DayBack event globals — secondary
/** The raw browser MouseEvent that triggered the action, when applicable. */
declare var jsEvent: MouseEvent;

// Platform-specific globals (only present when the matching source type is active)
/** Salesforce Canvas SDK. Available on Salesforce platform only. */
declare var Sfdc: SfdcGlobal;
/** Constructs a new Salesforce REST API client. Available on Salesforce platform only. */
declare var SalesforceClient: SalesforceClientConstructor;
/** Low-level Salesforce API transport. Prefer `new SalesforceClient({ errorMode: 'return' })`. */
declare var sfApi: SfApi;
/** FileMaker bridge/context object. Available on FileMaker platform only. */
declare var fbk: Fbk;
/** FileMaker WebViewer JavaScript API. Available inside FileMaker Pro/Go web viewers only (`dbkfmjs`). */
declare var FileMaker: FileMakerWebViewer;
/** Google Calendar API wrapper. Available when a Google Calendar source is active. */
declare var gBk: GBk;
/** Microsoft 365 / Outlook Calendar API wrapper. Available when a Microsoft 365 source is active. */
declare var officeBk: OfficeBk;
/** FileMaker XML API (legacy). Use FileMaker Data API sources instead for new implementations. */
declare var fmxj: Fmxj;
/** Google Maps/Places API namespace, present when a map view is active. */
declare var google: any;

// Recurrence
/** rrule.js library for parsing and generating RFC 5545 recurrence rules. */
declare var rrule: any;
