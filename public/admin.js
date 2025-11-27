const API_BASE_URL = "http://localhost:5000/api";

function showCustomMessage(message, isError = false) {
    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-box';
    messageContainer.style.cssText = `
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 20px 30px;
        background-color: ${isError ? '#fee2e2' : '#d1fae5'};
        color: ${isError ? '#991b1b' : '#065f46'};
        border: 2px solid ${isError ? '#f87171' : '#34d399'};
        border-radius: 8px;
        font-weight: 600;
        z-index: 1000;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        text-align: center;
        transition: opacity 0.3s ease-in-out;
    `;
    messageContainer.textContent = message;
    document.body.appendChild(messageContainer);

    setTimeout(() => {
        messageContainer.style.opacity = '0';
        setTimeout(() => messageContainer.remove(), 300);
    }, 3000);
}

function checkAdminAccess() {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    const token = sessionStorage.getItem('authToken');

    if (!token || user?.role !== 'admin') {
        window.alert("Access Denied. Admins only."); 
        window.location.href = 'index.html'; 
        return false;
    }
    
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }

    return true;
}

async function fetchAndRenderSpots() {
    const spotTableBody = document.getElementById('spot-table-body');
    const loadingMessage = document.getElementById('loading-message');
    const token = sessionStorage.getItem('authToken');

    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/all_spots`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401 || response.status === 403) {
            if (loadingMessage) loadingMessage.innerHTML = '<span style="color:red;">Unauthorized. Only admins can view this data.</span>';
            return;
        }

        const spots = await response.json();
        
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (spotTableBody) spotTableBody.innerHTML = ''; 

        if (spots.length === 0) {
            if (spotTableBody) spotTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No spots found in the database.</td></tr>';
            return;
        }

        spots.forEach(spot => {
            const isApproved = spot.approved == 1;
            const statusText = isApproved ? '<span class="text-green-600 font-bold">Approved</span>' : '<span class="text-yellow-600 font-bold">Pending</span>';

            const row = spotTableBody.insertRow();
            row.innerHTML = `
                <td class="px-6 py-4">${spot.id}</td>
                <td class="px-6 py-4">${spot.name}</td>
                <td class="px-6 py-4">${spot.address}</td>
                <td class="px-6 py-4">${statusText}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    ${!isApproved ? 
                        `<button onclick="approveSpot('${spot.id}')" class="text-indigo-600 hover:text-indigo-900 mr-2">Approve</button>`
                        : `<span class="text-green-500 mr-2">Live</span>`
                    }
                    <button onclick="deleteSpot('${spot.id}')" class="text-red-600 hover:text-red-900">Delete</button>
                    <!-- Reject button removed as it's typically handled by Delete or simply leaving as Pending -->
                </td>
            `;
        });

    } catch (error) {
        console.error("Failed to fetch spots:", error);
        if (loadingMessage) {
             loadingMessage.innerHTML = `<span style="color:red;">Error fetching spots: ${error.message}. Is the backend server running on port 5000?</span>`;
        }
    }
}

async function approveSpot(spotId) {
    const token = sessionStorage.getItem('authToken');
    if (!token) return showCustomMessage("Not logged in.", true);

    if (!window.confirm("Are you sure you want to approve this spot? It will immediately go live on the map.")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/approve/${spotId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showCustomMessage('Spot approved successfully and is now live!');
            const { spotName, submittedEmail } = data.spotDetails; 
                
            await fetch(`${API_BASE_URL}/email/spot_approved`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ spotName, submittedEmail })
            });

            fetchAndRenderSpots(); 
        } else {
            showCustomMessage(data.error || "Approval failed.", true);
        }
    } catch (error) {
        console.error(`Error during approval:`, error);
        showCustomMessage("Server error during approval.", true);
    }
}

async function deleteSpot(spotId) {
    const token = sessionStorage.getItem('authToken');
    if (!token) return showCustomMessage("Not logged in.", true);

    if (!window.confirm("Are you sure you want to permanently delete this spot?")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/delete/${spotId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok) {
            showCustomMessage(data.message || 'Spot deleted successfully.');
            fetchAndRenderSpots(); 
        } else {
            showCustomMessage(data.error || "Deletion failed.", true);
        }
    } catch (error) {
        console.error("Error deleting spot:", error);
        showCustomMessage("Server error during deletion.", true);
    }
}

async function fetchAndRenderUsers() {
    const userTableBody = document.getElementById('user-table-body');
    if (!userTableBody) return; 

    const token = sessionStorage.getItem('authToken');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const users = await response.json();
        userTableBody.innerHTML = '';

        if (users.length === 0) {
            userTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4">No users found.</td></tr>';
            return;
        }

        users.forEach(user => {
            const row = userTableBody.insertRow();
            row.innerHTML = `
                <td class="px-6 py-4">${user.id}</td>
                <td class="px-6 py-4">${user.email}</td>
                <td class="px-6 py-4">${user.role}</td>
            `;
        });

    } catch (error) {
        console.error("Failed to fetch users:", error);
        showCustomMessage("Failed to fetch user list. Check server logs.", true);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.approveSpot = approveSpot;
    window.deleteSpot = deleteSpot;

    if (checkAdminAccess()) {
        fetchAndRenderSpots();
        fetchAndRenderUsers();
    }
});