import express from "express";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from 'url';
import XLSX from 'xlsx'; 
import mongoose from "mongoose";
import multer from "multer"; // Import multer for file uploads
import fs from "fs"; // Import filesystem for folder creation
import { Collection } from "./public/models/collection.js";

const app = express();
const port = 3000;

// Set up __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware setup
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set the view engine to EJS
app.set("view engine", "ejs");

// Set up Multer storage using the path 'public/labels/<username>/'
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userName = req.body.name; // Get the user's name from the form submission
        const dir = path.join(__dirname, 'public', 'labels', userName); // Create a folder named after the user inside 'public/labels'

        // Check if the directory exists, if not, create it
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir); // Set the destination to the user's folder inside 'public/labels'
    },
    filename: (req, file, cb) => {
        // Save the files as 1.png and 2.png based on the field name
        if (file.fieldname === 'photo1') {
            cb(null, '1.png');
        } else if (file.fieldname === 'photo2') {
            cb(null, '2.png');
        }
    }
});

const upload = multer({ storage: storage });

// Routes
app.get('/', (req, res) => {
    res.render('login');
});

app.get('/SignUp', (req, res) => {
    res.render('SignUp');
});

// Handle sign-up form submission with image upload
app.post('/SignUp', upload.fields([{ name: 'photo1', maxCount: 1 }, { name: 'photo2', maxCount: 1 }]), async (req, res) => {
    let name = req.body.name;
    let contact = req.body['ph-number'];
    let password1 = req.body.password;
    let password2 = req.body['confirm-password'];

    try {
        // Check if the user already exists
        const checking = await Collection.findOne({ Name: name });

        if (checking) {
            if (checking.Name === name && checking.Password === password1) {
                return res.send("User Already Exists!");
            }
        }

        // Check if the passwords match
        if (password1 !== password2) {
            return res.status(400).send("Passwords do not match!");
        }

        // Insert user data into the database
        let Data = new Collection({
            Name: name,
            ContactNo: contact,
            Password: password1
        });
        await Data.save();
        console.log("User data inserted successfully");

        res.status(201).render("login");

    } catch (error) {
        console.error("Error during sign-up:", error);
        res.status(500).send("An error occurred during sign-up");
    }
});

// Handle login form submission
app.post('/login', async (req, res) => {
    let contact = req.body['ph-number'];
    let password = req.body.password;

    try {
        // Check if the user exists and the password is correct
        const checking = await Collection.findOne({ ContactNo: contact });
        if (checking && checking.Password === password) {
            // Send the user's name back to the client
            return res.render('index', { userName: checking.Name });
        } else {
            return res.status(401).send("Incorrect Password");
        }
    } catch (error) {
        return res.status(404).send("User details not found");
    }
});
function writeToExcel(userName, checkInTime, checkOutTime = null) {
    const filePath = path.join(__dirname, 'attendance.xlsx');
    let workbook;
    let worksheet;

    console.log("writeToExcel called for", userName, "checkInTime:", checkInTime, "checkOutTime:", checkOutTime);

    // If the Excel file already exists, read it
    if (fs.existsSync(filePath)) {
        console.log("File exists. Reading file...");
        workbook = XLSX.readFile(filePath);
        worksheet = workbook.Sheets["Attendance"];
    } else {
        console.log("File does not exist. Creating a new workbook...");
        workbook = XLSX.utils.book_new();
        worksheet = XLSX.utils.aoa_to_sheet([["Name", "Date", "Check-In Time", "Check-Out Time"]]);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    }

    // If no Attendance sheet exists, create one
    if (!worksheet) {
        console.log("Attendance sheet does not exist. Creating a new one...");
        worksheet = XLSX.utils.aoa_to_sheet([["Name", "Date", "Check-In Time", "Check-Out Time"]]);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    }

    const now = new Date();
    const date = now.toLocaleDateString();

    if (checkInTime) {
        console.log("Logging check-in for", userName);
        const newRecord = [userName, date, checkInTime, ""];
        XLSX.utils.sheet_add_aoa(worksheet, [newRecord], { origin: -1 });
    } else if (checkOutTime) {
        console.log("Logging check-out for", userName);
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        let updated = false;

        // Go through the rows in reverse order to find the most recent check-in with no check-out
        for (let row = range.e.r; row > range.s.r; row--) {
            const nameCell = worksheet[`A${row + 1}`]; // Assuming column A has names
            const checkInCell = worksheet[`C${row + 1}`]; // Assuming column C has check-in times
            const checkOutCell = worksheet[`D${row + 1}`]; // Assuming column D has check-out times

            // Check for the user with a valid check-in but no check-out
            if (nameCell && nameCell.v === userName && checkInCell && !checkOutCell.v) {
                console.log("Found the most recent check-in record, updating check-out time");
                worksheet[`D${row + 1}`] = { t: 's', v: checkOutTime }; // Column D for check-out
                updated = true;
                break;
            }
        }

        if (!updated) {
            console.error("No matching check-in found for user:", userName);
        }
    }

    // Write the updated workbook to the file
    XLSX.writeFile(workbook, filePath);
    console.log("Excel file updated successfully.");
}



// Handle Check-In
app.post('/checkIn', (req, res) => {
    const userName = req.body.userName;
    const now = new Date();
    const checkInTime = now.toLocaleTimeString();

    // Write check-in data to Excel
    writeToExcel(userName, checkInTime);

    res.status(200).send({ message: 'Checked In!', checkInTime: checkInTime });
});

// Handle Check-Out
app.post('/checkOut', (req, res) => {
    const userName = req.body.userName;
    const now = new Date();
    const checkOutTime = now.toLocaleTimeString();

    // Check if the user has checked in before checking out
    const filePath = path.join(__dirname, 'attendance.xlsx');
    if (!fs.existsSync(filePath)) {
        return res.status(404).send("No attendance records found.");
    }

    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    let checkedIn = false;

    for (let row = range.s.r + 1; row <= range.e.r; row++) {
        const cell = worksheet[`A${row + 1}`]; // Assuming column A has names
        if (cell && cell.v === userName && worksheet[`C${row + 1}`]) { // Check for existing check-in
            checkedIn = true;
            break;
        }
    }

    if (!checkedIn) {
        return res.status(400).send("You must check in before checking out.");
    }

    // Update check-out data to Excel
    writeToExcel(userName, null, checkOutTime);

    res.status(200).send({ message: 'Checked Out!', checkOutTime: checkOutTime });
});

// Route to get the user name (could be useful for your front-end)
app.post('/getUserName', (req, res) => {
    const userName = req.body.userName; // You could use sessions or a different approach to pass the userName
    res.json({ name: userName });
});

// Start the server
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});



