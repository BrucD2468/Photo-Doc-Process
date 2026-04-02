## 1. Project Overview

This project implements a web application with user authentication, barcode scanning, record management, and an administrative panel for user and data management.

## 2. Getting Started
1.  Register: If you are a new user, navigate to the registration page and create an account.
2.  Login: Use your registered credentials to log in to the application.

## 3. Main Features

### 3.1 Adding New Barcode Records
1.  Click on the "Add New Record" button in MyInfo page
2.  Enter Barcode:
   -In the modal, you can type the barcode number directly into the "Barcode Number" field.
   -Or click the "Scan barcode" button (camera icon) to activate the barcode scanner.
 In this case, you must allow camera access for the scanner to function.
 Point your device's camera at a barcode. The scanner will attempt to detect and decode it in real-time.
   -Click "Next" to proceed. If the field is empty, an error message will appear: "Please enter or scan a barcode."
3.  Capture Images for New Record: After entering or scanning a barcode, an image capture modal will appear.
    -You can choose to use your camera (📷) or capture your screen (🖥️) to take photos.
    -Click the capture button (📸) to take a photo. You can capture multiple images (up to 10).
    -If you make a mistake, you can delete individual images (✖️ on the image thumbnail) or clear all captured images (🗑️).
    -Once you have captured all desired images, click the "Save Record" button to finalize the new barcode record with its associated images.
    -You can also close the image capture modal without saving to cancel the new record creation.

### 3.2 Viewing and Managing Your Records (My Info)
On the "My Info" page, you can:
-   View all barcode records you have added.
-   Search for specific records using the search bar.
-   Upload CSV files containing barcode data.
-   Capture images associated with existing barcode records.
-   Manage images for individual records by clicking the "🖼️" (Manage Images) button.
-   Delete your own barcode records.

### 3.3 Admin Panel Functionality(For Admin)
If you have an Admin role, you can access the Admin Panel to perform additional management tasks.
2.  User Management Tab:
    *   View Users: See a list of all registered users, their emails, names, departments, and roles.
    *   Edit User: Click the "✏️" (Edit) button next to a user to modify their details.
    *   Delete User: Click the "🗑️" (Delete) button next to a user to remove their account.
3.  All Info Tab:
    *   View All Records: See all barcode records submitted by all users.
    *   Search Records: Search through all records.
    *   Manage Images: Click the "🖼️" (Manage Images) button to view or delete images associated with any record.
    *   Delete Barcode Record: Delete any barcode record from the system.
