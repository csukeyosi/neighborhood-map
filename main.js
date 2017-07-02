$(document).ready(function () {
// rest of your code here


// Here's my data model
var ViewModel = function(first, last) {
	// this.list = ko.observableArray([
	// 	new SeatReservation("Steve", self.availableMeals[0]),
	// 	new SeatReservation("Bert", self.availableMeals[1])
	// 	]);
	this.firstName = ko.observable(first);
	this.lastName = ko.observable(last);
};

ko.applyBindings(new ViewModel("Planet", "Earth")); // This makes Knockout get to work
});

var map;
// Create a new blank array for all the listing markers.
var markers = [];
function initMap() {

	var center = {lat: 40.7413549, lng: -73.9980244};
// Constructor creates a new map - only center and zoom are required.
map = new google.maps.Map(document.getElementById('map'), {
	center: center,
	zoom: 13,
	mapTypeControl: false
});

// populateLocations(center);
// These are the real estate listings that will be shown to the user.
// Normally we'd have these in a database instead.
populateLocations(center, function(results, status) {
	console.log("entrou aqui 3")
	console.log(results)
	if (status != google.maps.places.PlacesServiceStatus.OK) {
		return;
	}
	var largeInfowindow = new google.maps.InfoWindow();
// Style the markers a bit. This will be our listing marker icon.
var defaultIcon = makeMarkerIcon('img/restaurant.png');
// Create a "highlighted location" marker color for when the user
// mouses over the marker.
var highlightedIcon = makeMarkerIcon('img/restaurant2.png');
// The following group uses the location array to create an array of markers on initialize.
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
	id: i
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
}
});

document.getElementById('show-listings').addEventListener('click', showListings);
// document.getElementById('hide-listings').addEventListener('click', hideListings);
document.getElementById('zoom-to-area').addEventListener('click', function() {
	zoomToArea();
});

}

function populateLocations(center, callback) {
	console.log("entrou aqui 1")
	var request = {
		location: center,
		radius: '500',
		type: ['restaurant']
	};

	var service = new google.maps.places.PlacesService(map);
	service.nearbySearch(request, function(results, status) {
		console.log("entrou aqui 2")
		callback(results, status);
	});
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
// This function will loop through the markers array and display them all.
function showListings() {
	var bounds = new google.maps.LatLngBounds();
// Extend the boundaries of the map for each marker and display the marker
for (var i = 0; i < markers.length; i++) {
	markers[i].setMap(map);
	bounds.extend(markers[i].position);
}
map.fitBounds(bounds);
}
// This function will loop through the listings and hide them all.
function hideListings() {
	for (var i = 0; i < markers.length; i++) {
		markers[i].setMap(null);
	}
}
// The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(path) {
	var markerImage = new google.maps.MarkerImage(
		path,
		new google.maps.Size(31, 44),
		new google.maps.Point(0, 0),
		new google.maps.Point(10, 34),
		new google.maps.Size(31,44));
	return markerImage;
}


// This function takes the input value in the find nearby area text input
// locates it, and then zooms into that area. This is so that the user can
// show all listings, then decide to focus on one area of the map.
function zoomToArea() {
// Initialize the geocoder.
var geocoder = new google.maps.Geocoder();
// Get the address or place that the user entered.
var address = document.getElementById('zoom-to-area-text').value;
// Make sure the address isn't blank.
if (address == '') {
	window.alert('You must enter an area, or address.');
} else {
// Geocode the address/area entered to get the center. Then, center the map
// on it and zoom in
geocoder.geocode(
	{ address: address,
		componentRestrictions: {locality: 'New York'}
	}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			map.setCenter(results[0].geometry.location);
			map.setZoom(15);
		} else {
			window.alert('We could not find that location - try entering a more' +
				' specific place.');
		}
	});
}}
