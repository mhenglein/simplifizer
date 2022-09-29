/**
 * Module dependencies.
 */
const express = require("express");
const compression = require("compression");
// const session = require("express-session");
const logger = require("morgan");
const errorHandler = require("errorhandler");
// const lusca = require("lusca");
const dotenv = require("dotenv");

const path = require("path");
const multer = require("multer");
const fs = require("fs");

const upload = multer({ dest: path.join(__dirname, "uploads") });

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: ".env" });

/**
 * Controllers (route handlers).
 */
const homeController = require("./controllers/home");
const openai = require("./controllers/openai");

/**
 * Create Express server.
 */
const app = express();

/**
 * Express configuration.
 */
app.set("host", process.env.OPENSHIFT_NODEJS_IP || "0.0.0.0");
app.set("port", process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(compression());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.disable("x-powered-by");

app.use("/", express.static(path.join(__dirname, "public"), { maxAge: 31557600000 }));

/**
 * Primary app routes.
 */
app.get("/", homeController.index);

app.post("/upload", upload.single("file"), (req, res) => {
  // req.file is the `txt` file
  // req.body will contain the text parsed from the file

  const file = req.file;
  console.log(file);
  // open file into a txt file
  // read file
  if (!file) {
    res.send("Please upload a file");
    return;
  }

  try {
    const text = fs.readFileSync(file.path, "utf8");
    console.log("⬇️ Incoming text", text);

    const summarized = openai.summarizer(text);

    res.render("home", { summary: text });
    return;
  } catch (e) {
    if (!res.writableEnded) res.send("Error reading file");
    return;
  }
});

// Error: 404
app.use(function (req, res) {
  res.status(404).send("404");
});

// Error Handler: 500
if (process.env.NODE_ENV === "development") {
  // only use in development
  app.use(errorHandler());
} else {
  app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send("Server Error");
    return;
  });
}

const port = process.env.PORT || 3001;

/**
 * Start Express server.
 */
app.listen(port);
