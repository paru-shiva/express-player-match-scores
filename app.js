const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, '/cricketMatchDetails.db')

let db = undefined

const startDbServer = async () => {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  })
}

startDbServer()

app.get('/', async (req, res) => {
  res.send(await db.all(`select * from player_match_score`))
})

app.get('/players/', async (req, res) => {
  const displayPlayrsQuery = 'select * from player_details'
  let queryResult = await db.all(displayPlayrsQuery)
  const changeFormat = obj => {
    return {
      playerId: obj.player_id,
      playerName: obj.player_name,
    }
  }
  queryResult = queryResult.map(changeFormat)
  res.send(queryResult)
})

app.get('/players/:playerId/', async (req, res) => {
  const {playerId} = req.params
  const onePlayerDetailsQuery = `select * from player_details where player_id = ${playerId}`
  let queryResult = await db.get(onePlayerDetailsQuery)
  res.send({
    playerId: queryResult.player_id,
    playerName: queryResult.player_name,
  })
})

app.put('/players/:playerId/', async (req, res) => {
  const {playerId} = req.params
  const updatePlayerQuery = `update player_details set player_name = '${req.body.playerName}' where player_id = ${playerId}`
  console.log(updatePlayerQuery)
  db.run(updatePlayerQuery)
  res.send('Player Details Updated')
})

app.get('/matches/:matchId/', async (req, res) => {
  const {matchId} = req.params
  const matchDetailsQuery = `select * from match_details where match_id = ${matchId}`
  let queryRes = await db.get(matchDetailsQuery)
  res.send({
    matchId: queryRes.match_id,
    match: queryRes.match,
    year: queryRes.year,
  })
})

app.get('/players/:playerId/matches', async (req, res) => {
  const {playerId} = req.params
  const matchesByPlayerQuery = `select * 
  from match_details inner join player_match_score on match_details.match_id = player_match_score.match_id
  where player_id = ${playerId}`
  let queryResult = await db.all(matchesByPlayerQuery)
  const formatDetails = obj => {
    return {
      matchId: obj.match_id,
      match: obj.match,
      year: obj.year,
    }
  }
  console.log(queryResult)
  res.send(queryResult.map(formatDetails))
})

app.get('/matches/:matchId/players', async (req, res) => {
  const {matchId} = req.params
  const playersOfMatchQuery = `select player_details.player_id, player_details.player_name from player_details inner join player_match_score on
  player_details.player_id = player_match_score.player_id where match_id = ${matchId}`
  const formatDetails = obj => {
    return {
      playerId: obj.player_id,
      playerName: obj.player_name,
    }
  }
  let result = await db.all(playersOfMatchQuery)
  res.send(result.map(formatDetails))
})

app.get('/players/:playerId/playerScores', async (req, res) => {
  const {playerId} = req.params
  const scoreOfPlayerQuery = `select player_details.player_id, player_details.player_name, player_match_score.score, player_match_score.fours, player_match_score.sixes from player_details natural join player_match_score where player_id = ${playerId}`
  let result = await db.all(scoreOfPlayerQuery)
  const reducerFunction = (obj1, obj2) => {
    return {
      playerId: obj2.player_id,
      playerName: obj2.player_name,
      score: obj1.score + obj2.score,
      fours: obj1.fours + obj2.fours,
      sixes: obj1.sixes + obj2.sixes,
    }
  }
  result = result.reduce(reducerFunction)
  result = {
    playerId: result.playerId,
    playerName: result.playerName,
    totalScore: result.score,
    totalFours: result.fours,
    totalSixes: result.sixes
  }
  res.send(result)
})

app.listen(3000, () => {
  console.log('server started..')
})

module.exports = app
