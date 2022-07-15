const upload = require("../middleware/upload");
const dbConfig = require("../config/db");

const MongoClient = require("mongodb").MongoClient;
const GridFSBucket = require("mongodb").GridFSBucket;

const url = dbConfig.url;

const baseUrl = "http://localhost:8080/";

const mongoClient = new MongoClient(url);

const uploadFiles = async (req, res) => {
  try {
    await upload(req, res);
    // console.log(req.files);

    if (req.files.length <= 0) {
      return res
        .status(400)
        .send({ message: "You must select at least 1 file." });
    }

    return res.status(200).send({
      message: "Files have been uploaded.",
    });

  } catch (error) {
    console.log(error);

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).send({
        message: "Too many files to upload.",
      });
    }
    return res.status(500).send({
      message: `Error when trying upload many files: ${error}`,
    });

    // return res.send({
    //   message: "Error when trying upload image: ${error}",
    // });
  }
};

const getListFiles = async (req, res) => {
  try {
    await mongoClient.connect();

    const database = mongoClient.db(dbConfig.database);
    const images = database.collection(dbConfig.imgBucket+".files");
    const pdf = database.collection(dbConfig.pdfBucket+".files");

    const countCursor = images.estimatedDocumentCount()
    const cursor = images.find({ });

    const countCursorPdf = pdf.estimatedDocumentCount()
    const cursorPdf = pdf.find({ });

    if ((await countCursor === 0) && (await countCursorPdf === 0)) {
      return res.status(500).send({
        message: "No image/photos/pdf found!",
      });
    }

    let fileInfos = [];
    if ((await countCursor != 0)) {
      await cursor.forEach((doc) => {
        fileInfos.push({
          name: doc.filename,
          url: baseUrl + 'img/' + doc.filename,
        });
      });
    }
    if ((await countCursorPdf != 0)) {
      await cursorPdf.forEach((doc) => {
        fileInfos.push({
          name: doc.filename,
          url: baseUrl + 'pdf/' + doc.filename,
        });
      });
    }

    return res.status(200).send(fileInfos);
  } catch (error) {
    return res.status(500).send({
      message: error.message,
    });
  }
};

const getListImg = async (req, res) => {
  try {
    await mongoClient.connect();

    const database = mongoClient.db(dbConfig.database);
    const images = database.collection(dbConfig.imgBucket+".files");

    const countCursor = images.estimatedDocumentCount()
    const cursor = images.find({ });

    if ((await countCursor === 0)) {
      return res.status(500).send({
        message: "No image/photos found!",
      });
    }

    let fileInfos = [];
    await cursor.forEach((doc) => {
      fileInfos.push({
        name: doc.filename,
        url: baseUrl + 'img/' + doc.filename,
      });
    });

    return res.status(200).send(fileInfos);
  } catch (error) {
    return res.status(500).send({
      message: error.message,
    });
  }
};

const getListPdf = async (req, res) => {
  try {
    await mongoClient.connect();

    const database = mongoClient.db(dbConfig.database);
    const pdfs = database.collection(dbConfig.pdfBucket+".files");

    const countCursor = pdfs.estimatedDocumentCount()
    const cursor = pdfs.find({ });

    if ((await countCursor === 0)) {
      return res.status(500).send({
        message: "No pdf found!",
      });
    }

    let fileInfos = [];
    await cursor.forEach((doc) => {
      fileInfos.push({
        name: doc.filename,
        url: baseUrl + 'pdf/' + doc.filename,
      });
    });

    return res.status(200).send(fileInfos);
  } catch (error) {
    return res.status(500).send({
      message: error.message,
    });
  }
};

// const download = async (req, res) => {
//   try {
//     await mongoClient.connect();

//     const database = mongoClient.db(dbConfig.database);
//     const bucket = new GridFSBucket(database, {
//       bucketName: dbConfig.imgBucket,
//     });

//     let downloadStream = bucket.openDownloadStreamByName(req.params.name);

//     downloadStream.on("data", function (data) {
//       return res.status(200).write(data);
//     });

//     downloadStream.on("error", function (err) {
//       return res.status(404).send({ message: "Cannot download the Image!" });
//     });

//     downloadStream.on("end", () => {
//       return res.end();
//     });
//   } catch (error) {
//     return res.status(500).send({
//       message: error.message,
//     });
//   }
// };

const download = async (req, res) => {
  try {
    const match = ['pdf', 'img']
    const splitUrl = req.originalUrl.split("/")
    const typeBucket = match.indexOf(splitUrl[1])
    await mongoClient.connect();

    const database = mongoClient.db(dbConfig.database);
    const bucket = new GridFSBucket(database, {
      bucketName: typeBucket == 0 ? dbConfig.pdfBucket : typeBucket == 1 ? dbConfig.imgBucket : dbConfig.imgBucket,
    });

    let downloadStream = bucket.openDownloadStreamByName(req.params.name);

    downloadStream.on("data", function (data) {
      return res.status(200).write(data);
    });

    downloadStream.on("error", function (err) {
      return res.status(404).send({ message: "Cannot download the Image!" });
    });

    downloadStream.on("end", () => {
      return res.end();
    });
  } catch (error) {
    return res.status(500).send({
      message: error.message,
    });
  }
};

module.exports = {
  uploadFiles,
  getListFiles,
  getListPdf,
  getListImg,
  download,
};
