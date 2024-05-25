const { ObjectId } = require('mongodb')
const modelInitial = require('../Model/Tracker/Initiale')
const modeAction = require("../Model/Tracker/Action")
const asyncLab = require('async')

module.exports = {
  Initiale: (req, res, next) => {
    try {
      const { visited, called, action } = req.body
     
      if (visited ==="" || called ==="" || action ==="") {
        return res.status(404).json('Error')
      }
      asyncLab.waterfall([
        function(done){
          modeAction.findOne({idAction : action}).lean().then(result=>{
            if(result){
              done(null, result)
            }else{
              return res.status(404).json("Action introuvable")
            }
          }).catch(function(err){console.log(err)})
        },
        function (action, done) {
          modelInitial
            .findOne({ visited, called })
            .lean()
            .then((initial) => {
              if (initial) {
                done(null, initial)
              } else {
                done(null, false)
              }
            })
            .catch(function (err) {
              console.log(err)
            })
        },
        function (precedent, done) {
          if (precedent) {
            modelInitial
              .findByIdAndUpdate(
                precedent._id,
                { $set: {  action } },
                { new: true },
              )
              .then((result) => {
                if (result) {
                  req.recherche = result._id
                  next()
                 
                } else {
                  return res.status(404).json('Error')
                }
              })
              .catch(function (err) {
                console.log(err)
              })
          } else {
            modelInitial
              .create({ called, visited, action })
              .then((result) => {
                if (result) {
                  req.recherche = result._id
                  next()
                } else {
                  return res.status(404).json('Error')
                }
              })
              .catch(function (err) {
                console.log(err)
              })
          }
        },
      ])
    } catch (error) {
      console.log(error)
    }
  },
  ReadInitiale: (req, res) => {
    try {
      const recherche = req.recherche
      let match = recherche
        ? {
            $match: {
              _id: new ObjectId(recherche),
             
            },
          }
        : {
            $match: {  },
          }
      modelInitial
        .aggregate([
          match,
          {
            $lookup: {
              from: 'actions',
              localField: 'action',
              foreignField: 'idAction',
              as: 'actions',
            },
          },
        
        ])
        .then((result) => {
          
          if (result.length > 0) {
            let data = recherche ? result[0] : result.reverse()
            return res.status(200).json(data)
          } else {
            return res.status(201).json([])
          }
        })
        .catch(function (err) {
          console.log(err)
        })
    } catch (error) {
      console.log(error)
    }
  },
}
