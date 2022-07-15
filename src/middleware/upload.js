const util = require("util");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const dbConfig = require("../config/db");

var storage = new GridFsStorage({
  url: dbConfig.url + dbConfig.database,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    const match = ["image/png", "image/jpeg", "application/pdf"];
    const splitName = file.originalname.toLowerCase().split(' ').join('_');

    if (match.indexOf(file.mimetype) === 2) {
      return {
        bucketName: dbConfig.pdfBucket,
        filename: `${Date.now()}-raycorp-${splitName}`
      };
    } else if (match.indexOf(file.mimetype) === 0 || match.indexOf(file.mimetype) === 1) {
      return {
        bucketName: dbConfig.imgBucket,
        filename: `${Date.now()}-raycorp-${splitName}`
      };
    } else {
      const filename = `${Date.now()}-raycorp-${splitName}`;
      return filename;
    }
  }
});

var uploadFiles = multer({ storage: storage }).array("file", 10);
// var uploadFiles = multer({ storage: storage }).single("file");
var uploadFilesMiddleware = util.promisify(uploadFiles);
module.exports = uploadFilesMiddleware;
