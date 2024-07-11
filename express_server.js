const express = require("express");
const cookieParser = require('cookie-parser');
const PORT = 8080; // default port 8080

const app = express();
app.set("view engine", "ejs");
app.use(cookieParser());

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
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

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

app.get("/urls", (req, res) => {
  const user = userCookieId(req);
  if (!user) {
    return res.redirect("/login");
  }
  const templateVars = { urls: urlDatabase, user: user };
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

app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];
  const user = userCookieId(req)
  const templateVars = {
    user: user,
    id: id,
    longURL: longURL,
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send("ShortURL not found");
  }
});

app.post("/urls", (req, res) => {
  const user = userCookieId(req);
  if (!user) {
    return res.status(403).send("You must be logged in to create a new URL");
  }

  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:id/delete', (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect('/urls');
});

app.post('/urls/:id/update', (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.longURL;
  urlDatabase[id] = newLongURL;
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const user = getUserByEmail(email);

  if (!user) {
    return res.status(403).send("Invalid Email");
  }
  if (user.password !== password) {
    return res.status(403).send("Incorrect password");
  }

  res.cookie('user_id', user.id);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

app.get("/urls/:id/edit", (req, res) => {
  const editId = req.params.id;

  const templateVars = {
    editId: editId,
    urlDatabase: urlDatabase[editId],
  };
  res.render("edit-form", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port: ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

