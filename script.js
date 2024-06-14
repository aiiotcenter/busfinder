import { addRouteById } from './route.js';
import { busRoutes } from './bus-routes.js';
import { GeoJSON } from './data/GeoJSON.js';

const map = L.map('map').setView([35.2082, 33.3292], 14);
let nearestStop;
let nearestDestinationStop;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
  subdomains: ['a', 'b', 'c']
}).addTo(map);

navigator.geolocation.getCurrentPosition(position => {
  const userLatLng = [position.coords.latitude, position.coords.longitude];
  const userMarker = L.marker(userLatLng).addTo(map);
  userMarker.bindPopup('You are here!');

  const userLocation = turf.point([position.coords.longitude, position.coords.latitude]);
  nearestStop = getNearestBusStop(userLocation);  
  if (nearestStop) {
    console.log(`Nearest bus stop: ${nearestStop.properties.stop_name}, Route id : ${nearestStop.properties.route_id}`);
    const nearestStopLatLng = [nearestStop.geometry.coordinates[1], nearestStop.geometry.coordinates[0]];
    const nearestStopMarker = L.marker(nearestStopLatLng).addTo(map);
    nearestStopMarker.bindPopup('Nearest Stop!');

    L.circle(nearestStopLatLng, {
      color:'blue',
      radius: 300,
      weight: 2
    }).addTo(map);
  } else {
  }
});

function getNearestBusStop(userLocation) {
  const stops = GeoJSON.features.filter(feature => feature.geometry.type === 'Point');
  const featureCollection = turf.featureCollection(stops);
  const nearestStop = turf.nearestPoint(userLocation, featureCollection);
  return nearestStop;
}

const destinationInput = document.getElementById('destination-input');
let destinationLatLng;

const searchButton = document.getElementById('search-button');
searchButton.addEventListener('click', async () => {
  const destination = destinationInput.value.trim();
  if (destination) {
    const coordinates = await geocodeDestination(destination);
    destinationLatLng = { lat: coordinates.latitude, lng: coordinates.longitude };
    console.log(`Destination coordinates: ${coordinates.latitude}, ${coordinates.longitude}`);
    const destinationMarker = L.marker([destinationLatLng.lat, destinationLatLng.lng]).addTo(map);
    destinationMarker.bindPopup(`Destination: ${destinationLatLng.lat}, ${destinationLatLng.lng}`);

    const nearestDestinationStop = getNearestDestinationStop();
    if (nearestDestinationStop) {
      const nearestStopLatLng = [nearestDestinationStop.geometry.coordinates[1], nearestDestinationStop.geometry.coordinates[0]];
      const nearestStopMarker = L.marker(nearestStopLatLng).addTo(map);
      nearestStopMarker.bindPopup('Nearest Destination Stop!');
      L.circle(nearestStopLatLng, {
        color:'red',
        radius: 300,
        weight: 2
      }).addTo(map);
      addrouteinfo(nearestStop, nearestDestinationStop)
      addActiveRoutes(nearestStop, nearestDestinationStop, busRoutes, map);
    }
  } else {
    alert('Please enter a valid destination');
  }
});

