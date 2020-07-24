// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for listItem
const HammockSpot = require('../models/hammockSpot')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { listItem: { title: '', text: 'foo' } } -> { listItem: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /listItem
router.get('/hammockSpots', (req, res, next) => {
  HammockSpot.find()
    .then(hammockSpot => {
      // `listItem` will be an array of Mongoose documents
      // we want to convert each one to a POJO, so we use `.map` to
      // apply `.toObject` to each one
      return hammockSpot.map(hammockSpot => hammockSpot.toObject())
    })
    // respond with status 200 and JSON of the listItem
    .then(hammockSpot => res.status(200).json({ hammockSpot: hammockSpot }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW
// GET /listItem/5a7db6c74d55bc51bdf39793
router.get('/hammockSpots/:id', (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  HammockSpot.findById(req.params.id)
    .then(handle404)
    // if `findById` is succesful, respond with 200 and "listItem" JSON
    .then(hammockSpot => res.status(200).json({ hammockSpot: hammockSpot.toObject() }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /listItem
router.post('/hammockSpots', (req, res, next) => {
  // set owner of new listItem to be current user
  // req.body.listItem.owner = req.user.id

  HammockSpot.create(req.body.hammockSpot)
    // respond to succesful `create` with status 201 and JSON of new "listItem"
    .then(hammockSpot => {
      res.status(201).json({ hammockSpot: hammockSpot.toObject() })
    })
    // if an error occurs, pass it off to our error handler
    // the error handler needs the error message and the `res` object so that it
    // can send an error message back to the client
    .catch(next)
})

// UPDATE
// PATCH /listItem/5a7db6c74d55bc51bdf39793
router.patch('/hammockSpots/:id', removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  // delete req.body.listItem.owner

  HammockSpot.findById(req.params.id)
    .then(handle404)
    .then(hammockSpot => {
      // pass the `req` object and the Mongoose record to `requireOwnership`
      // it will throw an error if the current user isn't the owner
      // requireOwnership(req, listItem)

      // pass the result of Mongoose's `.update` to the next `.then`
      return hammockSpot.updateOne(req.body.hammockSpot)
    })
    // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY
// DELETE /listItem/5a7db6c74d55bc51bdf39793
router.delete('/hammockSpots/:id', (req, res, next) => {
  HammockSpot.findById(req.params.id)
    .then(handle404)
    .then(hammockSpot => {
      // throw an error if current user doesn't own `listItem`
      // requireOwnership(req, hammockSpot)
      // delete the listItem ONLY IF the above didn't throw
      hammockSpot.deleteOne()
    })
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
