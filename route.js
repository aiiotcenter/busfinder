// route.js
function addRouteById(routeId, busRoutes, map) {
  const route = busRoutes.find(route => route.id === routeId);
  if (route) {
    const routingControl = L.Routing.control({
      waypoints: route.waypoints,
      routeWhileDragging: false,
      draggable: false,
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      }),
      summaryTemplate: "",
      lineOptions: {
        styles: [route.style]
      },
      createMarker: function() {
        return null; 
      }
    });
    route.stops.forEach((stop, index) => {
      const style = route.style;
      const icon = L.divIcon({
        html: `<div style="background-color: ${style.color}; width: 20px; height: 20px; border-radius: 0%; display: flex; justify-content: center; align-items: center;"><span style="font-size: 12px; color: #ffffff;">${index + 1}</span></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      L.marker([stop.lat, stop.lon], { icon: icon }).addTo(map);
    });
    routingControl.addTo(map);
  } else {
    console.error(`Route with ID ${routeId} not found`);
  }
}

export { addRouteById };