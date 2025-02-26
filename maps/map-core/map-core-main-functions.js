// DayBack Custom Action Template v1.0.5

// Purpose: Registers all of the functionality needed for calculating distances and routing
// Action Type: On Sources Fetched
// Prevent Default Action: No
// Version: v1.1.0

// More info on custom App Actions here:
// https://docs.dayback.com/article/140-custom-app-actions

// @ts-check - Type checking with JSDoc (Remove this line to disable)

(() => {
	// Declare global imports
	// prettier-ignore
	// @ts-ignore prettier-ignore
	const globals = {action, dbk, seedcodeCalendar, $rootScope, utilities, moment};

	const options = {};
	const inputs = {};

	// Map options
	options.travelMode = 'drive'; // Mode of travel for distance and route calculations: 'drive', 'bicycle', 'walk', 'transit'
	options.distanceUnit = 'miles'; // How to display the distance: 'miles', 'feet', 'kilometers', 'meters'
	options.realtimeTraffic = true; // API calls are twice as much with this enabled, but without traffic will not be considered in drive times or routes
	options.roundDistanceValues = false; // Will round distance and duration values to whole numbers if true
	options.vehicleStopover = true; // Specifies whether the vehicle will need to stop at each route destination. For example a route could put you over a bridge rather than under if stopover is false

	inputs.resourceDistanceContainerClass = 'dbk-resource-distance-container';
	inputs.resourceDistanceContentClass = 'dbk-resource-distance-content';
	inputs.resourceDistanceValueClass = 'dbk-distance-value';

	// Maps API info
	// https://developers.google.com/maps/documentation/javascript/get-api-key
	inputs.mapApiKey = ''; // Will get this from DayBack admin settings by default leave blank if set there

	try {
		//----------- Configuration -------------------

		// Options specified for this action

		/**
		 * Seconds to wait to allow this action to run before reporting an error (set to 0 to deactivate)
		 * @type {number}
		 */
		options.runTimeout = 8;

		/**
		 * Array of account emails for whom this action will run. Leave blank to allow the action to run for everyone.
		 * Example: ['person@domain.com', 'someone@domain.com']
		 * @type {Array<string>}
		 */
		options.restrictedToAccounts = [];

		// Any input data for the action should be specified here

		/**
		 * The currently signed in account email
		 * @type {string}
		 */
		inputs.account = globals.seedcodeCalendar.get('config').account;

		//----------- End Configuration -------------------
	} catch (error) {
		reportError(error);
	}

	//----------- The action itself: you may not need to edit this. -------------------

	// Action code goes inside this function
	function run() {
		/** @typedef {{toDate: Function}} Moment */
		/** @typedef {{lat: string, lng: string}} Geocode */
		/** @typedef {{distance: number, duration: number}} Distance */
		/** @typedef {{status: string, distance: {value: number, label: string}, duration: {value: number, label: string}, duration_in_traffic: {value: number, label: string}}} GoogleDistanceResult*/
		/** @typedef {{id: string, status: string, distance: number, duration: number, durationInTraffic?: number}} ResourceDistance */
		/** @typedef {{_id: string, title: string, titleEdit: string, start: Object, end: Object, resource: Array<string>, allDay?: boolean, location?: string, geocode?: Geocode}} Event */
		/** @typedef {{distance: number, event: Event}} EventDistance */

		const distanceTypes = {
			miles: {
				conversionFactor: 0.00062137, // Converts from meters
				label: 'mi',
				apiUnit: 'IMPERIAL',
			},
			feet: {
				conversionFactor: 3.28084, // Converts from meters
				label: 'ft',
				apiUnit: 'IMPERIAL',
			},
			kilometers: {
				conversionFactor: 0.001, // Converts from meters
				label: 'km',
				apiUnit: 'METRIC',
			},
			meters: {
				conversionFactor: 1, // Converts from meters
				label: 'm',
				apiUnit: 'METRIC',
			},
		};

		const globalPrefix = 'dbk_maps_';

		// Global exports
		// Global
		// @ts-ignore
		globalThis[`${globalPrefix}hideDistances`] = hideDistances;
		// @ts-ignore
		globalThis[`${globalPrefix}routeButtonClick`] = routeButtonClick;

		// Shared
		globals.seedcodeCalendar.init(
			`${globalPrefix}surroundingEventDriveTimes`,
			surroundingEventDriveTimes,
			true
		);
		globals.seedcodeCalendar.init(
			`${globalPrefix}assignRouteColorToResource`,
			assignRouteColorToResource,
			true
		);
		globals.seedcodeCalendar.init(
			`${globalPrefix}createResourceDistanceContainer`,
			createResourceDistanceContainer,
			true
		);
		globals.seedcodeCalendar.init(
			`${globalPrefix}getResourceDistances`,
			getResourceDistances,
			true
		);
		globals.seedcodeCalendar.init(
			`${globalPrefix}renderResourceDistances`,
			renderResourceDistances,
			true
		);
		globals.seedcodeCalendar.init(
			`${globalPrefix}geocodeLocation`,
			geocodeLocation,
			true
		);
		globals.seedcodeCalendar.init(
			`${globalPrefix}reRouteResource`,
			reRouteResource,
			true
		);
		globals.seedcodeCalendar.init(
			`${globalPrefix}resetAll`,
			resetAll,
			true
		);
		globals.seedcodeCalendar.init(
			`${globalPrefix}scheduleRunner`,
			scheduleRunner,
			true
		);

		let mapApiKey = '';
		let advancedMarkerElement;
		let pinElement;
		/** @type {{getDistanceMatrix: Function}} */
		let DistanceMatrixService;
		/** @type {{encoding: {decodePath: Function}}} */
		let geometry;

		let routes = {};
		let dynamicMarkers = [];
		let wasDestroyed = false;

		initialize();

		/** @type {() => Promise<void>} */
		async function initialize() {
			const config = globals.seedcodeCalendar.get('config');
			// Set api key
			mapApiKey = inputs.mapApiKey || config.mapApiKey;
			// Load google map api
			globals.google = globals.dbk.mapManager.initialize({
				apiKey: mapApiKey,
			});
			globals.dbk.mapManager.set('options', {
				afterUpdate: function () {
					executeRunner('afterUpdate');
				},
				onDestroy: function () {
					if (!Object.keys(routes).length) {
						return;
					}
					wasDestroyed = true;
					scheduleRunner('afterUpdate', () => {
						const altView =
							globals.seedcodeCalendar.get('alt-view');

						if (altView.type === 'map' && wasDestroyed) {
							reRouteResource();
						}
						wasDestroyed = false;
					});
				},
			});
			// Load specific libraries from google maps
			const {Map} = await globals.google.maps.importLibrary('maps');
			// Marker libraries
			const {AdvancedMarkerElement, PinElement} =
				await globals.google.maps.importLibrary('marker');
			advancedMarkerElement = AdvancedMarkerElement;
			pinElement = PinElement;
			// Geometry library utlities
			geometry = await globals.google.maps.importLibrary('geometry');
			//initialize Distance Service
			if (!DistanceMatrixService) {
				DistanceMatrixService =
					new globals.google.maps.DistanceMatrixService();
			}
		}

		/** @type {(resourceId?: string) => void} */
		function resetAll(resourceId) {
			resetResourceDistanceContainers(resourceId);
			resetRoute(resourceId);
		}

		// =============================== Distances ===============================

		/** @type {(origin: string, travelStart: Moment) => Promise<unknown[]>} */
		async function getResourceDistances(origin, travelStart) {
			if (!origin) {
				throw new Error('Missing required data. Origin is missing.');
			}

			const departureTime = globals.moment.isMoment(travelStart)
				? travelStart.toDate()
				: new Date();

			const originArray = [];
			const destinationArray = [];
			const resourcesCalculated = [];
			let distancesResult = [];

			const resources = globals.dbk.resourceManager.getViewed();
			originArray.push(origin);
			for (const resource of resources) {
				const destination = resource.location;
				if (destination) {
					resourcesCalculated.push({
						id: resource.id,
						distance: 0,
						duration: 0,
						durationInTraffic: 0,
						status: '',
					});
					// originArray.push(origin);
					destinationArray.push(destination);
				}
			}

			if (!resourcesCalculated.length) {
				throw new Error('No resources have valid location data');
			}

			try {
				distancesResult = await calculateDistances(
					originArray,
					destinationArray,
					departureTime
				);
			} catch (err) {
				throw err;
			}

			for (let i = 0; i < resourcesCalculated.length; i++) {
				const dataElement = distancesResult[i];
				resourcesCalculated[i].status = dataElement.status;
				if (dataElement.status === 'OK') {
					resourcesCalculated[i].distance +=
						dataElement.distance.value;
					resourcesCalculated[i].duration +=
						dataElement.duration.value;
					if (dataElement.duration_in_traffic) {
						resourcesCalculated[i].durationInTraffic +=
							dataElement.duration_in_traffic.value;
					}
				}
			}

			return resourcesCalculated;
		}

		/** @type {(origin: Array<Geocode | string>, destinations: Array<Geocode | string>, departureTime?: Date) => Promise<GoogleDistanceResult[]>} */
		function calculateDistances(origins, destinations, departureTime) {
			return new Promise((resolve, reject) => {
				const maxDestinations = 25;
				const originsRequest = [];
				/** @type {string | Object[][]} */
				const destinationPages = [];
				const requestPromises = [];

				if (origins.length > 1) {
					reject(
						'Distance calculations currently only support a single origin'
					);
					return;
				}

				for (const origin of origins) {
					try {
						originsRequest.push(locationToDistanceLocation(origin));
					} catch (err) {
						reject(
							'There was a problem processing the distance for an origin location'
						);
						return;
					}
				}

				let pageCount;

				for (let i = 0; i < destinations.length; i++) {
					if (i % maxDestinations === 0) {
						if (pageCount === undefined) {
							pageCount = 0;
						} else {
							pageCount++;
						}
						destinationPages[pageCount] = [];
					}
					try {
						destinationPages[pageCount || 0].push(
							locationToDistanceLocation(destinations[i])
						);
					} catch (err) {
						reject(
							'There was a problem processing the distance for a destination location'
						);
						return;
					}
				}
				const travelMode = getTravelMode(options.travelMode, true);
				const travelOptions = {};

				if (
					options.realtimeTraffic &&
					travelMode === 'DRIVING' &&
					departureTime &&
					departureTime > new Date()
				) {
					travelOptions.departureTime = departureTime;
					travelOptions.trafficModel = 'bestguess';
				}

				for (const destinationPage of destinationPages) {
					/** @type {{origins: string | Object[], destinations: Object[], travelMode: string, unitSystem: string, drivingOptions?: {departureTime: Date, trafficModel: string}}} */
					const requestOptions = {
						origins: originsRequest,
						destinations: destinationPage,
						travelMode: travelMode,
						unitSystem:
							globals.google.maps.UnitSystem[
								(
									distanceTypes[options.distanceUnit]
										.apiUnit || 'imperial'
								).toUpperCase()
							],
					};

					if (Object.keys(travelOptions).length) {
						requestOptions.drivingOptions = travelOptions;
					}

					requestPromises.push(
						new Promise((resolve, reject) => {
							DistanceMatrixService.getDistanceMatrix(
								requestOptions,
								(response, status) => {
									if (status === 'OK') {
										resolve(response.rows[0].elements);
									} else {
										reject(
											`Failed to get directions: ${status}`
										);
									}
								}
							);
						})
					);
				}

				Promise.all(requestPromises)
					.then((/** @type {GoogleDistanceResult[][]} */ result) => {
						resolve(result.flat());
					})
					.catch((err) => {
						reject(err);
					});
			});
		}

		/** @type {(distancePayload: Array<ResourceDistance>) => void} */
		function renderResourceDistances(distancePayload) {
			// Make sure to reset current state
			resetAll();

			/** @type {NodeListOf<HTMLElement>} */
			const resourceDistanceContainers = document.querySelectorAll(
				`.${inputs.resourceDistanceContainerClass}`
			);

			for (const distanceContainer of resourceDistanceContainers) {
				const resourceId = distanceContainer.getAttribute('resource');
				const matchingResourceDistance = distancePayload.find(
					(item) => {
						return item.id === resourceId;
					}
				);

				setDistance(
					matchingResourceDistance?.distance || 0,
					distanceContainer
				);
			}
		}

		/** @type {(distance: number, containerElement: HTMLElement | null, resourceId?: string) => void} */
		function setDistance(distance, containerElement, resourceId) {
			if (!containerElement) {
				return;
			}

			const distanceConverstionFactor =
				distanceTypes[options.distanceUnit].conversionFactor;
			const distanceLabel = distanceTypes[options.distanceUnit].label;
			const roundFactor = options.roundDistanceValues ? 1 : 100;
			const distanceValue = distance
				? `${Math.round(distance * distanceConverstionFactor * roundFactor) / roundFactor} ${distanceLabel}`
				: 'not found';
			const distanceElement =
				containerElement.querySelector(
					`.${inputs.resourceDistanceValueClass}`
				) || document.createElement('div');
			distanceElement.className = inputs.resourceDistanceValueClass;
			distanceElement.innerHTML = distanceValue;
			const closeButton = document.createElement('button');
			closeButton.appendChild(createCloseButtonIcon());
			closeButton.setAttribute(
				'onclick',
				`${globalPrefix}hideDistances(event, "${resourceId}")`
			);
			const contentElement = document.createElement('div');
			contentElement.classList.add(inputs.resourceDistanceContentClass);
			contentElement.appendChild(distanceElement);
			contentElement.appendChild(closeButton);
			containerElement.appendChild(contentElement);
			const originalWidth = containerElement.offsetWidth;
			containerElement.style.width = 'auto';
			const newWidth = containerElement.offsetWidth;
			containerElement.style.width = `${originalWidth}px`;

			setTimeout(() => {
				containerElement.classList.add('dbk-has-content');
				distanceElement.classList.add('dbk-show-value');
				containerElement.style.width = `${newWidth}px`;
			}, 0);
		}

		/** @type {(location: Geocode | string) => string | Object} */
		function locationToDistanceLocation(location) {
			try {
				return typeof location === 'string'
					? location
					: geocodeToGoogle(location);
			} catch (err) {
				throw err;
			}
		}

		// =============================== Routing ===============================

		/** @type {(resourceId: string, ev: MouseEvent) => Promise<void>} */
		async function routeButtonClick(resourceId, ev) {
			showRouteForResource(resourceId, !!ev?.shiftKey);
		}

		/** @type {(resourceId: string, compareRoute?: boolean) => Promise<void>} */
		async function showRouteForResource(resourceId, compareRoute) {
			wasDestroyed = false; // wasDestroyed tracks if the map was previously destroyed so we know to rerender. If show routes is explicitely selected we don't need to rerender
			// Start by focusing the map tab and error if it isn't enabled
			try {
				await focusMapTab();
			} catch (err) {
				resetAll();
				globals.utilities.showModal(
					'Map Not Available',
					err?.message ? err.message : err,
					null,
					null,
					'OK',
					null,
					null,
					null,
					true,
					null,
					true
				);
				return;
			}

			if (!compareRoute) {
				// Make sure to reset current state
				resetAll();
			} else if (routes[resourceId]) {
				resetAll(resourceId);
			}

			// Initialize route for this resource
			routes[resourceId] = {
				eventMarkersChanged: [],
				waypoints: [],
				segments: [],
				homePosition: {},
				dynamicMarkers: [],
			};

			const resources = globals.seedcodeCalendar.get('resources');
			const targetResource = resources.find(
				/** @type {(resource: Object) => boolean} */ (resource) => {
					return resource.id === resourceId;
				}
			);

			const routeColor = targetResource.routeColor;
			const borderColor = globals.utilities.generateTextColor(routeColor);

			if (!targetResource?.location) {
				globals.utilities.showModal(
					'Missing Location',
					'This resource does not contain a valid location so it cannot be routed.',
					null,
					null,
					'OK'
				);
				return;
			}
			const events = [];
			const noGeoCode = [];

			const multiSelect = globals.seedcodeCalendar.get('multiSelect');
			const hasMultiSelect =
				multiSelect && typeof multiSelect === 'object';
			const clientEvents = globals.seedcodeCalendar
				.get('element')
				.fullCalendar('clientEvents');
			const eventsToRoute = hasMultiSelect
				? clientEvents.filter((event) => {
						return !!multiSelect[
							`${event.eventID}-${event.schedule.id}`
						];
					})
				: clientEvents;

			for (const event of eventsToRoute) {
				if (
					(!event.resource.includes(targetResource.name) &&
						!hasMultiSelect) ||
					!globals.dbk.isEventShown(event)
				) {
					continue;
				}
				if (event.geocode) {
					events.push(event);
				} else if (event.location) {
					noGeoCode.push(event);
				}
			}
			events.sort(sortRoutedEvents);

			let waypoints = [];
			let count = 0;
			for (const event of events) {
				count++;

				// Backup event marker info
				routes[resourceId].eventMarkersChanged.push(
					createEventMarkerBackup(event)
				);

				// Set new temporary marker options
				if (!event.map.markerOptions) {
					event.map.markerOptions = {};
				}

				const pinColor = new pinElement({
					background: routeColor,
					borderColor: borderColor,
					glyphColor: borderColor,
					glyph: count.toString(),
				});

				// Assign properties to new marker
				pinColor.element.classList.add('dbk-map-marker');
				pinColor.element.dataset.id = event._id;

				event.map.markerOptions.content = pinColor.element;
				event.map.markerOptions.zIndex = 9999;
				event.map.marker.content = pinColor.element;
				event.map.marker.zIndex = 9999;

				// Update marker for route
				waypoints.push(dbkGeocodeToGoogleGeocode(event.geocode));
			}
			const origin = {
				address: targetResource.location,
			};
			const destination = origin;

			waypoints.unshift(origin);
			waypoints.push(destination);

			try {
				const routeResults = await generateRoute(
					resourceId,
					waypoints,
					routeColor
				);
				// Add distance to button
				/** @type {HTMLElement | null} */
				const resourceDistanceContainer = document.querySelector(
					`.${inputs.resourceDistanceContainerClass}[resource="${resourceId}"]`
				);

				if (resourceDistanceContainer) {
					resourceDistanceContainer.style.backgroundColor =
						routeColor;
				}

				let distanceMeters = 0;
				for (const routeResult of routeResults) {
					distanceMeters += Number(
						routeResult.routes[0].distanceMeters
					);
				}
				setDistance(
					distanceMeters,
					resourceDistanceContainer,
					resourceId
				);
				if (!events.length) {
					globals.utilities.showModal(
						'Routing Failed',
						'There are no events available to route',
						null,
						null,
						'OK'
					);
					return;
				} else if (noGeoCode.length) {
					globals.utilities.showModal(
						'Missing Geocode',
						'Some selected events have not yet been geocoded and can’t be mapped',
						null,
						null,
						'OK'
					);
				}

				// Add home marker
				const homePosition = routes[resourceId].segments[0]
					.getPath()
					.getAt(0);
				routes[resourceId].dynamicMarkers.push(
					createHomeMarker(
						homePosition,
						`Start: ${targetResource.location}`,
						routeColor,
						borderColor
					)
				);

				routes[resourceId].waypoints = waypoints;
				routes[resourceId].homePosition = homePosition;

				// Adust map zoom to fit all markers for route
				const map = globals.dbk.mapManager.get('map');
				const bounds = new globals.google.maps.LatLngBounds();

				for (const property in routes) {
					for (const waypoint of routes[property].waypoints) {
						if (waypoint.location) {
							bounds.extend({
								lat: waypoint.location.latLng.latitude,
								lng: waypoint.location.latLng.longitude,
							});
						}
					}
					bounds.extend(routes[property].homePosition);
				}
				map.fitBounds(bounds);
			} catch (err) {
				resetAll();
				globals.utilities.showModal(
					'Failed to Create Route',
					err?.message ? err.message : err,
					null,
					null,
					'OK',
					null,
					null,
					null,
					true,
					null,
					true
				);
			}
		}

		/** @type {(resourceId: string, waypoints: Array, color: string) => Promise<Array>} */
		function generateRoute(resourceId, waypoints, color) {
			return new Promise((resolve, reject) => {
				const requestPromises = [];
				const maxWaypoints = 24; // Subtract one from max allowed so we can prepend the previous destination as new origin on paging
				const waypointCount = waypoints.length;

				let page = 0;
				if (waypointCount > maxWaypoints) {
					while (page * maxWaypoints <= waypointCount) {
						const firstIndex = page * maxWaypoints;
						const lastIndex = Math.min(
							firstIndex + maxWaypoints,
							waypointCount
						);
						const pagedWaypoints = waypoints.slice(
							page === 0 ? firstIndex : firstIndex - 1, // Subtract one because when paging the first location of the next page of routes needs to be the last location from the last page
							lastIndex
						);

						requestPromises.push(fetchRoute(pagedWaypoints));
						page++;
					}
				} else {
					requestPromises.push(fetchRoute(waypoints));
				}

				Promise.all(requestPromises)
					.then((result) => {
						const dataArray = result.flat();
						routes[resourceId].segments = [];
						for (const data of dataArray) {
							const polyline =
								data.routes?.[0]?.polyline?.encodedPolyline;
							if (polyline) {
								routes[resourceId].segments.push(
									drawRouteSegment(polyline, color)
								);
							} else {
								reject(
									new Error(
										'Could not route to all destinations. At least one route segment is invalid.'
									)
								);
							}
						}
						resolve(dataArray);
					})
					.catch((err) => {
						reject(err);
					});
			});
		}

		async function fetchRoute(waypoints) {
			const apiUrl =
				'https://routes.googleapis.com/directions/v2:computeRoutes/';
			const origin = waypoints.shift();
			const destination = waypoints.pop();
			const payload = {
				origin: origin,
				destination: destination,
				intermediates: waypoints,
				travelMode: getTravelMode(options.travelMode, false),
				routingPreference: options.realtimeTraffic
					? 'TRAFFIC_AWARE_OPTIMAL'
					: 'TRAFFIC_UNAWARE',
				computeAlternativeRoutes: false,
				routeModifiers: {
					avoidTolls: false,
					avoidHighways: false,
					avoidFerries: false,
				},
				languageCode: 'en-US',
				units: (
					distanceTypes[options.distanceUnit].apiUnit || 'imperial'
				).toUpperCase(),
			};

			try {
				const response = await fetch(apiUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-Goog-Api-Key': mapApiKey,
						'X-Goog-FieldMask':
							'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,geocodingResults',
					},
					body: JSON.stringify(payload),
				});
				if (!response.ok) {
					throw new Error(`Error: ${response.status}`);
				}
				const data = await response.json();
				return data;
			} catch (err) {
				throw err;
			}
		}

		/** @type {(resourceId?: string) => void} */
		function resetRoute(resourceId) {
			const routeKeys = Object.keys(routes);
			if (!routeKeys.length) {
				return;
			}

			const targetRouteKeys = resourceId ? [resourceId] : routeKeys;
			for (const routeKey of targetRouteKeys) {
				for (const eventMarker of routes[routeKey]
					.eventMarkersChanged) {
					eventMarker.event.map.markerOptions =
						eventMarker.markerOptions;
					eventMarker.event.map.marker.content =
						eventMarker.markerContent;
					eventMarker.event.map.marker.zIndex = eventMarker.zIndex;
				}
				routes[routeKey].eventMarkersChanged = [];

				for (const marker of routes[routeKey].dynamicMarkers) {
					marker.map = null;
				}
				routes[routeKey].dynamicMarkers = [];
				clearRouteSegments(routes[routeKey]);
				delete routes[routeKey];
			}
		}

		/** @type {() => Promise<void>} */
		async function reRouteResource() {
			const routeKeys = Object.keys(routes);
			if (!routeKeys.length) {
				return;
			}
			resetAll();
			for (const resourceId of routeKeys) {
				await showRouteForResource(resourceId, true);
			}
		}

		/** @type {(polyline: Object, color: string) => void} */
		function drawRouteSegment(polyline, color) {
			return new globals.google.maps.Polyline({
				path: geometry.encoding.decodePath(polyline),
				map: globals.dbk.mapManager.get('map'),
				strokeColor: color,
				strokeOpacity: 0.8,
				strokeWeight: 8,
			});
		}

		/** @type {(route: Object) => void} */
		function clearRouteSegments(route) {
			for (const segment of route.segments) {
				segment.setMap(null);
			}
			route.segments = [];
		}

		/** @type {(aEvent: Object, bEvent: Object) => number} */
		function sortRoutedEvents(aEvent, bEvent) {
			const aCompareDay = globals.moment(
				aEvent.start.format('YYYY-MM-DD')
			);
			const bCompareDay = globals.moment(
				bEvent.start.format('YYYY-MM-DD')
			);
			return (
				aCompareDay - bCompareDay ||
				bEvent.allDay - aEvent.allDay ||
				aEvent.start - bEvent.start
			);
		}

		/** @type {(resource: Object) => void} */
		function assignRouteColorToResource(resource) {
			if (!resource) {
				return;
			}

			// Assign colors
			// get tag from color
			let color;
			if (resource.tags) {
				color = getValueFromTag(resource.tags, 'color');
			}

			// Assign random color if none is provided
			resource.routeColor =
				color ?? resource.routeColor ?? getRandomHexColor();
		}

		// =============================== Markers ===============================

		/** @type {(event: Object) => {event: Object, markerOptions: Object | undefined, markerContent: HTMLElement | undefined, zIndex: number}} */
		function createEventMarkerBackup(event) {
			return {
				event: event,
				markerOptions: event.map?.markerOptions,
				markerContent: event.map?.marker?.content,
				zIndex: event.map?.marker?.zIndex,
			};
		}

		/** @type {(position: Object, title: string, backgroundColor: string, borderColor: string) => HTMLElement}*/
		function createHomeMarker(
			position,
			title,
			backgroundColor,
			borderColor
		) {
			const icon = document.createElement('div');
			icon.innerHTML =
				'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-house-door-fill" viewBox="0 0 16 16"><path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5"/></svg>';
			const pinColor = new pinElement({
				background: backgroundColor,
				borderColor: borderColor,
				glyphColor: borderColor,
				glyph: icon,
			});
			const markerOptions = {
				map: globals.dbk.mapManager.get('map'),
				position: position,
				title: title,
				content: pinColor.element,
				zIndex: 9999,
			};

			markerOptions.content.classList.add('dbk-map-marker');
			markerOptions.content.classList.add('dbk-map-marker-home');
			// markerOptions.content.dataset.id = 'home';

			return new advancedMarkerElement(markerOptions);
		}

		// =============================== Geocoding ===============================

		/** @type {(geocode: Geocode) => Object} */
		function geocodeToGoogle(geocode) {
			if (
				!geocode ||
				typeof geocode !== 'object' ||
				!geocode.lat ||
				!geocode.lng
			) {
				throw new Error('Geocode is not correct format');
			}

			return new globals.google.maps.LatLng(geocode.lat, geocode.lng);
		}

		/** @type {(location: string) => Promise<Geocode>} */
		async function geocodeLocation(location) {
			if (!location) {
				throw new Error(
					'Missing required info. Please provide a valid location.'
				);
			}
			const geocoder = new globals.google.maps.Geocoder();
			const request = {
				address: location,
			};
			try {
				const response = await geocoder.geocode(request);
				const geocode = response.results?.[0]?.geometry?.location;
				if (!geocode) {
					throw new Error(
						'Could not retrieve geocode. The response was invalid.'
					);
				}
				return {lat: geocode.lat(), lng: geocode.lng()};
			} catch (err) {
				throw new Error(
					'Could not retrieve geocode. The response was invalid'
				);
			}
		}

		// =============================== Buttons ===============================

		/** @type {(ev: MouseEvent, resourceId?: string) => void} */
		function hideDistances(ev, resourceId) {
			if (resourceId === 'undefined') {
				resourceId = undefined;
			}

			ev.stopPropagation();
			resetAll(resourceId);
		}

		/** @type {(resourceId: string, icon: string) => string} */
		function createResourceDistanceContainer(resourceId, icon) {
			const container = document.createElement('div');
			container.className = `${inputs.resourceDistanceContainerClass}`;
			container.setAttribute('resource', resourceId);
			const button = document.createElement('button');
			button.setAttribute(
				'onclick',
				`${globalPrefix}routeButtonClick("${resourceId}", event)`
			);
			button.innerHTML = icon;
			container.appendChild(button);
			return container.outerHTML;
		}

		/** @type {(resourceId?: string) => void} */
		function resetResourceDistanceContainers(resourceId) {
			/** @type {NodeListOf<HTMLElement>} */
			const distanceContainers = document.querySelectorAll(
				`.${inputs.resourceDistanceContainerClass}`
			);

			for (const distanceContainer of distanceContainers) {
				const containerId = distanceContainer.getAttribute('resource');
				if (resourceId && resourceId !== containerId) {
					continue;
				}
				// const resourceId = distanceContainer.getAttribute('resource');
				distanceContainer.className = `${inputs.resourceDistanceContainerClass}`;
				const contentElement = distanceContainer.querySelector(
					`.${inputs.resourceDistanceContentClass}`
				);
				distanceContainer.classList.add('dbk-no-transition');
				if (contentElement) {
					contentElement.remove();
					distanceContainer.style.cssText = '';
				}
				setTimeout(() => {
					distanceContainer.classList.remove('dbk-no-transition');
				}, 0);
			}
		}

		/**
		 * Buttons need to be created in the resource before they are active to reserve space, otherwise the calendar positioning
		 * will be off
		 * @type {(resource: {id: string, name: string, dynamicContent: string}, buttonLabel: string, buttonClass: string) => {id: string, name: string}}
		 */
		function createResourceDistanceButton(
			resource,
			buttonLabel,
			buttonClass
		) {
			var button = document.createElement('button');
			button.className = `btn btn-link ${buttonClass} invisible`;
			button.innerHTML = buttonLabel;
			button.setAttribute('resource', resource.id);
			resource.dynamicContent = button.outerHTML;
			return resource;
		}

		/** @type {() => HTMLElement} */
		function createCloseButtonIcon() {
			const icon = document.createElement('i');
			icon.classList.add('dbk-close-btn');
			icon.innerHTML =
				'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z"/></svg>';

			return icon;
		}

		// =============================== Map ===============================

		/** @type{() => Promise<void>} */
		function focusMapTab() {
			return new Promise((resolve, reject) => {
				const config = globals.seedcodeCalendar.get('config');

				if (!config.mapEnabled) {
					reject(
						new Error(
							'The map is currently disabled. An admin must enable the map to use this feature.'
						)
					);
					return;
				}
				const altView = globals.seedcodeCalendar.get('alt-view');

				if (altView.type === 'map' && altView.show) {
					resolve();
					return;
				}

				globals.dbk.updateAltView({show: true, type: 'map'});

				// Wait for the map markers to render before continuing
				if (altView.show || altView.type !== 'map') {
					scheduleRunner('afterUpdate', () => {
						resolve();
					});
				} else {
					// If alt view was not shown but already on the map we just resolve
					// because no after update would fire off in this case
					resolve();
				}
			});
		}

		// =============================== Method Scheduler ===============================

		const scheduledRunners = [];

		/** @type {(type: string, func: Function) => void} */
		function scheduleRunner(type, func) {
			const runner = {type: type, func: func};
			scheduledRunners.push(runner);
		}

		/** @type {(type: string) => void} */
		function executeRunner(type) {
			const ran = scheduledRunners.reduce((acc, runner, index) => {
				if (runner.type === type) {
					if (typeof runner.func === 'function') {
						runner.func();
					}
					acc.push(index);
				}
				return acc;
			}, []);

			for (let i = ran.length - 1; i >= 0; i--) {
				scheduledRunners.splice(ran[i], 1);
			}
		}

		// =============================== Events ===============================

		/** @type {(targetEvent: Event) => {before?: Event, during?: Event, after?: Event}} */
		function getSurroundingResourceEvents(targetEvent) {
			if (
				!targetEvent ||
				(!targetEvent.location && !targetEvent.geocode) ||
				!targetEvent.resource.length ||
				targetEvent.allDay
			) {
				return {};
			}

			const eventMatches = {};

			for (const event of globals.seedcodeCalendar
				.get('element')
				.fullCalendar('clientEvents')) {
				let resourceMatch = false;
				for (const resource of targetEvent.resource) {
					if (event.resource.includes(resource)) {
						resourceMatch = true;
						break;
					}
				}
				if (
					targetEvent._id === event._id ||
					!event.location ||
					event.allDay ||
					!resourceMatch ||
					!globals.dbk.isEventShown(event)
				) {
					continue;
				}

				if (event.end <= targetEvent.start && event.location) {
					// Event is before
					if (
						!eventMatches.before ||
						event.end > eventMatches.before.end
					) {
						eventMatches.before = event;
					}
				} else if (event.start >= targetEvent.end && event.location) {
					// Event is after
					if (
						!eventMatches.after ||
						event.start < eventMatches.after.start
					) {
						eventMatches.after = event;
					}
				} else if (
					targetEvent.start < event.end &&
					targetEvent.end > event.start
				) {
					//Conflicting
					if (
						!eventMatches.during ||
						eventMatches.during.end < event.end
					) {
						eventMatches.during = event;
					}
				}
			}
			return eventMatches;
		}

		/** @type {(targetEvent: Event) => Promise<{before?: EventDistance, during?: EventDistance, after?: EventDistance}>} */
		async function surroundingEventDriveTimes(targetEvent) {
			const surroundingEvents = getSurroundingResourceEvents(targetEvent);
			const matchKey = [];
			const driveTimeResult = {};

			const destinations = [];
			const keys = Object.keys(surroundingEvents);

			for (const key of keys) {
				destinations.push(surroundingEvents[key].location);
				matchKey.push(key);
			}

			try {
				const distanceResult = await calculateDistances(
					[targetEvent.location || ''],
					destinations,
					targetEvent.start.toDate()
				);

				for (let i = 0; i < distanceResult.length; i++) {
					if (distanceResult[i].status !== 'OK') {
						continue;
					}
					const placement = matchKey[i];
					const event = surroundingEvents[placement];
					const duration = distanceResult[i].duration_in_traffic
						? Math.round(
								distanceResult[i].duration_in_traffic.value / 60
							)
						: Math.round(distanceResult[i].duration.value / 60); // Google returns duration in seconds so convert to minutes

					driveTimeResult[matchKey[i]] = {
						event: event,
						duration: duration,
					};
				}
				return driveTimeResult;
			} catch (err) {
				throw err;
			}
		}

		// =============================== Utilities ===============================

		/** @type {(mode: string, isDistanceService: boolean) => string} */
		function getTravelMode(mode, isDistanceService) {
			const travelModeTypeConversion = {
				drive: 'driving',
				bicycle: 'bicycling',
				walk: 'walking',
				transit: 'transit',
				two_wheeler: 'driving',
			};

			if (!mode || !travelModeTypeConversion[mode]) {
				mode = 'drive';
			}

			return isDistanceService
				? travelModeTypeConversion[mode].toUpperCase()
				: mode.toUpperCase();
		}

		/** @type {(dbkGeocode: {lat: number, lng: number}) => Object} */
		function dbkGeocodeToGoogleGeocode(dbkGeocode) {
			return {
				location: {
					latLng: {
						latitude: dbkGeocode.lat,
						longitude: dbkGeocode.lng,
					},
				},
				vehicleStopover: options.vehicleStopover,
			};
		}

		/** @typedef {{name: string}} Tag */
		/** @type {(tags: Array<Tag>, target: string) => any} */
		function getValueFromTag(tags, target) {
			if (!tags || !target) {
				return '';
			}
			for (const tag of tags) {
				if (tag.name.startsWith(`${target}:`)) {
					const value = tag.name.split(':')[1];
					try {
						return value ? JSON.parse(value.trim()) : '';
					} catch (err) {
						return value ? value.trim() : '';
					}
				}
			}
		}

		/** @type {() => string} */
		function getRandomHexColor() {
			let r, g, b;

			do {
				// Generate random RGB values
				r = Math.floor(Math.random() * 256);
				g = Math.floor(Math.random() * 256);
				b = Math.floor(Math.random() * 256);
			} while (isColorTooLight(r, g, b));

			// Convert RGB to hex
			return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
		}

		/** @type {(r: number, g: number, b: number) => boolean} */
		function isColorTooLight(r, g, b) {
			// Calculate brightness using the luminance formula
			const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
			return brightness > 200; // Adjust this threshold as needed
		}

		function showLoader() {
			const existingLoader = document.querySelector('.distances-loader');
			if (existingLoader) {
				return;
			}

			const loader = document.createElement('div');
			loader.classList.add('spinner');
			loader.classList.add('spinner-dark');
			loader.classList.add('distances-loader');
			loader.innerHTML =
				'<div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div>';
			document.body.appendChild(loader);
		}

		function hideLoader() {
			const loader = document.querySelector('.distances-loader');
			if (loader) {
				loader.remove();
			}
		}
	}

	//----------- Run function wrapper and helpers - you shouldn’t need to edit below this line. -------------------

	// Shared type definitions
	/**
	 * @typedef {Object | unknown} ActionError
	 * @property {string} name
	 * @property {string} message
	 */

	// Variables used for helper functions below
	/** @type {number} */
	let timeout;

	// Execute the run function as defined above
	try {
		if (
			!options.restrictedToAccounts ||
			!options.restrictedToAccounts.length ||
			(options.restrictedToAccounts &&
				options.restrictedToAccounts.indexOf(inputs.account) > -1)
		) {
			if (globals.action.preventDefault && options.runTimeout) {
				timeoutCheck();
			}
			run();
		} else if (globals.action.preventDefault) {
			confirmCallback();
		}
	} catch (error) {
		reportError(error);
	}

	/**
	 * Run confirm callback when preventDefault is true. Used for async actions
	 * @type {() => void}
	 */
	function confirmCallback() {
		cancelTimeoutCheck();
		if (globals.action.callbacks.confirm) {
			globals.action.callbacks.confirm();
		}
	}

	/**
	 * Run cancel callback when preventDefault is true. Used for async actions
	 * @type {() => void}
	 */
	function cancelCallback() {
		cancelTimeoutCheck();
		if (globals.action.callbacks.cancel) {
			globals.action.callbacks.cancel();
		}
	}

	/**
	 * Check if the action has run within the specified time limit when preventDefault is enabled
	 * @type {() => void}
	 */
	function timeoutCheck() {
		timeout = setTimeout(
			function () {
				const error = {
					name: 'Timeout',
					message:
						'The action was unable to execute within the allotted time and has been stopped',
				};
				reportError(error);
			},
			options && options.runTimeout ? options.runTimeout * 1000 : 0
		);
	}

	/** @type {() => void} */
	function cancelTimeoutCheck() {
		if (timeout) {
			clearTimeout(timeout);
		}
	}

	/**
	 * Report any errors that occur when running this action
	 * Follows standard javascript error reporter format of an object with name and message properties
	 * @type {(error: ActionError) => void}
	 */
	function reportError(error) {
		const errorTitle = 'Error Running Custom Action';
		const errorMessage = `<p>There was a problem running the action "<span style="white-space: nowrap">${
			globals.action.name?.length > 0
				? globals.action.name
				: globals.action.type
		}</span>"</p><p>Error: ${
			error.message
		}.</p><p>This may result in unexpected behavior of the calendar.</p>`;
		if (
			globals.action.preventDefault &&
			globals.action.category !== 'event' &&
			timeout
		) {
			confirmCallback();
		} else {
			cancelCallback();
		}

		setTimeout(function () {
			globals.utilities.showModal(
				errorTitle,
				errorMessage,
				null,
				null,
				'OK',
				null,
				null,
				null,
				true,
				null,
				true
			);
		}, 1000);
	}
})();
