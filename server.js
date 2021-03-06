var express = require("express");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var jwt = require('jsonwebtoken');
var ObjectID = mongodb.ObjectID;

var BUILDINGS_COLLECTION = "buildings";
var USERS_COLLECTION = "users";

var app = express();
app.use(bodyParser.json());

// Create link to Angular build directory
var distDir = __dirname + "/dist/";
app.use(express.static(distDir));

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    // Save database object from the callback for reuse.
    db = database;
    console.log("Database connection ready");

    // Initialize the app.
    var server = app.listen(process.env.PORT || 8080, function () {
        var port = server.address().port;
        console.log("App now running on port", port);
    });
});

// BUILDINGS API ROUTES BELOW

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
    console.log("ERROR: " + reason);
    res.status(code || 500).json({ "error": message });
}

/*  "/api/buildings"
 *    GET: finds all buildings
 *    POST: creates a new building
 */

app.get("/api/private/buildings", function (req, res) {
    db.collection(BUILDINGS_COLLECTION).find({}).toArray(function (err, docs) {
        if (err) {
            handleError(res, err.message, "Failed to get buildings.");
        } else {
            res.status(200).json(docs);
        }
    });
});

app.post("/api/private/buildings", function (req, res) {
    var newBuilding = req.body;
    newBuilding.createDate = new Date();

    delete newBuilding._id;

    if (!req.body.name) {
        handleError(res, "Invalid user input", "Must provide a name.", 400);
    }

    db.collection(BUILDINGS_COLLECTION).insertOne(newBuilding, function (err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to create new building.");
        } else {
            res.status(201).json(doc.ops[0]);
        }
    });
});

app.get("/api/private/buildings/:id", function (req, res) {
    db.collection(BUILDINGS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function (err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to get building");
        } else {
            res.status(200).json(doc);
        }
    });
});

app.put("/api/private/buildings/:id", function (req, res) {
    var updateDoc = req.body;
    delete updateDoc._id;

    db.collection(BUILDINGS_COLLECTION).updateOne({ _id: new ObjectID(req.params.id) }, updateDoc, function (err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to update building");
        } else {
            updateDoc._id = req.params.id;
            res.status(200).json(updateDoc);
        }
    });
});

app.delete("/api/private/buildings/:id", function (req, res) {
    db.collection(BUILDINGS_COLLECTION).deleteOne({ _id: new ObjectID(req.params.id) }, function (err, result) {
        if (err) {
            handleError(res, err.message, "Failed to delete building");
        } else {
            res.status(200).json(req.params.id);
        }
    });
});

app.post("/api/users", function (req, res) {
    var newUser = req.body;
    newUser.createDate = new Date();

    delete newUser._id;

    if (!req.body.userName) {
        handleError(res, "Invalid user input", "Must provide a userName.", 400);
    }

    db.collection(USERS_COLLECTION).insertOne(newUser, function (err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to create new user.");
        } else {
            res.status(201).json(doc.ops[0]);
        }
    });
});

app.get("/api/private/users", function (req, res) {
    db.collection(USERS_COLLECTION).find({}).toArray(function (err, docs) {
        if (err) {
            handleError(res, err.message, "Failed to get users.");
        } else {
            res.status(200).json(docs);
        }
    });
});

app.post("/api/private/users", function (req, res) {
    var newUser = req.body;
    newUser.createDate = new Date();

    delete newUser._id;

    if (!req.body.userName) {
        handleError(res, "Invalid user input", "Must provide a userName.", 400);
    }

    db.collection(USERS_COLLECTION).insertOne(newUser, function (err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to create new user.");
        } else {
            res.status(201).json(doc.ops[0]);
        }
    });
});

app.get("/api/private/users/:id", function (req, res) {
    db.collection(USERS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function (err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to get user");
        } else {
            res.status(200).json(doc);
        }
    });
});

app.put("/api/private/users/:id", function (req, res) {
    var updateDoc = req.body;
    delete updateDoc._id;

    db.collection(USERS_COLLECTION).updateOne({ _id: new ObjectID(req.params.id) }, updateDoc, function (err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to update user");
        } else {
            updateDoc._id = req.params.id;
            res.status(200).json(updateDoc);
        }
    });
});

app.delete("/api/private/users/:id", function (req, res) {
    db.collection(USERS_COLLECTION).deleteOne({ _id: new ObjectID(req.params.id) }, function (err, result) {
        if (err) {
            handleError(res, err.message, "Failed to delete user");
        } else {
            res.status(200).json(req.params.id);
        }
    });
});

app.post("/api/authenticate", function (request, response) {
    var body = request.body;

    if (!body.email || !body.password) {
        handleError(response, "Invalid user input", "Must provide valid credentials.", 400);
    }

    var credential = {
        email: body.email
    };

    db.collection(USERS_COLLECTION).findOne(credential, function (error, user) {
        if (error) {
            handleError(response, error.message, "Failed to login user.");
        } else if (!user) {
            handleError(response, "error", "No user with the given credentials!");
        } else if (user.password != body.password) {
            handleError(response, "error", "The given password is not correct");
        } else {
            var token = jwt.sign(
                user,
                'asDFghJK1234',
                {
                    expiresIn: 60*60*24
                }
            );

            response.status(201).json(
                {
                    success: true,
                    user: user,
                    token: token
                }
            );
        }
    });
});

var expressFallback = require('express-history-api-fallback');

app.use(expressFallback('index.html', { root: distDir }));