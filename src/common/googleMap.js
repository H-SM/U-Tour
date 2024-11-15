function initGoogleMap({ origin, destination }) {
    const map = new google.maps.Map(document.getElementById('map'), {
      zoom: 15,
      center: { lat: 30.056963, lng: 79.529733 },
      disableDefaultUI: true,
      gestureHandling: 'greedy',
      mapTypeControl: false,
      streetViewControl: false,
      zoomControl: false
    });
  
    new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#1a73e8',
        strokeWeight: 6,
        strokeOpacity: 0.8
      }
    }).setDirections({
      origin: origin,
      destination: destination,
      travelMode: google.maps.TravelMode.DRIVING
    });
  }
  