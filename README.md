# Barcode Scanner Web App

Mobile-friendly barcode scanner with React frontend and Python FastAPI backend. Supports user authentication, image capture with Azure Blob Storage, and admin management including shipping lists.

## Features

### Authentication
- User registration (first name, last name, email, password, department)
- User login with email and password
- Password change functionality
- Role-based access (Admin/User)

### Barcode Scanning
- Mobile camera access
- Desktop: Camera or Screen Capture options
- 1D barcode detection (EAN, Code 128, Code 39, UPC)
- Real-time barcode scanning with QuaggaJS

### Image Capture
- Capture photos via camera or screen
- Manual barcode entry
- Save image to Azure Blob Storage and its URL to the database
- Auto-generated timestamp
- Image preview and gallery functionality

### User Features
- View personal records (My Info page)
- Search records by barcode (manual input or camera scan)
- Change password

### Admin Features
- User management (CRUD operations)
- View all users' records
- Search all records by barcode
- Shipping list management
- Cannot delete/edit self

### UI/UX Improvements
- Enhanced table readability with borders and zebra-striping.
- Context-aware back navigation for a smoother user experience.
- Restyled buttons for a consistent and modern look.

## Tech Stack

**Backend:**
- Python FastAPI
- MySQL Database
- PyMySQL connector
- Azure Blob Storage (for image storage)

**Frontend:**
- React 18
- Vite
- QuaggaJS (barcode scanning)

## Database Schema

### `barcode_user` Table
- `id` (Primary Key)
- `email` (Unique)
- `password`
- `first_name`
- `last_name`
- `department` (INT, nullable for admin)
- `role` (1=Admin, 2=User)
- `created_at` (Timestamp)

### `shipping_lists` Table
- `id` (Primary Key)
- `list_name` (Unique)
- `uploaded_by_email` (Foreign Key to `barcode_user.email`)
- `upload_date` (Timestamp)

### `Barcode_Info` Table
- `id` (Primary Key)
- `images` (JSON - stores URLs of images in Azure Blob Storage, and other image metadata)
- `barcode` (VARCHAR)
- `date` (Timestamp - auto-generated)
- `full_name` (VARCHAR)
- `department` (INT)
- `email` (Foreign Key to `barcode_user.email`)
- `customer_name` (VARCHAR)
- `expected_ship_date` (DATE)
- `bol_number` (VARCHAR)
- `shipping_list_id` (INT, Foreign Key to `shipping_lists.id`, nullable)

## Setup

### Backend
1.  Navigate to the `backend` directory: `cd backend`
2.  Install dependencies: `pip install -r requirements.txt`
3.  Create a `.env` file in the `backend` directory based on `.env.example`.
    *   `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` for MySQL connection.
    *   `AZURE_STORAGE_CONNECTION_STRING` and `AZURE_STORAGE_CONTAINER_NAME` for Azure Blob Storage.
4.  The database schema will be automatically initialized on startup, creating necessary tables and a default admin user if they don't exist.
5.  Run the server: `uvicorn main:app --host 0.0.0.0 --port 8000`

### Frontend
1.  Navigate to the `frontend` directory: `cd frontend`
2.  Install dependencies: `npm install`
3.  Run the development server: `npm run dev`

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `PUT /api/change-password` - Change password

### Barcode Operations
- `POST /api/barcode` - Save scanned barcode
- `GET /api/barcodes` - Get all barcode scans
- `POST /api/barcode/add-image` - Save image with barcode to Azure Blob Storage
- `GET /api/barcode/images/{barcode}` - Get all images for a specific barcode
- `POST /api/barcode/delete-image` - Delete an image from Azure Blob Storage and database
- `GET /api/my-info?email={email}` - Get user's records

### Admin Operations
- `GET /api/admin/users` - Get all users
- `DELETE /api/admin/users/{id}` - Delete user
- `PUT /api/admin/users/{id}` - Update user
- `GET /api/admin/all-info` - Get all Barcode_Info records
- `POST /api/shipping-lists` - Create a new shipping list
- `GET /api/shipping-lists` - Get all shipping lists
- `DELETE /api/shipping-lists/{list_id}` - Delete a shipping list

## Deployment on Render.com

### Backend (Web Service)
1. Create new Web Service
2. Connect your repository
3. Root Directory: `backend`
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add Environment Variables:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `AZURE_STORAGE_CONNECTION_STRING`
   - `AZURE_STORAGE_CONTAINER_NAME`

### Frontend (Static Site)
1. Create new Static Site
2. Connect your repository
3. Root Directory: `frontend`
4. Build Command: `npm install && npm run build`
5. Publish Directory: `dist`
6. Add Environment Variable: `VITE_API_URL` = your backend URL

## Usage

### For Users
1. Register account with email, password, name, and department
2. Login with credentials
3. **Main Page Options:**
   - Barcode Scanner: Scan barcodes with camera/screen
   - Image Capture: Take photo + enter barcode + save
   - My Info: View your saved records
   - Change Password: Update your password
4. **Search:** Use barcode search (manual or camera) in My Info page

### For Admin
1. Login with admin credentials
2. Access Admin Panel button
3. **User Management Tab:**
   - View all users
   - Edit user details (except self)
   - Delete users (except self)
4. **All Info Tab:**
   - View all users' captured images and barcodes
   - Search by barcode (manual or camera)
5. **Shipping Lists Tab:**
   - Manage (create, view, delete) shipping lists

## Project Structure
```
Barcode/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── database.py          # Database connection & schema
│   ├── services.py          # Azure Blob Storage interactions
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main application component & navigation
│   │   ├── Login.jsx        # Login page
│   │   ├── Register.jsx     # Registration page
│   │   ├── BarcodeScanner.jsx    # Barcode scanning component
│   │   ├── ImageCapture.jsx      # Image capture component
│   │   ├── MyInfo.jsx            # User info page
│   │   ├── AdminPanel.jsx        # Admin panel
│   │   ├── ImageGalleryModal.jsx # Displays and manages images for a barcode
│   │   ├── BarcodeSearch.jsx     # Search component
│   │   ├── ChangePassword.jsx    # Password change
│   │   └── App.css               # Styles
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## License
ISC
