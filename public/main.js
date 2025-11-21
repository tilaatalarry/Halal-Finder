let map;
let markers = [];
let halalSpots = []; 
let userLocation = null;

window.initMap = function () {
  const accra = { lat: 5.6037, lng: -0.1870 };
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    styles: [{ featureType: "poi.business", stylers: [{ visibility: "off" }] }],
  });

  fetchAndRenderHalalSpots();
  detectUserLocation();
  console.log("Map initialized");
};

async function fetchAndRenderHalalSpots(query = "", type = "all") {
  try {
    const response = await fetch(
      `http://localhost:5000/api/spots?query=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}`
    );
    const data = await response.json();
    halalSpots = Array.isArray(data) ? data : [];
    renderResults(halalSpots);
  } catch (err) {
    console.error("fetchAndRenderHalalSpots error:", err);
  }
}

function renderResults(spots) {
  const resultsDiv = document.getElementById("results");
  if (!resultsDiv) return console.warn("No #results element found");
  resultsDiv.innerHTML = "";
  clearMarkers();

  if (!spots || spots.length === 0) {
    resultsDiv.innerHTML = '<p class="results-info">No halal spots found.</p>';
    return;
  }

  spots.forEach((place) => {
    createSpotCard(place);
    createMapMarker(place);
  });
}

function createSpotCard(place) {
  const resultsDiv = document.getElementById("results");
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="spot-details-wrapper">
        <img src="${place.image ? `http://localhost:5000${place.image}` : 'placeholder.jpg'}" alt="${place.name}" />
        <h3>${place.name}</h3>
        <p>📍 ${place.address || "Unknown"} • ${place.rating ?? "N/A"}⭐</p>
        <span class="tag">${place.type || (place.tags ? place.tags.join(", ") : "N/A")}</span>
    </div>
    <button class="directions-btn styled-btn" onclick="getDirections(${place.lat}, ${place.lng}, '${place.name.replace(/'/g, "\\'")}')">Get Directions</button>    
  `;
  resultsDiv.appendChild(card);

  card.addEventListener("click", () => focusOnMarker(place));
}

function getDirections(destinationLat, destinationLng, destinationName) {
    if (!userLocation) {
        alert("Please allow location access to get directions.");
        return;
    }

    const originLat = userLocation.lat;
    const originLng = userLocation.lng;
    
    // Defaulting to driving mode for now
    fetchDirections(
        originLat, 
        originLng, 
        destinationLat, 
        destinationLng, 
        destinationName,
        'driving' // You can change this later
    );
}


async function fetchDirections(oLat, oLng, dLat, dLng, dName, travelMode) {
    const directionsResultDiv = document.getElementById('directions-result') || document.getElementById('results');
    const params = new URLSearchParams({
        originLat: oLat,
        originLng: oLng,
        destinationLat: dLat,
        destinationLng: dLng,
        travelMode: travelMode
    });

    try {
        directionsResultDiv.innerHTML = `<p class="results-info">Fetching directions...</p>`;
        const response = await fetch(`http://localhost:5000/api/directions?${params.toString()}`);
        const data = await response.json();
        
        if (!response.ok || !data.routes || data.routes.length === 0) {
             throw new Error(data.message || 'No routes found.');
        }

        const firstRoute = data.routes[0];
        
        let directionsHtml = `
            <div class="directions-card">
                <h3>🧭 Directions to ${dName} (${firstRoute.mode})</h3>
                <p><strong>Distance:</strong> ${firstRoute.distance}</p>
                <p><strong>Duration:</strong> ${firstRoute.duration}</p>
                <a href="${firstRoute.url}" target="_blank">View Full Route on Google Maps</a>
                <button onclick="document.getElementById('directions-result').innerHTML = ''">Close Directions</button>
            </div>
        `;
        // Instead of replacing the results, let's inject a new section:
        directionsResultDiv.innerHTML = directionsHtml; 

    } catch (error) {
        console.error("Error fetching directions:", error);
        directionsResultDiv.innerHTML = `<p class="error-info">Error: ${error.message}</p>`;
    }
}

