let map;
let markers = [];
let halalSpots = [];
let userLocation = null;
let routingControl = null;
let tempMarker = null; 

function showMessage(elementId, message, isSuccess = true) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.style.color = isSuccess ? "green" : "red";
    }
}

function initMap() {
    map = L.map('map').setView([5.6037, -0.1870], 12); 
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    fetchAndRenderHalalSpots();
    detectUserLocation();
    
    map.on('click', onMapClick);
    
    console.log("Map initialized with Leaflet");
}

function onMapClick(e) {
    const addSpotModal = document.getElementById("addspot-modal");
    
    if (addSpotModal && addSpotModal.style.display === "flex") {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);

        const latInput = document.getElementById("lat");
        const lngInput = document.getElementById("lng");
        if (latInput) latInput.value = lat;
        if (lngInput) lngInput.value = lng;
    
        const statusText = document.getElementById("location-status");
        if (statusText) {
            statusText.textContent = `Selected: Lat ${lat}, Lng ${lng}`;
            statusText.style.color = "blue";
        }
        
        if (tempMarker) {
            map.removeLayer(tempMarker);
        }
        tempMarker = L.marker([lat, lng], {
            icon: L.divIcon({ 
                className: 'custom-div-icon', 
                html: '<i class="fas fa-map-pin" style="color:#d97706; font-size: 24px;"></i>',
                iconSize: [24, 24],
                iconAnchor: [12, 24]
            }),
            draggable: true
        }).addTo(map);
        
        tempMarker.bindPopup("Selected submission location (Drag to adjust)").openPopup();

        tempMarker.on('dragend', function(event){
            const marker = event.target;
            const position = marker.getLatLng();
            if (latInput) latInput.value = position.lat.toFixed(6);
            if (lngInput) lngInput.value = position.lng.toFixed(6);
            if (statusText) statusText.textContent = `Selected: Lat ${position.lat.toFixed(6)}, Lng ${position.lng.toFixed(6)}`;
        });
    }
}

async function fetchAndRenderHalalSpots(query = "", type = "all") {
    try {
        const baseUrl = "http://localhost:5000"; 
        const response = await fetch(
            `${baseUrl}/api/spots?search=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}`
        );
        const data = await response.json();
        
        console.log("Fetched approved spots data:", data.length, "spots found.", data);

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
        try {
            createSpotCard(place);
            createMapMarker(place);
        } catch (e) {
            console.error("Failed to render spot:", place.name, e);
        }
    });
}

function createSpotCard(place) {
    const resultsDiv = document.getElementById("results");
    const card = document.createElement("div");
    card.className = "card";
    
    const imagePath = place.image_path && place.image_path.startsWith('/uploads') 
                      ? `http://localhost:5000${place.image_path}` 
                      : 'placeholder.jpg'; 

    card.innerHTML = `
        <div class="card-content-wrapper">
            
            <div class="image-column">
                <img src="${imagePath}" alt="${place.name}" 
                     onerror="this.onerror=null;this.src='placeholder.jpg';" />
                <span class="tag">${place.type || "N/A"}</span>
            </div>
            
            <div class="detail-column">
                <h3>${place.name}</h3>
                <p>📍 ${place.address || "Unknown"}</p>
                <p class="rating-info">⭐ ${place.rating ?? "N/A"}</p>
                
                <button class="directions-btn styled-btn" onclick="getDirections(${place.lat}, ${place.lng}, '${place.name.replace(/'/g, "\\'")}')">Get Directions</button>
            </div>
            
        </div>
    `;
    resultsDiv.appendChild(card);
    card.addEventListener("click", () => focusOnMarker(place));
}

function clearDirections() {
    if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
    }
    const directionsResultDiv = document.getElementById('directions-result') || document.getElementById('results');
    if (directionsResultDiv) directionsResultDiv.innerHTML = '';
    
    fetchAndRenderHalalSpots("", "all"); 
}

function getDirections(destinationLat, destinationLng, destinationName) {
    if (!userLocation) {
        showMessage("results", "Please allow location access to get directions.", false);
        return;
    }
    
    clearDirections(); 

    const originLat = userLocation.lat;
    const originLng = userLocation.lng;
    
    const start = L.latLng(originLat, originLng);
    const end = L.latLng(destinationLat, destinationLng);

    if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
    }

    routingControl = L.Routing.control({
        waypoints: [start, end],
        routeWhileDragging: false,
        show: true, 
        showAlternatives: false,
        lineOptions: { 
            styles: [{ color: '#007bff', weight: 6, opacity: 0.8 }] 
        },
        router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1'
        })
    }).addTo(map);
    routingControl.on('routesfound', function(e) {
        const routes = e.routes;
        const summary = routes[0].summary;

        const distanceKm = (summary.totalDistance / 1000).toFixed(1) + ' km';
        const durationMin = Math.round(summary.totalTime / 60) + ' minutes';
        
        const directionsResultDiv = document.getElementById('directions-result') || document.getElementById('results');
        clearMarkers();

        directionsResultDiv.innerHTML = `
            <div class="directions-card">
                <h3>🧭 Route to ${destinationName}</h3>
                <p><strong>Distance:</strong> ${distanceKm}</p>
                <p><strong>Duration:</strong> ${durationMin}</p>
                
                <button class="styled-btn" onclick="clearDirections()">Clear Route</button>
            </div>
        `;
    });
}

