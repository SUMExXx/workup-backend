const multer = require('multer');

module.exports.storage = multer({ storage: multer.memoryStorage() });