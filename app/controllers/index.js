var express = require('express');
var mongoClient = require("mongodb").MongoClient;
var router = express.Router();

const exercisesDatabaseName = 'realcode';
const answersDatabaseName = 'answers'
const statusDatabaseName = 'status'

// require('dotenv').config();
const dbUrl = "mongodb://realcode-mongo:27017"

// FUNCTIONS
// =============================================================================

/**
 * Return the number of exercises stored in realcode.exercises
 */
function getNumberOfExercises(collectionName) {
  console.log('getNumberOfExercises. Collection name: %s', collectionName)

  return new Promise((resolve, reject) => {
    mongoClient.connect(dbUrl, (err, db) => {
      if (err) {
        reject(err);
      }

      const collection = db.db(exercisesDatabaseName).collection(collectionName);

      collection.find({}).count((err, res) => {
        if (err) {
          reject(err);
        }

        db.close();
        resolve(res);
      });
    });
  });
}

function getStatus(collectionName) {
  console.log('getCurrentExerciseIndex. Collection name: %s', collectionName)
  return new Promise((resolve, reject) => {
    mongoClient.connect(dbUrl, (err, db) => {
      if (err) {
        reject(err);
      }

      const collection = db.db(statusDatabaseName).collection(collectionName);

      collection.findOne({}, function(err, result) {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  });
}

function getCurtrentExerciseIndex(exerciseCurrentIndexDict) {
  if (exerciseCurrentIndexDict) {
    return exerciseCurrentIndexDict["exerciseIndexListCurrentIndex"];
  } else {
    return -1;
  }
}

function getExercise(collectionName, quizIndex) {
  console.log('getExercise. Collection name: %s', collectionName)

  return new Promise((resolve, reject) => {
    mongoClient.connect(dbUrl, function (err, db) {
      if (err) {
        reject(err);
      }
      const collection = db.db(exercisesDatabaseName).collection(collectionName);
      collection.find({})
        .sort({
          'ID': 1
        })
        .limit(1)
        .skip(quizIndex)
        .toArray((err, docs) => {
          db.close()
          if (err) {
            reject(err);
          } else {
            resolve(docs);
          }
        });

    });
  });
}

function registerAnswer(answersCollectionName, issueUrl, quizIndex, validity, selectedReasonNoValid, descriptionForNoValid, difficulty, selectedTypes, descriptionForException,
  descriptionForOtherSyntax, descriptionForLogging, descriptionForLibrary, descriptionForData, descriptionForAlgorithms, descriptionForOtherType, comments, lineNumbers, dataFetchingTime, dataPostingTime) {
  console.log('registerAnswer. Collection name: %s', answersCollectionName)

  return new Promise((resolve, reject) => {
    mongoClient.connect(dbUrl, (err, db) => {
      if (err) {
        reject(err);
      }

      const collectionAnswers = db.db(answersDatabaseName).collection(answersCollectionName);
      collectionAnswers.insertOne({
        "issueUrl": issueUrl,
        "quizIndex": quizIndex,
        "validity": validity,
        "selectedReasonNoValid": selectedReasonNoValid,
        "descriptionForNoValid": descriptionForNoValid,
        "difficulty": difficulty,
        "selectedTypes": selectedTypes,
        "descriptionForException": descriptionForException,
        "descriptionForOtherSyntax": descriptionForOtherSyntax,
        "descriptionForLogging": descriptionForLogging,
        "descriptionForLibrary": descriptionForLibrary,
        "descriptionForData": descriptionForData,
        "descriptionForAlgorithms": descriptionForAlgorithms,
        "descriptionForOtherType": descriptionForOtherType,
        "comments": comments,
        "lineNumbers": lineNumbers,
        "dataFetchingTime": dataFetchingTime,
        "dataPostingTime": dataPostingTime
      }, () => {
        db.close();
        resolve();
      });
    });
  });

  return;
}


function deleteStatusDocuments(answersCollectionName) {
  console.log("deleteStatusDocuments. Collection name: %s", answersCollectionName)
  return new Promise((resolve, reject) => {
    mongoClient.connect(dbUrl, (err, db) => {
      if (err) {
        reject(err);
      }
      const collectionStatus = db.db(statusDatabaseName).collection(answersCollectionName);
      collectionStatus.deleteMany({
      }, () => {
        db.close();
        resolve();
      });
    });
  });
}

function registerStatus(answersCollectionName, exerciseIndexListCurrentIndex, dataPostingTime) {
  console.log('registerStatus. Current status: %d', exerciseIndexListCurrentIndex)
  return new Promise((resolve, reject) => {
    mongoClient.connect(dbUrl, (err, db) => {
      if (err) {
        reject(err);
      }
      const collectionStatus = db.db(statusDatabaseName).collection(answersCollectionName);
      collectionStatus.insertOne({
        "exerciseIndexListCurrentIndex": exerciseIndexListCurrentIndex,
        "dataPostingTime": dataPostingTime
      }, () => {
        db.close();
        resolve();
      });
    });
  });
}

// ROUTES FOR OUR API
// =============================================================================

router.get('/', function (req, res) {
  res.json({
    message: 'Welcome to our api!'
  });
});

router.post('/', (req, res) => {
  const requestBody = req.body;
  res.json(requestBody);
});

router.get('/exercise-number', async (req, res) => {
  const collectionName = String(req.query['pid']);
  // const collectionName = "exercises_py_all";
  const exerciseNumber = await getNumberOfExercises(collectionName);
  const exerciseCurrentIndexDict = await getStatus(collectionName);
  const currentIndex = await getCurtrentExerciseIndex(exerciseCurrentIndexDict)
  // const currentIndex = await exerciseCurrentIndexDict["exerciseIndexListCurrentIndex"]
  console.log("currentIndex: ", currentIndex)
  res.json({
    totalNumber: exerciseNumber,
    currentIndex: currentIndex+1
  });
});

router.get('/exercise', async (req, res) => {
  const collectionName = String(req.query['pid']);
  // const collectionName = "exercises_py_all";
  const exerciseIndex = Number(req.query['index']);
  // const exerciseIndex = 81;
  const exercise = await getExercise(collectionName, exerciseIndex);
  if (exercise.length === 0) {
    res.json({
      'error': 'Quiz not found. Try other programming languages.'
    });
  } else {
    res.json({
      exercise: exercise[0]
    });
  }
});

router.post('/answer', async (req, res) => {
  const requestBody = req.body;

  // collectionName is participantId
  const collectionName = requestBody.participantId;
  const quizIndex = requestBody.quizIndex;
  const exerciseIndexListCurrentIndex = requestBody.exerciseIndexListCurrentIndex;
  const validity = requestBody.validity; //Q3
  const selectedReasonNoValid = requestBody.selectedReasonNoValid; //Q3
  const descriptionForNoValid = requestBody.descriptionForNoValid; //Q3
  const difficulty = requestBody.difficulty; //Q4
  const selectedTypes = requestBody.selectedTypes;
  const descriptionForException = requestBody.descriptionForException;
  const descriptionForOtherSyntax = requestBody.descriptionForOtherSyntax;
  const descriptionForLogging = requestBody.descriptionForLogging;
  const descriptionForLibrary = requestBody.descriptionForLibrary;
  const descriptionForData = requestBody.descriptionForData;
  const descriptionForAlgorithms = requestBody.descriptionForAlgorithms;
  const descriptionForOtherType = requestBody.descriptionForOtherType;
  const comments = requestBody.comments;
  const lineNumbers = requestBody.lineNumbers;
  const dataFetchingTime = requestBody.dataFetchingTime;
  const dataPostingTime = requestBody.dataPostingTime;

  const issueUrl = requestBody.issueUrl;

  try {
    await registerAnswer(collectionName, issueUrl, quizIndex, validity, selectedReasonNoValid, descriptionForNoValid, difficulty, selectedTypes, descriptionForException,
      descriptionForOtherSyntax, descriptionForLogging, descriptionForLibrary, descriptionForData, descriptionForAlgorithms, descriptionForOtherType, comments, lineNumbers, dataFetchingTime, dataPostingTime);
    await deleteStatusDocuments(collectionName);
    await registerStatus(collectionName, exerciseIndexListCurrentIndex, dataPostingTime);
    res.status(200).send('Successfully registered answer.');
  } catch (err) {
    res.status(500).send(err);
  }


});

module.exports = router;
