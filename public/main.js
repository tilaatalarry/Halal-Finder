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
  const addSpotModal = document.getElementById("addspot-modal");
  const closeAddSpot = document.getElementById("close-addspot");
  const addSpotBtn = document.getElementById("add-spot-btn");
  const signupModal = document.getElementById("signup-modal");
  const closeSignup = document.getElementById("close-signup");
  const loginModal = document.getElementById("login-modal");
  const closeLogin = document.getElementById("close-login");

  addSpotBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      loginModal.style.display = "flex"; 
      document.body.classList.add("blurred");
    } else {
      addSpotModal.style.display = "flex";
      document.body.classList.add("blurred");
    } 
  });

  closeAddSpot.addEventListener("click", () => {
    addSpotModal.style.display = "none";
    document.body.classList.remove("blurred");
  });

  addSpotModal.addEventListener("click", (e) => {
    if (e.target === addSpotModal) {
      addSpotModal.style.display = "none";
      document.body.classList.remove("blurred");
    }
  });

  if (locationModal) locationModal.classList.remove("hidden");

  if (allowBtn) {
    allowBtn.addEventListener("click", () => {
      locationModal.classList.add("hidden");
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => console.warn("Geolocation failed:", err)
        );
      }
    });
  }

  if (denyBtn) denyBtn.addEventListener("click", () => locationModal.classList.add("hidden"));

  const token = localStorage.getItem("token");
  if (token && addSpotBtn) {
    addSpotBtn.addEventListener("click", () => {
      window.location.href = "addspot.html"; // user already logged in
    });
  } else if (addSpotBtn) {
    addSpotBtn.addEventListener("click", () => {
      const token = localStorage.getItem("token");
      if (!token) {
        signupModal.style.display = "flex";
        document.body.classList.add("blurred");
      } else {
        window.location.href = "addspot.html";
      }
    });
  }

  closeSignup?.addEventListener("click", () => closeModal(signupModal));
  closeLogin?.addEventListener("click", () => closeModal(loginModal));

  signupModal?.addEventListener("click", (e) => { if (e.target === signupModal) closeModal(signupModal); });
  loginModal?.addEventListener("click", (e) => { if (e.target === loginModal) closeModal(loginModal); });

  function closeModal(modal) {
    modal.style.display = "none";
    document.body.classList.remove("blurred");
  }

  document.getElementById("signup-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const msg = document.getElementById("signup-message");

    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        msg.textContent = "Signup successful! Redirecting to login...";
        msg.style.color = "green";
        setTimeout(() => {
          closeModal(signupModal);
          loginModal.style.display = "flex";
          document.body.classList.add("blurred");
        }, 1000);
      } else {
        msg.textContent = data.message || "Signup failed!";
        msg.style.color = "red";
      }
    } catch (err) {
      console.error(err);
      msg.textContent = "Server error.";
      msg.style.color = "red";
    }
  });

  // Login form
  document.getElementById("login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const msg = document.getElementById("login-message");

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        closeModal(loginModal);
        window.location.href = "index.html";
      } else {
        msg.textContent = data.message || "Login failed!";
        msg.style.color = "red";
      }
    } catch (err) {
      console.error(err);
      msg.textContent = "Server error.";
      msg.style.color = "red";
    }
  });
});

document.getElementById("addspot-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("spot-name").value;
  const address = document.getElementById("spot-address").value;
  const type = document.getElementById("spot-type").value;
  const lat = document.getElementById("spot-lat").value;
  const lng = document.getElementById("spot-lng").value;
  const image = document.getElementById("spot-image").value;
  const msg = document.getElementById("addspot-message");

  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/halal", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name, address, type, lat, lng, image })
    });

    const data = await res.json();
    if (res.ok) {
      msg.textContent = "Spot added successfully!";
      msg.style.color = "green";
      setTimeout(() => {
        addSpotModal.style.display = "none";
        document.body.classList.remove("blurred");
        window.location.reload(); // refresh to show new spot
      }, 1200);
    } else {
      msg.textContent = data.message || "Failed to add spot";
      msg.style.color = "red";
    }
  } catch (err) {
    console.error(err);
    msg.textContent = "Server error";
    msg.style.color = "red";
  }
});

function setUserLocation(location) {
  if (!map) return console.error("Map not initialized yet!");
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
    const response = await fetch(
      `http://localhost:5000/api/halal?query=${encodeURIComponent(query)}&${encodeURIComponent(type)}`
    );
    const data = await response.json();
    const filteredData = type === "all" ? data : data.filter((spot) => spot.type === type);
    renderResults(filteredData);
  } catch (err) {
    console.error("Error fetching halal spots:", err);
  }
}

// Render results
function renderResults(data) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";
  clearMarkers();

  if (!data.length) return resultsDiv.innerHTML = "<p>No halal spots found.</p>";

  data.forEach((place) => {
    createSpotCard(place);
    createMapMarker(place);
  });
}

// Spot cards
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

  card.addEventListener("click", () => focusOnMarker(place));
}

// Map markers
function createMapMarker(place) {
  const marker = new google.maps.Marker({
    position: { lat: parseFloat(place.lat), lng: parseFloat(place.lng) },
    map,
    title: place.name,
  });

  const infoWindow = new google.maps.InfoWindow({ content: `<div style="font-weight:600;">${place.name}</div>` });
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