function createMapMarker(place) {
    if (!map) return;
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lng);

    if (typeof place.lat === 'string' || typeof place.lng === 'string') {
        console.warn(`[DEBUG] Spot "${place.name}" has string coordinates. Original: Lat='${place.lat}', Lng='${place.lng}'. Parsed: Lat=${lat}, Lng=${lng}.`);
    }
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
        console.warn(`Skipping marker for ${place.name}: Invalid coordinates detected after parsing. Check database values.`);
        return;
    }

    const marker = L.marker([lat, lng], {
        title: place.name,
    }).addTo(map);
    marker.bindPopup(`<div style="font-weight:600;">${place.name}</div>`);

    markers.push(marker);
}

function clearMarkers() {
    markers.forEach((m) => m.remove()); 
    markers = [];
    if (tempMarker) { 
        map.removeLayer(tempMarker);
        tempMarker = null;
    }
}

function focusOnMarker(place) {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng) || !map) return;

    map.setView([lat, lng], 15);
}

window.addEventListener("DOMContentLoaded", () => {
    if (!window.location.pathname.endsWith('/admin.html')) {
        initMap(); 
        // applySearchAndFilters();
    }

    const searchInput = document.getElementById("") || document.querySelector(".search-bar input");
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
            const rawType = btn.dataset.tag || btn.dataset.type;
            const selectedType = rawType && rawType.trim() !== '' ? rawType : "all";

            filterBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            applySearchAndFilters(selectedType);
        });
    });

    if (addSpotBtn) addSpotBtn.setAttribute("type", "button");

    setupModalsAndForms();
});

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

    function closeModal(m) { if (!m) return; m.style.display = "none"; document.body.classList.remove("blurred"); }
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

    if (closeAddSpot && addSpotModal) {
        closeAddSpot.addEventListener("click", () => {
            addSpotModal.style.display = "none";
            document.body.classList.remove("blurred");
            if (tempMarker) { 
                map.removeLayer(tempMarker);
                tempMarker = null;
            }
        });
    }

    if (addSpotModal) {
        addSpotModal.addEventListener("click", (e) => {
            if (e.target === addSpotModal) {
                addSpotModal.style.display = "none";
                document.body.classList.remove("blurred");
                if (tempMarker) { 
                    map.removeLayer(tempMarker);
                    tempMarker = null;
                }
            }
        });
    }

    if (addSpotForm) {
        addSpotForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const name = document.getElementById("name").value.trim();
            const address = document.getElementById("address").value.trim();
            const lat = document.getElementById("lat").value.trim();
            const lng = document.getElementById("lng").value.trim();
            
            if (!name || !address || !lat || !lng) {
                const missing = [];
                if (!name) missing.push("Name");
                if (!address) missing.push("Address");
                if (!lat || !lng) missing.push("Latitude/Longitude");
                
                const message = `Please fill out all required fields before submitting: ${missing.join(', ')}.`;
                console.error("Frontend validation failed:", message);
                showMessage("addspot-message", message, false);
                return; 
            }

            const formData = new FormData();
            formData.append("name", name);
            formData.append("type", document.getElementById("type").value);
            formData.append("address", address);
            formData.append("rating", document.getElementById("rating").value);
            formData.append("lat", lat);
            formData.append("lng", lng);

            const fileInput = document.getElementById("image");
            if (fileInput.files.length > 0) {
                formData.append("image", fileInput.files[0]);
            }

            const token = sessionStorage.getItem("authToken"); 
            
            console.log("--- Submission Data Check ---");
            console.log("Token present:", !!token);
            console.log("Name:", name);
            console.log("Lat/Lng:", `${lat}, ${lng}`);
            console.log("-----------------------------");

            if (!token) {
                showMessage("addspot-message", "You must be logged in to add a spot.", false);
                return;
            }

            try {
                const res = await fetch("http://localhost:5000/api/spots/submit", { 
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: formData, 
                });

                const contentType = res.headers.get("content-type");
                if (!res.ok && (!contentType || !contentType.includes("application/json"))) {
                    throw new Error("Server error or route not found. Check your spots router configuration.");
                }

                const data = await res.json();

                if (res.ok) {
                    showMessage("addspot-message", data.message || "Spot submitted successfully!");
                    addSpotForm.reset();
                    if (tempMarker) map.removeLayer(tempMarker); 
                    tempMarker = null;

                    setTimeout(() => closeModal(addSpotModal), 1200);
                } else {
                    showMessage("addspot-message", data.error || data.message || "Failed to submit spot.", false);
                    console.error("Backend response error:", data);
                }
            } catch (err) {
                console.error("Add spot fetch error:", err);
                showMessage("addspot-message", err.message || "An error occurred during submission.", false);
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();
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
                showMessage("signup-message", data.message || "Signup complete!", res.ok);
            } catch (err) {
                console.error(err);
                showMessage("signup-message", "Error signing up.", false);
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
                    sessionStorage.setItem("authToken", data.token);
                    sessionStorage.setItem("user", JSON.stringify(data.user)); 

                    const savedUser = JSON.parse(sessionStorage.getItem("user"));
                    console.log("LOGIN SUCCESS. Saved User Role:", savedUser?.role);
                    
                    showMessage("login-message", "Login successful!", true);
                    closeModal(document.getElementById("login-modal"));

                    if (data.user && data.user.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'index.html';
                    }

                } else {
                    showMessage("login-message", data.message || "Invalid credentials.", false);
                }
            } catch (err) {
                console.error(err);
                showMessage("login-message", "Error logging in.", false);
            }
        });
    }

    if (profileIcon && profileMenu) {
        const storedUser = JSON.parse(sessionStorage.getItem("user") || "null"); 
        if (profileUser) profileUser.textContent = storedUser?.email || "Not signed in"; 
        if (storedUser?.role?.toLowerCase() === 'admin') {
            profileUser.textContent += ' (Admin)';
        }

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
            sessionStorage.removeItem("authToken");
            sessionStorage.removeItem("user");
            showMessage("profile-menu-message", "Logged out successfully!", true);
            
            profileMenu.classList.add("hidden");
            setTimeout(() => {
                window.location.href = "index.html";
            }, 500); 
        });
    }

    allowBtn?.addEventListener("click", () => {
        if (locationModal) locationModal.classList.add("hidden");
    });
    denyBtn?.addEventListener("click", () => locationModal && locationModal.classList.add("hidden"));

    addSpotBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        const token = sessionStorage.getItem("authToken"); 
        if (!token) {
            if (loginModal) loginModal.style.display = "flex", document.body.classList.add("blurred");
        } else {
            if (addSpotModal) {
                 addSpotModal.style.display = "flex";
                 document.body.classList.add("blurred");
                 showMessage("addspot-message", "", true); 
            }
        }
    });

    closeAddSpot?.addEventListener("click", () => closeModal(addSpotModal));
    addSpotModal?.addEventListener("click", (e) => { if (e.target === addSpotModal) closeModal(addSpotModal); });
    closeSignup?.addEventListener("click", () => closeModal(signupModal));
    closeLogin?.addEventListener("click", () => closeModal(loginModal));
    signupModal?.addEventListener("click", (e) => { if (e.target === signupModal) closeModal(signupModal); });
    loginModal?.addEventListener("click", (e) => { if (e.target === loginModal) closeModal(loginModal); });

}

