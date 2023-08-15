const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

mongoose.connect("mongodb+srv://dbUser:<jollY2811>senecaweb.d1dxh9n.mongodb.net/assignment6?retryWrites=true&w=majority");

const userSchema = new Schema({
  userName: String,
  password: String,
  email: String,
  loginHistory: [{ dateTime: String, userAgent: String }]
});

let User;

module.exports.initialize = function () {
  return new Promise(function (resolve, reject) {
    const db = mongoose.createConnection("connectionString");

    db.on('error', (err) => {
      reject(err);
    });
    db.once('open', () => {
      User = db.model("users", userSchema);
      resolve();
    });
  });
};

module.exports.registerUser = function (userData) {
  return new Promise(async function (resolve, reject) {
    if (userData.password !== userData.password2) {
      reject("Passwords do not match");
    } else {
      try {
        const newUser = new User(userData);
        const hash = await bcrypt.hash(userData.password, 10);
        newUser.password = hash; // Replace password with hashed version
        await newUser.save();
        resolve();
      } catch (err) {
        if (err.code === 11000) {
          reject("User Name already taken");
        } else {
          reject(`There was an error creating the user: ${err}`);
        }
      }
    }
  });
};

module.exports.checkUser = function (userData) {
  return new Promise(async function (resolve, reject) {
    try {
      const users = await User.find({ userName: userData.userName });
      if (users.length === 0) {
        reject(`Unable to find user: ${userData.userName}`);
      } else {
        const match = await bcrypt.compare(userData.password, users[0].password);
        if (match) {
          users[0].loginHistory.push({
            dateTime: new Date().toString(),
            userAgent: userData.userAgent
          });
          const updateResult = await User.updateOne(
            { userName: users[0].userName },
            { $set: { loginHistory: users[0].loginHistory } }
          );
          if (updateResult.nModified !== 1) {
            reject(`There was an error verifying the user: ${updateResult}`);
          } else {
            resolve(users[0]);
          }
        } else {
          reject(`Incorrect Password for user: ${userData.userName}`);
        }
      }
    } catch (err) {
      reject(`Unable to find user: ${userData.userName}`);
    }
  });
};
