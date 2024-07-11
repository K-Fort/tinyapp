const express = require("express");
const cookieParser = require('cookie-parser');
const PORT = 8080; // default port 8080

const app = express();
app.set("view engine", "ejs");
app.use(cookieParser());

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const userCookieId = function(req) {
  const userID = req.cookies["user_id"];
  return users[userID] || null;
};

// Function to generate a random string of 6 alphanumeric characters
const generateRandomString = () =>
  Array.from({ length: 6 }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      .charAt(Math.floor(Math.random() * 62))
  ).join('');

// Function to return URLs for a given user ID
const urlsForUser = (id) => {
  const userUrls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
};

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Registration routes

app.get('/register', (req, res) => {
  const user = userCookieId(req);
  if (user) {
    return res.redirect("./urls");
  }
  const templateVars = {
    user: user,
  };
  res.render('register', templateVars);
});

const getUserByEmail = (email, users) => {
  for (const userID in users) {
    if (users[userID].email === email) {
      return users[userID];
    }
  }
  return undefined;
};

app.post('/register', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email and password cannot be empty');
  }

  const existingUser = getUserByEmail(email, users);
  if (existingUser) {
    return res.status(400).send('Email already registered');
  }

  const userID = generateRandomString();

  const newUser = {
    id: userID,
    email: email,
    password: password,
  };

  users[userID] = newUser;

  res.cookie('user_id', userID);
  console.log(users);

  res.redirect('/urls');
});

// Login routes

app.get('/login', (req, res) => {
  const user = userCookieId(req);
  if (user) {
    return res.redirect("./urls");
  }
  const templateVars = {
    user: user,
  };
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const user = getUserByEmail(email, users);

  if (!user) {
    return res.status(403).send("Invalid Email");
  }
  if (user.password !== password) {
    return res.status(403).send("Incorrect password");
  }

  res.cookie('user_id', user.id);
  res.redirect('/urls');
});

// Logout route

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

// URLs routes

app.get("/urls", (req, res) => {
  const user = userCookieId(req);
  if (!user) {
    return res.send("<html><body>Please <a href='/login'>log in</a> or <a href='/register'>register</a> first.</body></html>");
  }

  const userUrls = urlsForUser(user.id);

  const templateVars = {
    urls: userUrls,
    user: user,
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user = userCookieId(req);
  if (!user) {
    return res.redirect('/login');
  }
  const templateVars = {
    user: user,
  };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const user = userCookieId(req);
  if (!user) {
    return res.status(403).send("User must be logged in");
  }

  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: user.id,
  }
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const user = userCookieId(req);

  if (!user) {
    return res.status(403).send("<html><body>Please <a href='/login'>log in</a> to view this URL.</body></html>");
  }

  const url = urlDatabase[id];

  if (!url) {
    return res.status(404).send("<html><body>URL not found.</body></html>");
  }

  if (url.userID !== user.id) {
    return res.status(403).send("<html><body>You do not have permission to view this URL.</body></html>");
  }

  const templateVars = {
    user: user,
    id: id,
    longURL: url.longURL,
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL] && urlDatabase[shortURL].longURL;

  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send("ShortURL not found");
  }
});

app.get("/urls/:id/edit", (req, res) => {
  const editId = req.params.id;
  const user = userCookieId(req);

  if (!user) {
    return res.status(403).send("<html><body>Please <a href='/login'>log in</a> to edit this URL.</body></html>");
  }

  const url = urlDatabase[editId];

  if (!url) {
    return res.status(404).send("<html><body>URL not found.</body></html>");
  }

  if (url.userID !== user.id) {
    return res.status(403).send("<html><body>You do not have permission to edit this URL.</body></html>");
  }

  const templateVars = {
    editId: editId,
    urlDatabase: url,
    user: user,
  };
  res.render("edit-form", templateVars);
});

app.post('/urls/:id', (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.longURL;
  const user = userCookieId(req);

  if (!urlDatabase[id]) {
    return res.status(404).send("URL not found");
  }

  if (!user) {
    return res.status(403).send("Please log in to update this URL");
  }

  if (urlDatabase[id].userID !== user.id) {
    return res.status(403).send("You do not have permission to update this URL");
  }

  urlDatabase[id].longURL = newLongURL;
  res.redirect('/urls');
});

app.post('/urls/:id/delete', (req, res) => {
  const id = req.params.id;
  const user = userCookieId(req);

  if (!urlDatabase[id]) {
    return res.status(404).send("URL not found");
  }

  if (!user) {
    return res.status(403).send("Please log in to delete this URL");
  }

  if (urlDatabase[id].userID !== user.id) {
    return res.status(403).send("You do not have permission to delete this URL");
  }

  delete urlDatabase[id];
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});