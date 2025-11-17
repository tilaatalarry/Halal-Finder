let map;
let markers = [];
let halalSpots = []; 

window.initMap = function () {
  const accra = { lat: 5.6037, lng: -0.1870 };
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: accra,
    styles: [{ featureType: "poi.business", stylers: [{ visibility: "off" }] }],
  });

  fetchHalalSpots();
  console.log("Map initialized");
};

async function fetchHalalSpots(query = "", type = "all") {
  try {
    const response = await fetch(
      `http://localhost:5000/api/spots?query=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}`
    );
    const data = await response.json();
    halalSpots = Array.isArray(data) ? data : [];
    renderResults(halalSpots);
  } catch (err) {
    console.error("fetchHalalSpots error:", err);
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
    <img src="${place.image ? `http://localhost:5000${place.image}` : 'placeholder.jpg'}" alt="${place.name}" />
    <div class="card-info">
      <h3>${place.name}</h3>
      <p>📍 ${place.address || "Unknown"} • ${place.rating ?? "N/A"}⭐</p>
      <span class="tag">${place.type || (place.tags ? place.tags.join(", ") : "N/A")}</span>
    </div>
  `;
  resultsDiv.appendChild(card);

  card.addEventListener("click", () => focusOnMarker(place));
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

  try {
    const response = await fetch(
      `http://localhost:5000/api/halal?query=${encodeURIComponent(query)}&type=${encodeURIComponent(selectedType)}`
    );
    const data = await response.json();
    halalSpots = Array.isArray(data) ? data : [];

    let filtered = halalSpots;

    // Filter only if not 'all'
    if (selectedType !== "all") {
      filtered = halalSpots.filter((spot) => {
        const t = (spot.type || "").toString().toLowerCase();
        const tags = Array.isArray(spot.tags) ? spot.tags.map(x => x.toLowerCase()) : [];
        return t === selectedType.toLowerCase() || tags.includes(selectedType.toLowerCase());
      });
    }

    renderResults(filtered);
  } catch (err) {
    console.error("applySearchAndFilters error:", err);
  }
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

  if (addSpotBtn && addSpotModal) {
    addSpotBtn.addEventListener("click", () => {
        const token = localStorage.getItem("token");
      if (!token) {
        alert("You must log in first!");
        return;
      }
      addSpotModal.style.display = "flex";
      document.body.classList.add("blurred"); // optional blur
    });
  }

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
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

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
        if (!profileMenu.cont
          ains(e.target) && !profileIcon.contains(e.target)) profileMenu.classList.add("hidden");
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

  // Location modal
  if (locationModal) locationModal.classList.remove("hidden");
  allowBtn?.addEventListener("click", () => {
    if (locationModal) locationModal.classList.add("hidden");
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }), err => console.warn(err));
  });
  denyBtn?.addEventListener("click", () => locationModal && locationModal.classList.add("hidden"));

  // Add spot modal
  addSpotBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      if (loginModal) loginModal.style.display = "flex", document.body.classList.add("blurred");
    } else {
      if (addSpotModal) addSpotModal.style.display = "flex", document.body.classList.add("blurred");
    }
  });

  closeAddSpot?.addEventListener("click", () => closeModal(addSpotModal));
  addSpotModal?.addEventListener("click", (e) => { if (e.target === addSpotModal) closeModal(addSpotModal); });
  closeSignup?.addEventListener("click", () => closeModal(signupModal));
  closeLogin?.addEventListener("click", () => closeModal(loginModal));
  signupModal?.addEventListener("click", (e) => { if (e.target === signupModal) closeModal(signupModal); });
  loginModal?.addEventListener("click", (e) => { if (e.target === loginModal) closeModal(loginModal); });

  function closeModal(m) { if (!m) return; m.style.display = "none"; document.body.classList.remove("blurred"); }
}

let setUserLocation = null;
function detectUserLocation() {
  const latInput = document.getElementById("lat") || document.getElementById("spot-lat");
  const lngInput = document.getElementById("lng") || document.getElementById("spot-lng");
  const statusText = document.getElementById("location-status");

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
        if (map) {
          map.setCenter(userLocation);
          map.setZoom(14);
          new google.maps.Marker({
            position: userLocation,
            map,
            title: "Me",
            icon: { url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" },
          });
        }
      },
      (err) => {
        console.warn("Geolocation error:", err);
        if (statusText) {
          statusText.textContent = "Couldn't detect location. You can enter manually.";
          statusText.style.color = "orange";
        }
        if (latInput) latInput.removeAttribute("readonly");
        if (lngInput) lngInput.removeAttribute("readonly");
      }
    );
  } else {
    if (statusText) {
      statusText.textContent = "Geolocation not supported.";
      statusText.style.color = "red";
    }
    if (latInput) latInput.removeAttribute("readonly");
    if (lngInput) lngInput.removeAttribute("readonly");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  detectUserLocation();
});