function detectUserLocation() {
    const latInput = document.getElementById("lat"); 
    const lngInput = document.getElementById("lng");
    const statusText = document.getElementById("location-status");
    const HARDCODED_LAT =5.69764899810699;
    const HARDCODED_LNG = -0.17658094700299595; 
    const HARDCODED_LOCATION = { 
        lat: HARDCODED_LAT, 
        lng: HARDCODED_LNG 
    };

    const setMapCenter = (location) => {
        if (map) {
            map.setView([location.lat, location.lng], 14); 
            L.circleMarker([location.lat, location.lng], {
                radius: 8,
                color: 'darkblue',
                fillColor: 'skyblue',
                fillOpacity: 0.8
            }).addTo(map).bindPopup("You are here").openPopup();
        }
    };

        if (statusText) {
            statusText.textContent = "Location failed. Click the map to set Lat/Lng.";
            statusText.style.color = "orange";
        }
        if (latInput) {
            latInput.value = HARDCODED_LOCATION.lat.toFixed(6); 
            latInput.removeAttribute("readonly");
        }
        if (lngInput) {
            lngInput.value = HARDCODED_LOCATION.lng.toFixed(6); 
            lngInput.removeAttribute("readonly");
        }
        setMapCenter(HARDCODED_LOCATION);


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
                setFallbackLocation();
            },
            { 
                enableHighAccuracy: true, 
                timeout: 8000, 
                maximumAge: 0 
            } 
        );
    } else {
        setFallbackLocation();
        if (statusText) {
            statusText.textContent = "Geolocation not supported.";
            statusText.style.color = "red";
        }
    }
}