async function geocodeDestination(destination) {
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${destination}&format=json&addressdetails=1`;
  try {
    const response = await fetch(nominatimUrl);
    const data = await response.json();
    const coordinate = data[0];
    return {
      latitude: coordinate.lat,
      longitude: coordinate.lon,
    };
  } catch (error) {
    console.error(`Error geocoding destination: ${error}`);
    return null;
  }
}

function getNearestDestinationStop() {
  if (!destinationLatLng) return null;
  const destinationLocation = turf.point([destinationLatLng.lng, destinationLatLng.lat]);
  const stops = GeoJSON.features.filter(feature => feature.geometry.type === 'Point');
  const featureCollection = turf.featureCollection(stops);
  const nearestDstStop = turf.nearestPoint(destinationLocation, featureCollection);
  return nearestDstStop;
}

let destinationSelected = false;

const chooseOnMapButton = document.getElementById('choose-on-map-button');
chooseOnMapButton.addEventListener('click', () => {
  if (!destinationSelected) {
    chooseOnMapButton.classList.add('active'); 
    map.on('click', (e) => {
      destinationLatLng = e.latlng;
      const destinationMarker = L.marker(destinationLatLng).addTo(map);
      destinationMarker.bindPopup(`Destination: ${destinationLatLng.lat}, ${destinationLatLng.lng}`);
      destinationSelected = true;
      map.off('click');
      chooseOnMapButton.classList.remove('active');
      nearestDestinationStop = getNearestDestinationStop(destinationLatLng);
      if (nearestStop && nearestDestinationStop) {
        addActiveRoutes(nearestStop, nearestDestinationStop, busRoutes, map);
        addrouteinfo(nearestStop, nearestDestinationStop)
        const nearestStopLatLng = [nearestDestinationStop.geometry.coordinates[1], nearestDestinationStop.geometry.coordinates[0]];
        const nearestStopMarker = L.marker(nearestStopLatLng).addTo(map);
        nearestStopMarker.bindPopup('Nearest Destination Stop!');
        L.circle(nearestStopLatLng, {
          color: 'red',
          radius: 300,
          weight: 2
        }).addTo(map);
      }
      destinationSelected = true;
      map.off('click');
    });
  }
});

function addActiveRoutes(nearestStop, nearestDestinationStop, busRoutes, map) {
  if (nearestStop && nearestStop.properties.route_id && nearestDestinationStop && nearestDestinationStop.properties.route_id) {
    const routeId1 = nearestStop.properties.route_id;
    const routeId2 = nearestDestinationStop.properties.route_id;
    addRouteById(routeId1, busRoutes, map);
    addRouteById(routeId2, busRoutes, map);
  }
}

function addrouteinfo(nearestStop, nearestDestinationStop) {
  if (nearestStop && nearestStop.properties.route_id && nearestDestinationStop && nearestDestinationStop.properties.route_id) {
    const routeId1 = nearestStop.properties.route_id;
    const stopName1 = nearestStop.properties.stop_name;
    const routeId2 = nearestDestinationStop.properties.route_id;
    const stopName2 = nearestDestinationStop.properties.stop_name;
    const routeNames = {
      1: 'Lefkoşa 1',
      2: 'Lefkoşa 2',
      3: 'Kızılbaş',
      4: 'Gönyeli 1',
      5: 'Gönyeli 2',
      6: 'Gönyeli / Metehan',
      7: 'Ortaköy / Yenikent',
      8: 'Campus - Kyrenia',
      9: 'Campus - Güzelyurt',
      10: 'Campus - Famagusta'
    };
    let route_name1 = routeNames[routeId1];
    let route_name2 = routeNames[routeId2];
    const panelElement = document.getElementById('route-info-panel');
    panelElement.innerHTML = `
      <h2>Transit Information</h2>
      <h3>Nearest Route</h3>
      <p>${route_name1}</p>
      <p>${stopName1}</p>
      <h3>Destination Route </h3>
      <p>${route_name2} </p>
      <p>${stopName2} </p>
      <h3>Travel Time:  </h3>
      <p>~1 hour   </p>
    `;
  } else {
    console.log("if statement failed");
  }
}

const routeButtons = document.querySelectorAll('.route-button');

routeButtons.forEach((button) => {
  button.addEventListener('click', (e) => {
    const routeId = parseInt(button.id.split('-')[1]);
    switch (routeId) {
      case 1:
        addRouteById(1, busRoutes, map); // Lefkoşa 1
        break;
      case 2:
        addRouteById(2, busRoutes, map); // Lefkoşa 2
        break;
      case 3:
        addRouteById(3, busRoutes, map); // Kızılbaş
        break;
      case 4:
        addRouteById(4, busRoutes, map); // Gönyeli 1
        break;
      case 5:
        addRouteById(5, busRoutes, map); // Gönyeli 2
        break;
      case 6:
        addRouteById(6, busRoutes, map); // Gönyeli / Metehan
        break;
      case 7:
        addRouteById(7, busRoutes, map); // Ortaköy / Yenikent
        break;
      case 8:
        addRouteById(8, busRoutes, map); // Campus - Kyrenia
        break;
      case 9:
        addRouteById(9, busRoutes, map); // Campus - Güzelyurt
        break;
      case 10:
        addRouteById(10, busRoutes, map); // Campus - Famagusta
        break;
      default:
        console.error('Invalid route ID selected');
    }
  });
});










