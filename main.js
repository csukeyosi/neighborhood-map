var map;
var center;

function initMap() {
	center =  {lat: 40.7413549, lng: -73.9980244};
	map = new google.maps.Map(document.getElementById('map'), {
		center: center,
		zoom: 13,
		mapTypeControl: false
	});

	var vm = new ViewModel();
	getMarkers(center, 'restaurant', function(result) {
		vm.addMarkers(result);
	});

	getMarkers(center, 'gym', function(result) {
		vm.addMarkers(result);
	});

	ko.applyBindings(vm);
}


var ViewModel = function() {
	var self = this;

	self.shown = ko.observableArray([]);

	self.hidden = ko.observableArray([]);

	self.showHideRestaurants = function() {
		showHideMarkers(self.shown, self.hidden, 'restaurant');
	}

	self.showHideGyms = function() {
		showHideMarkers(self.shown, self.hidden, 'gym');
	}

	self.addMarkers = function(newMarkers) {
		for (var i=0; i < newMarkers.length; i++) {
			self.shown.push(newMarkers[i]);
		}
	}

	self.openInfoWindow = function(item) {
		var largeInfowindow = new google.maps.InfoWindow();
		populateInfoWindow(item, largeInfowindow);
	}

 	self.currentFilter = ko.observable();

	self.filteredMarkers = ko.computed(function() {
        if(!self.currentFilter()) {
        	for (var i=0; i < self.shown().length; i++) {
        		self.shown()[i].setMap(map);
        	}
            return self.shown();
        } else {
            return ko.utils.arrayFilter(self.shown(), function(item) {
            	var isMatch = item.title.toLowerCase().indexOf(self.currentFilter().toLowerCase()) !== -1;
            	if (isMatch) {
            		item.setMap(map);
            	} else {
            		item.setMap(null);
            	}
                return isMatch;
            });
        }
    });
};


function showHideMarkers(shown, hidden, type) {
	var removed = shown.remove(function(item) {
		return item.type === type;
	});

	var isHide = removed.length;

	for (var i = 0; i < removed.length; i++) {
		removed[i].setMap(null);
		hidden.push(removed[i]);
	}

	if (!isHide) {
		removed = hidden.remove(function(item) {
			return item.type === type;
		});

		var bounds = new google.maps.LatLngBounds();
		for (var i = 0; i < removed.length; i++) {
			removed[i].setMap(map);
			bounds.extend(removed[i].position);
			shown.push(removed[i]);
		}

		map.fitBounds(bounds);
	}
};




function getMarkers(center, type, callback) {
	var request = {
		location: center,
		radius: '500',
		type: [type]
	};

	var service = new google.maps.places.PlacesService(map);
	service.nearbySearch(request, function(results, status) {
		var markers = [];
		if (status == google.maps.places.PlacesServiceStatus.OK) {
			createMarkers(results, markers, type);
		}

		callback(markers)
	});
}


function createMarkers(results, markers, type) {
	var bounds = new google.maps.LatLngBounds();
	var largeInfowindow = new google.maps.InfoWindow();

	var defaultIcon = makeMarkerIcon(type === 'restaurant' ? 'img/restaurant.png' : 'img/gym.png');
	var highlightedIcon = makeMarkerIcon(type === 'restaurant' ? 'img/restaurant2.png' : 'img/gym2.png');

	for (var i = 0; i < results.length; i++) {
		// Get the position from the location array.
		var position = results[i].geometry.location;
		var title = results[i].name;
		// Create a marker per location, and put into markers array.
		var marker = new google.maps.Marker({
			position: position,
			title: title,
			animation: google.maps.Animation.DROP,
			icon: defaultIcon,
			id: i,
			isVisible: true,
			type: type
		});
		// Push the marker to our array of markers.
		markers.push(marker);
		// Create an onclick event to open the large infowindow at each marker.
		marker.addListener('click', function() {
			populateInfoWindow(this, largeInfowindow);
		});
		// Two event listeners - one for mouseover, one for mouseout,
		// to change the colors back and forth.
		marker.addListener('mouseover', function() {
			this.setIcon(highlightedIcon);
		});
		marker.addListener('mouseout', function() {
			this.setIcon(defaultIcon);
		});

		marker.setMap(map);
		bounds.extend(marker.position);
	}
	map.fitBounds(bounds);
}


// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
	// Check to make sure the infowindow is not already opened on this marker.
	if (infowindow.marker != marker) {
		// Clear the infowindow content to give the streetview time to load.
		infowindow.setContent('');
		infowindow.marker = marker;
		// Make sure the marker property is cleared if the infowindow is closed.
		infowindow.addListener('closeclick', function() {
			infowindow.marker = null;
		});
		var streetViewService = new google.maps.StreetViewService();
		var radius = 50;
		// In case the status is OK, which means the pano was found, compute the
		// position of the streetview image, then calculate the heading, then get a
		// panorama from that and set the options


		function getStreetView(data, status) {
			if (status == google.maps.StreetViewStatus.OK) {
				var nearStreetViewLocation = data.location.latLng;
				var heading = google.maps.geometry.spherical.computeHeading(
					nearStreetViewLocation, marker.position);
				infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
				var panoramaOptions = {
					position: nearStreetViewLocation,
					pov: {
						heading: heading,
						pitch: 30
					}
				};
				var panorama = new google.maps.StreetViewPanorama(
					document.getElementById('pano'), panoramaOptions);
			} else {
				infowindow.setContent('<div>' + marker.title + '</div>' +
					'<div>No Street View Found</div>');
			}
		}


		// Use streetview service to get the closest streetview image within
		// 50 meters of the markers position
		streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
		// Open the infowindow on the correct marker.
		infowindow.open(map, marker);
	}
}


// The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(path) {
	var markerImage = new google.maps.MarkerImage(
		path,
		new google.maps.Size(44, 44),
		new google.maps.Point(0, 0),
		new google.maps.Point(10, 34),
		new google.maps.Size(44,44));
	return markerImage;
}