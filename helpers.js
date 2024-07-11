const getUserByEmail = function(email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user]; 
    }
  }
};

module.exports = getUserByEmail;