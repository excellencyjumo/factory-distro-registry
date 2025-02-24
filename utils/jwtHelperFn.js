const jwt = require('jsonwebtoken');

const signToken = email => {
    return jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });
  };

const verifyToken = token => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { signToken, verifyToken };