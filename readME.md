# Halal Finder - Community Spot Mapping Application

## Halal Finder - Community Spot Mapping Application
Halal Finder is a community-driven web application designed to help users locate and discover approved halal food and facility spots on a map. Users can submit new locations, which are then subject to approval by an administrator before appearing live on the map.

---

## Key Features  
| Module         | Functionality                                                                 |
|----------------|--------------------------------------------------------------------------------|
| **User Authentication**   | Secure sign-up and login for users to submit new spots.      |
| **Spot Submission**     | Authenticated users can submit new Halal spots, including location details, rating, and an optional image.  |
| **Admin Approval Queue**      | All submitted spots are placed in a queue and must be explicitly approved by an admin before being publicly visible.              |
| **Interactive Map** | Displays all approved Halal spots using geographical coordinates (Lat/Lng).        |
| **Filtering and Searching** | Allows users to filter spots by type (e.g., Restaurant, Butcher, Mosque) and search by name or address.        |
| **Email Notifications** | Sends automated emails to users upon submission and successful approval of their spots.        |

---

## Tech Stack  
| Layer           | Technology                                                                 |
|-----------------|----------------------------------------------------------------------------|
| **Frontend**    | HTML, CSS                       |
| **Backend**     | Node.js (Express)                                                         |
| **Database**    | MySQL                                                                     |
| **Auth**        | JWT-based Authentication + bcrypt for password hashing                    |
| **Mapping Library**    | Leaflet                                                                  |

---

## Project Structure

```
Halal-Finder/
├── routes/         # Route handlers
├── views/          # EJS templates
├── public/         # Static files (CSS, images, JS)
    └── uploads/
├── main.js          # Express entry point
├── db.js
├── middleWare/ 
└── .env            # Environment variables
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed:

- Node.js
- MySQL
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/tilaatalarry/Halal-Finder.git

# Navigate into the project directory
cd Halal-Finder

# Install backend dependencies
npm install express mysql2 dotenv jsonwebtoken bcryptjs nodemailer multer cors
```

### Setting up the Database

1. Create a MySQL database.
2. Import any provided schema (or configure your own tables).
3. Create a `.env` file and set the following:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=halal_finder
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
ADMIN_EMAIL=your_admin_email@gmail.com
ADMIN_PASSWORD=your_admin_password
```
---

## Running the Project

```bash
# Start in production
node server.js
The appication will be accessible at http:://localhost:5000 (or the port specified in your .env file)
```

---

## Admin Access
1. To access the admin panel, you must manually update a user's role in the database.
2. Register a user through the application.
3. Run the following SQL command to elevate their privileges:
4. UPDATE users SET role = 'admin' WHERE email = 'the_registered_email@example.com';
---

## Testing

```bash
# Run tests (if set up)
npm test
```

*You can also use Thunder Client to test the APIs manually.*

---

## Future Improvements

- Reviews/Comments on Spots
- Deployment automation
