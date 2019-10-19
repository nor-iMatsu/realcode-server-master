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

async function getExercise(collectionName, quizIndex) {
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

function registerAnswer(answersCollectionName, quizIndex, validity, reasonForValidity, difficulty, selectedTypes, descriptionForSyntax, descriptionForRefactoring,
  libraryName, descriptionForOtherType, dataFetchingTime, dataPostingTime) {
  console.log('registerAnswer. Collection name: %s', answersCollectionName)

  return new Promise((resolve, reject) => {
    mongoClient.connect(dbUrl, (err, db) => {
      if (err) {
        reject(err);
      }

      const collectionAnswers = db.db(answersDatabaseName).collection(answersCollectionName);
      collectionAnswers.insertOne({
        "quizIndex": quizIndex,
        "validity": validity,
        "reasonForValidity": reasonForValidity,
        "difficulty": difficulty,
        "selectedTypes": selectedTypes,
        "descriptionForSyntax": descriptionForSyntax,
        "descriptionForRefactoring": descriptionForRefactoring,
        "libraryName": libraryName,
        "descriptionForOtherType": descriptionForOtherType,
        "dataFetchingTime": dataFetchingTime,
        "dataPostingTime": dataPostingTime
      }, () => {
        db.close();
        resolve();
      });
    });
  });
}


function deleteStatusDocuments(answersCollectionName) {
  console.log("deleteStatusDocuments")
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
  const exerciseIndex = Number(req.query['index']);
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
  const validity = requestBody.validity;
  const reasonForValidity = requestBody.reasonForValidity;
  const difficulty = requestBody.difficulty;
  const selectedTypes = requestBody.selectedTypes;
  const descriptionForSyntax = requestBody.descriptionForSyntax;
  const descriptionForRefactoring = requestBody.descriptionForRefactoring;
  const libraryName = requestBody.libraryName;
  const descriptionForOtherType = requestBody.descriptionForOtherType;
  const dataFetchingTime = requestBody.dataFetchingTime;
  const dataPostingTime = requestBody.dataPostingTime;

  try {
    await registerAnswer(collectionName, quizIndex, validity, reasonForValidity, difficulty, selectedTypes, descriptionForSyntax, descriptionForRefactoring,
      libraryName, descriptionForOtherType, dataFetchingTime, dataPostingTime);
    await deleteStatusDocuments(collectionName);
    await registerStatus(collectionName, exerciseIndexListCurrentIndex, dataPostingTime);
    res.status(200).send('Successfully registered answer.');
  } catch (err) {
    res.status(500).send(err);
  }


});

module.exports = router;
