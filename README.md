# Check-In / Check-Out System

A web-based attendance management system that uses facial recognition technology to securely manage employee check-in and check-out records. The application verifies the user's face before allowing attendance to be marked, ensuring a secure and automated attendance process.

---

## Features

- User Registration & Login
- Face Recognition Authentication
- Secure Check-In & Check-Out
- Real-Time Webcam Detection
- Attendance Record Management
- MongoDB Database Integration
- Responsive User Interface
- Attendance History Display

---

## Technologies Used

### Frontend
- HTML5
- CSS3
- JavaScript
- Face-api.js

### Backend
- Node.js
- Express.js

### Database
- MongoDB
- Mongoose

---

## Project Structure

```
check-in-out-main/
│
├── public/
│   ├── css/
│   ├── js/
│   ├── models/
│   └── images/
│
├── views/
├── package.json
├── main.js
└── README.md
```

---

## Installation

### Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/Check-In-Out-System.git
```

### Navigate to project directory

```bash
cd Check-In-Out-System
```

### Install dependencies

```bash
npm install
```

### Start MongoDB

Ensure MongoDB is running locally.

### Run the project

```bash
node main.js
```



## How It Works

1. Register a new user.
2. Capture facial images.
3. Login using credentials.
4. Webcam starts automatically.
5. Face Recognition verifies the user.
6. User can Check-In or Check-Out only after successful face verification.
7. Attendance is stored in MongoDB.

---

## Security Features

- Face Verification before attendance
- Login Authentication
- Database Storage using MongoDB
- Prevents unauthorized attendance marking
