let map;
let markers = [];

window.initMap = function () {
  const accra = { lat: 5.6037, lng: -0.1870 };
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: accra,
    styles: [{ featureType: "poi.business", stylers: [{ visibility: "off" }] }],
  });

  fetchHalalSpots("");
  console.log("Map initialized");
};

window.addEventListener("DOMContentLoaded", () => {
  const locationModal = document.getElementById("location-permission");
  const allowBtn = document.getElementById("allow-location");
  const denyBtn = document.getElementById("deny-location");

  if (locationModal) {
    locationModal.classList.remove("hidden");
  }

  if (allowBtn) {
    allowBtn.addEventListener("click", () => {
      console.log("Allow clicked");
      locationModal.classList.add("hidden");

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
          },
          (err) => console.warn("Geolocation failed:", err)
        );
      }
    });
  }

  if (denyBtn) {
    denyBtn.addEventListener("click", () => {
      console.log("Deny clicked");
      locationModal.classList.add("hidden");
    });
  }
});

document.getElementById("add-spot-btn").addEventListener("click", () => {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("You need an account to add a spot.");
    window.location.href = "signup.html";
  } else {
    document.getElementById("add-spot-form").style.display = "block";
  }
});

function setUserLocation(location) {
  if (!map) {
    console.error("Map not initialized yet!");
    return;
  }

  map.setCenter(location);
  new google.maps.Marker({
    position: location,
    map,
    title: "Me",
    icon: { url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" },
  });
}

async function fetchHalalSpots(query, type = "all") {
  try {
    const response = await fetch(`http://localhost:5000/api/halal?query=${encodeURIComponent(query)}`);
    const data = await response.json();

    const filteredData = type === "all" ? data : data.filter((spot) => spot.type === type);
    renderResults(filteredData);
  } catch (err) {
    console.error("Error fetching halal spots:", err);
  }
}

function renderResults(data) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";
  clearMarkers();

  if (!data.length) {
    resultsDiv.innerHTML = "<p>No halal spots found.</p>";
    return;
  }

  data.forEach((place) => {
    createSpotCard(place);
    createMapMarker(place);
  });
}

function createSpotCard(place) {
  const resultsDiv = document.getElementById("results");
  const card = document.createElement("div");
  card.classList.add("card");
  card.innerHTML = `
    <img src="${place.image}" alt="${place.name}" />
    <div class="card-info">
      <h3>${place.name}</h3>
      <p>📍 ${place.address} • ${place.rating ?? "N/A"}⭐</p>
      <span class="tag">${place.type}</span>
    </div>
  `;
  resultsDiv.appendChild(card);

  card.addEventListener("click", () => {
    focusOnMarker(place);
  });
}

function createMapMarker(place) {
  const marker = new google.maps.Marker({
    position: { lat: parseFloat(place.lat), lng: parseFloat(place.lng) },
    map,
    title: place.name,
  });

  const infoWindow = new google.maps.InfoWindow({
    content: `<div style="font-weight:600;">${place.name}</div>`,
  });

  marker.addListener("click", () => infoWindow.open(map, marker));
  markers.push(marker);
}

function focusOnMarker(place) {
  map.setCenter({ lat: parseFloat(place.lat), lng: parseFloat(place.lng) });
  map.setZoom(15);
}

function clearMarkers() {
  markers.forEach((marker) => marker.setMap(null));
  markers = [];
}

const searchInput = document.getElementById("search-input");
const filters = document.querySelectorAll(".filter");

searchInput.addEventListener("input", handleSearchInput);
filters.forEach((button) => button.addEventListener("click", handleFilterClick));

function handleSearchInput() {
  const query = searchInput.value.trim();
  const activeType = document.querySelector(".filter.active").dataset.type;
  fetchHalalSpots(query, activeType);
}

function handleFilterClick(e) {
  filters.forEach((btn) => btn.classList.remove("active"));
  e.target.classList.add("active");
  const query = searchInput.value.trim();
  fetchHalalSpots(query, e.target.dataset.type);
}

const addSpotBtn = document.getElementById("add-spot-btn");
if (addSpotBtn) {
  addSpotBtn.addEventListener("click", () => {
    const token = localStorage.getItem("token"); 
    if (!token) {
      window.location.href = "/signup.html";
    } else {
      window.location.href = "/addspot.html";
    }
  });
}