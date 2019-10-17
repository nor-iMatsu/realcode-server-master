var express = require('express');
var mongoClient = require("mongodb").MongoClient;
var router = express.Router();

const dbName = 'realcode';
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

      const collection = db.db(dbName).collection(collectionName);

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

async function getExercise(collectionName, quizIndex) {
  console.log('getExercise. Collection name: %s', collectionName)

  return new Promise((resolve, reject) => {
    mongoClient.connect(dbUrl, function (err, db) {
      if (err) {
        reject(err);
      }
      const collection = db.db(dbName).collection(collectionName);
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

function registerAnswer(answersCollectionName, quizIndex, name, exerciseIndexListCurrentIndex, validity, reasonForValidity, difficulty, libraryName, selectedTypes, descriptionForType, dataFetchingTime, dataPostingTime) {
  console.log('registerAnswer. Collection name: %s', answersCollectionName)

  return new Promise((resolve, reject) => {
    mongoClient.connect(dbUrl, (err, db) => {
      if (err) {
        reject(err);
      }

      const collection_answers = db.db(answersDatabaseName).collection(answersCollectionName);
      collection_answers.insertOne({
        "quizIndex": quizIndex,
        "name": name,
        "validity": validity,
        "reasonForValidity": reasonForValidity,
        "difficulty": difficulty,
        "libraryName": libraryName,
        "selectedTypes": selectedTypes,
        "descriptionForType": descriptionForType,
        "dataFetchingTime": dataFetchingTime,
        "dataPostingTime": dataPostingTime
      }, () => {
        db.close();
        resolve();
      });
    });
  });
}

function registerStatus(answersCollectionName, name, exerciseIndexListCurrentIndex) {
  console.log('registerStatus. Current status: %d', exerciseIndexListCurrentIndex)
  return new Promise((resolve, reject) => {
    mongoClient.connect(dbUrl, (err, db) => {
      if (err) {
        reject(err);
      }

      const collection_status = db.db(statusDatabaseName).collection(answersCollectionName);

      //Todo: 同じ回答者の過去のdocumentを削除

      collection_status.insertOne({
        "name": name,
        "exerciseIndexListCurrentIndex": exerciseIndexListCurrentIndex
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
  const collectionName = String(req.query['collection']);
  const exerciseNumber = await getNumberOfExercises(collectionName);
  res.json({
    number: exerciseNumber
  });
});

router.get('/exercise', async (req, res) => {
  const collectionName = String(req.query['collection']);
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

  const collectionName = requestBody.collectionName;
  const quizIndex = requestBody.quizIndex;
  const name = requestBody.name;
  const exerciseIndexListCurrentIndex = requestBody.exerciseIndexListCurrentIndex;
  const validity = requestBody.validity;
  const reasonForValidity = requestBody.reasonForValidity;
  const difficulty = requestBody.difficulty;
  const libraryName = requestBody.libraryName;
  const selectedTypes = requestBody.selectedTypes;
  const descriptionForType = requestBody.descriptionForType;
  const dataFetchingTime = requestBody.dataFetchingTime;
  const dataPostingTime = requestBody.dataPostingTime;

  try {
    await registerAnswer(collectionName, quizIndex, name, exerciseIndexListCurrentIndex, validity, reasonForValidity, difficulty, libraryName, selectedTypes, descriptionForType, dataFetchingTime, dataPostingTime);
    await registerStatus(collectionName, name, exerciseIndexListCurrentIndex);
    res.status(200).send('Successfully registered answer.');
  } catch (err) {
    res.status(500).send(err);
  }


});

module.exports = router;