function createMapMarker(place) {
  if (!map) return;
  const lat = parseFloat(place.lat);
  const lng = parseFloat(place.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return;

  const marker = new google.maps.Marker({
    position: { lat, lng },
    map,
    title: place.name,
  });

  const infoWindow = new google.maps.InfoWindow({
    content: `<div style="font-weight:600;">${place.name}</div>`,
  });

  marker.addListener("click", () => infoWindow.open(map, marker));
  markers.push(marker);
}

function clearMarkers() {
  markers.forEach((m) => m.setMap(null));
  markers = [];
}

function focusOnMarker(place) {
  const lat = parseFloat(place.lat);
  const lng = parseFloat(place.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng) || !map) return;
  map.setCenter({ lat, lng });
  map.setZoom(15);
}

// ===== DOM READY =====
window.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-input") || document.querySelector(".search-bar input");
  const searchBtn = document.querySelector(".search-btn");
  const filterBtns = Array.from(document.querySelectorAll(".filter"));
  const addSpotBtn = document.getElementById("add-spot-btn");

  if (searchInput) searchInput.addEventListener("input", () => applySearchAndFilters());

  if (searchBtn) searchBtn.addEventListener("click", (e) => {
    e.preventDefault();
    applySearchAndFilters();
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const selectedType = btn.dataset.tag || btn.dataset.type;

      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      applySearchAndFilters(selectedType);
    });
  });

  if (addSpotBtn) addSpotBtn.setAttribute("type", "button");

  setupModalsAndForms();
});

// ===== SEARCH + FILTER LOGIC =====
async function applySearchAndFilters(selectedType = "all") {
  const searchInput = document.getElementById("search-input") || document.querySelector(".search-bar input");
  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
  await fetchAndRenderHalalSpots(query, selectedType);
}


function setupModalsAndForms() {
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
  const profileIcon = document.getElementById("profile-icon");
  const profileMenu = document.getElementById("profile-menu");
  const logoutBtn = document.getElementById("logout-btn");
  const profileUser = document.getElementById("profile-user");
  const signupForm = document.getElementById("signup-form");
  const loginForm = document.getElementById("login-form");
  const addSpotForm = document.getElementById("addspot-form");
  const gotoSignupLink = document.getElementById("goto-signup");
  const gotoLoginLink = document.getElementById("goto-login");

  // Utility function definition (needed before listeners use it)
  function closeModal(m) { if (!m) return; m.style.display = "none"; document.body.classList.remove("blurred"); }

  // --- Modal Switch Logic ---
  if (gotoSignupLink) {
    gotoSignupLink.addEventListener("click", (e) => {
      e.preventDefault();
      closeModal(loginModal);
      if (signupModal) {
        signupModal.style.display = "flex";
        document.body.classList.add("blurred");
      }
    });
  }
  
  if (gotoLoginLink) {
    gotoLoginLink.addEventListener("click", (e) => {
      e.preventDefault();
      closeModal(signupModal);
      if (loginModal) {
        loginModal.style.display = "flex";
        document.body.classList.add("blurred");
      }
    });
  }
  // --- End Modal Switch Logic ---


  // --- Add Spot Modal Close Listeners ---
  if (closeAddSpot && addSpotModal) {
    closeAddSpot.addEventListener("click", () => {
      addSpotModal.style.display = "none";
      document.body.classList.remove("blurred");
    });
  }

  if (addSpotModal) {
    addSpotModal.addEventListener("click", (e) => {
      if (e.target === addSpotModal) {
        addSpotModal.style.display = "none";
        document.body.classList.remove("blurred");
      }
    });
  }

  // --- Add Spot Form Submission ---
  if (addSpotForm) {
    addSpotForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData();
      formData.append("name", document.getElementById("name").value);
      formData.append("type", document.getElementById("type").value);
      formData.append("address", document.getElementById("address").value);
      formData.append("rating", document.getElementById("rating").value);
      formData.append("lat", document.getElementById("lat").value);
      formData.append("lng", document.getElementById("lng").value);

      const fileInput = document.getElementById("image");
      if (fileInput.files.length > 0) {
        formData.append("image", fileInput.files[0]);
      }

      const token = localStorage.getItem("token");
      if (!token) {
        document.getElementById("addspot-message").textContent = "You must be logged in to add a spot.";
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/spots/add", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: formData, 
        });

        const data = await res.json();

        if (res.ok) {
          document.getElementById("addspot-message").textContent = "Spot added successfully!";
          addSpotForm.reset();
          setTimeout(() => window.location.reload(), 1200);
        } else {
          document.getElementById("addspot-message").textContent = data.message || "Failed to add spot.";
        }
      } catch (err) {
        console.error("Add spot error:", err);
        document.getElementById("addspot-message").textContent = "An error occurred.";
      }
    });
  }

  // --- Signup Form Submission (FIXED unique IDs) ---
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // **CRITICAL FIX:** Using unique IDs to avoid conflict with Add Spot form
      const name = document.getElementById("signup-name").value; 
      const email = document.getElementById("signup-email").value;
      const password = document.getElementById("signup-password").value;

      try {
        const res = await fetch("http://localhost:5000/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        document.getElementById("signup-message").textContent = data.message || "Signup complete!";
      } catch (err) {
        console.error(err);
        document.getElementById("signup-message").textContent = "Error signing up.";
      }
    });
  }

  // --- Login Form Submission ---
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;

      try {
        const res = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (res.ok) {
        // save token and user info in localStorage
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));

          document.getElementById("login-message").textContent = "Login successful!";
          closeModal(document.getElementById("login-modal"));

        // optionally refresh UI or reload
          window.location.reload();
        } else {
          document.getElementById("login-message").textContent = data.message || "Invalid credentials.";
        }
      } catch (err) {
        console.error(err);
        document.getElementById("login-message").textContent = "Error logging in.";
      }
    });
  }

  if (profileIcon && profileMenu) {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    if (profileUser) profileUser.textContent = storedUser?.name || storedUser?.email || "Not signed in";

    profileIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle("hidden");
    });

    window.addEventListener("click", (e) => {
      if (!profileMenu.classList.contains("hidden")) {
        if (!profileMenu.contains(e.target) && !profileIcon.contains(e.target)) profileMenu.classList.add("hidden");
      }
    });

    logoutBtn?.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      alert("Logged out");
      profileMenu.classList.add("hidden");
      window.location.href = "index.html";
    });
  }

  // --- Location Modal Handlers ---
  if (locationModal) locationModal.classList.remove("hidden");
  allowBtn?.addEventListener("click", () => {
    if (locationModal) locationModal.classList.add("hidden");
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }), err => console.warn(err));
  });
  denyBtn?.addEventListener("click", () => locationModal && locationModal.classList.add("hidden"));

  // 🔑 CRITICAL FIX: Add spot button is now correctly inside the function
  addSpotBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      if (loginModal) loginModal.style.display = "flex", document.body.classList.add("blurred");
    } else {
      if (addSpotModal) addSpotModal.style.display = "flex", document.body.classList.add("blurred");
    }
  });

  // --- Generic Modal Closers ---
  closeAddSpot?.addEventListener("click", () => closeModal(addSpotModal));
  addSpotModal?.addEventListener("click", (e) => { if (e.target === addSpotModal) closeModal(addSpotModal); });
  closeSignup?.addEventListener("click", () => closeModal(signupModal));
  closeLogin?.addEventListener("click", () => closeModal(loginModal));
  signupModal?.addEventListener("click", (e) => { if (e.target === signupModal) closeModal(signupModal); });
  loginModal?.addEventListener("click", (e) => { if (e.target === loginModal) closeModal(loginModal); });

} // <--- setupModalsAndForms function now correctly closes here!


