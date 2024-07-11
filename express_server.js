// Import the necessary modules
const express = require("express");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session')
const app = express();
const PORT = 8080; // Set the port to 8080

// Sample databases (for demonstration)
const urlDatabase = {
  b2xVn2: {
    longURL: "http//:www.lighthouselabs.ca",
    userID:  "user@FBI.com",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID:  "ashWilliamsID",
  }

};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
};

// Middleware: Functions that run before route handlers
app.set("view engine", "ejs"); // Set EJS as the templating engine
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies (from forms)
app.use(express.json()); // Parse JSON bodies (from AJAX requests)
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));; // Parse cookies

// Helper functions

// Generates a random 6-character string
const generateRandomString = () =>
  Array.from({ length: 6 }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      .charAt(Math.floor(Math.random() * 62))
  ).join('');

// Finds a user by their email address in the users database
const getUserByEmail = (email) => {
  for (const userID in users) {
    if (users[userID].email === email) {
      return users[userID];
    }
  }
  return null;
};

// Gets the user object associated with the cookie
const userCookieId = (req) => {
  const userID = req.session.user_id;
  return users[userID] || null;
};

// Returns the URLs where the userID matches the given id
const urlsForUser = (id) => {
  const userUrls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
};

// Routes

// Display the registration page
app.get('/register', (req, res) => {
  const user = userCookieId(req); // Get the logged-in user
  if (user) {
    return res.redirect("/urls"); // If logged in, redirect to URLs page
  }
  res.render('register', { user: null }); // Render the registration page
});

// Handle registration form submission
app.post('/register', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email and password cannot be empty'); // Validate input
  }

  if (getUserByEmail(email)) {
    return res.status(400).send('Email already registered'); // Check if email is already registered
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const userID = generateRandomString(); // Generate a new user ID
  const newUser = { id: userID, email, password: hashedPassword }; // Create new user object
  users[userID] = newUser; // Add new user to the users database

  
  req.session['user_id'] = userID; // Set a cookie with the user ID
  res.redirect('/urls'); // Redirect to URLs page
});

// Display the login page
app.get('/login', (req, res) => {
  const user = userCookieId(req); // Get the logged-in user
  if (user) {
    return res.redirect("/urls"); // If logged in, redirect to URLs page
  }
  res.render('login', { user: null }); // Render the login page
});

// Handle login form submission
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email); // Find user by email

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Invalid credentials");
  }

 req.session['user_id'] = userID; // Set a cookie with the user ID
  res.redirect('/urls'); // Redirect to URLs page
});

// Handle logout
app.post('/logout', (req, res) => {
  req.session['user_id'] = null; // Clear the user ID cookie
  res.redirect('/login'); // Redirect to login page
});

// Display the URLs page
app.get("/urls", (req, res) => {
  const user = userCookieId(req); // Get the logged-in user
  if (!user) {
    return res.send("<html><body>Please <a href='/login'>log in</a> or <a href='/register'>register</a> first.</body></html>"); // If not logged in, show message
  }
  const userUrls = urlsForUser(user.id); // Get URLs for the logged-in user
  res.render("urls_index", { urls: userUrls, user }); // Render URLs page
});

// Display the page to create a new URL
app.get("/urls/new", (req, res) => {
  const user = userCookieId(req); // Get the logged-in user
  if (!user) {
    return res.redirect('/login'); // If not logged in, redirect to login page
  }
  res.render("urls_new", { user }); // Render new URL page
});

// Handle new URL creation
app.post("/urls", (req, res) => {
  const user = userCookieId(req); // Get the logged-in user
  if (!user) {
    return res.status(403).send("User must be logged in"); // Check if user is logged in
  }
  const longURL = req.body.longURL; // Get the long URL from the form
  const shortURL = generateRandomString(); // Generate a new short URL
  urlDatabase[shortURL] = { longURL, userID: user.id }; // Add to the URL database
  res.redirect(`/urls/${shortURL}`); // Redirect to the new URL's page
});

// Display a specific URL's details
app.get("/urls/:id", (req, res) => {
  const user = userCookieId(req); // Get the logged-in user
  const id = req.params.id; // Get the URL ID from the route
  const url = urlDatabase[id]; // Get the URL details from the database

  if (!user) {
    return res.status(403).send("<html><body>Please <a href='/login'>log in</a> to view this URL.</body></html>"); // Check if user is logged in
  }

  if (!url) {
    return res.status(404).send("<html><body>URL not found.</body></html>"); // Check if URL exists
  }

  if (url.userID !== user.id) {
    return res.status(403).send("<html><body>You do not have permission to view this URL.</body></html>"); // Check if user owns the URL
  }

  res.render("urls_show", { user, id, longURL: url.longURL }); // Render the URL details page
});

// Redirect to the long URL when short URL is visited
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id; // Get the short URL ID from the route
  const longURL = urlDatabase[shortURL] && urlDatabase[shortURL].longURL; // Get the long URL from the database

  if (longURL) {
    res.redirect(longURL); // Redirect to the long URL
  } else {
    res.status(404).send("ShortURL not found"); // Send error if short URL does not exist
  }
});

// Display the edit page for a URL
app.get("/urls/:id/edit", (req, res) => {
  const user = userCookieId(req); // Get the logged-in user
  const editId = req.params.id; // Get the URL ID from the route
  const url = urlDatabase[editId]; // Get the URL details from the database

  if (!user) {
    return res.status(403).send("<html><body>Please <a href='/login'>log in</a> to edit this URL.</body></html>"); // Check if user is logged in
  }

  if (!url) {
    return res.status(404).send("<html><body>URL not found.</body></html>"); // Check if URL exists
  }

  if (url.userID !== user.id) {
    return res.status(403).send("<html><body>You do not have permission to edit this URL.</body></html>"); // Check if user owns the URL
  }

  res.render("edit-form", { user, editId, urlDatabase: url }); // Render the edit URL page
});

// Handle URL updates
app.post('/urls/:id', (req, res) => {
  const user = userCookieId(req); // Get the logged-in user
  const id = req.params.id; // Get the URL ID from the route
  const newLongURL = req.body.longURL; // Get the new long URL from the form
  const url = urlDatabase[id]; // Get the URL details from the database

  if (!url) {
    return res.status(404).send("URL not found"); // Check if URL exists
  }

  if (!user) {
    return res.status(403).send("Please log in to update this URL"); // Check if user is logged in
  }

  if (url.userID !== user.id) {
    return res.status(403).send("You do not have permission to update this URL"); // Check if user owns the URL
  }

  urlDatabase[id].longURL = newLongURL; // Update the long URL in the database
  res.redirect('/urls'); // Redirect to the URLs page
});

// Handle URL deletions
app.post('/urls/:id/delete', (req, res) => {
  const user = userCookieId(req); // Get the logged-in user
  const id = req.params.id; // Get the URL ID from the route
  const url = urlDatabase[id]; // Get the URL details from the database

  if (!url) {
    return res.status(404).send("URL not found"); // Check if URL exists
  }

  if (!user) {
    return res.status(403).send("Please log in to delete this URL"); // Check if user is logged in
  }

  if (url.userID !== user.id) {
    return res.status(403).send("You do not have permission to delete this URL"); // Check if user owns the URL
  }

  delete urlDatabase[id]; // Delete the URL from the database
  res.redirect('/urls'); // Redirect to the URLs page
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`); // Log that the server is running
});
