const assert = require('assert');

const getUserByEmail = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";

    assert.deepStrictEqual(user.id, expectedUserID, 'Returned user should match expected user object');
  });

    it('should return undefined for non-existent email', function() {
      const nonExistentUser = getUserByEmail("nonexistent@example.com", testUsers);
      assert.strictEqual(nonExistentUser, undefined, 'User should be undefined for non-existent email');
  });
});