function detectUserLocation() {
  const latInput = document.getElementById("lat") || document.getElementById("spot-lat");
  const lngInput = document.getElementById("lng") || document.getElementById("spot-lng");
  const statusText = document.getElementById("location-status");
  const defaultCenter = { lat: 5.6037, lng: -0.1870 }; // Accra
  const setMapCenter = (location) => {
    if (map) {
      map.setCenter(location);
      map.setZoom(14);
      new google.maps.Marker({
        position: location,
        map,
        title: "Me",
        icon: { url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" },
      });
    }
  };

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (latInput) latInput.value = userLocation.lat.toFixed(6);
        if (lngInput) lngInput.value = userLocation.lng.toFixed(6);
        if (statusText) {
          statusText.textContent = "Location detected";
          statusText.style.color = "green";
        }
        setMapCenter(userLocation);
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setMapCenter(defaultCenter);  
        if (statusText) {
          statusText.textContent = "Couldn't detect location. You can enter manually.";
          statusText.style.color = "orange";
        }
        if (latInput) latInput.removeAttribute("readonly");
        if (lngInput) lngInput.removeAttribute("readonly");
      }
    );
  } else {
    setMapCenter(defaultCenter);
    if (statusText) {
      statusText.textContent = "Geolocation not supported.";
      statusText.style.color = "red";
    }
    if (latInput) latInput.removeAttribute("readonly");
    if (lngInput) lngInput.removeAttribute("readonly");
  }
}