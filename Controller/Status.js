const modelStatus = require('../Model/Tracker/Status')
const asyncLab = require('async')
const { generateString,  } = require('../Static/fonction')
const modelCorbeille = require('../Model/Tracker/Corbeille')

module.exports = {
  AddStatus: (req, res) => {
    try {
      const { title, idProcess } = req.body
      const { codeAgent } = req.user
      const idStatus = generateString(6)
      if (!title) {
        return res.status(201).json('please fill in the main process')
      }

      modelStatus
        .create({
          idProcess,
          savedBy: codeAgent,
          title,
          idStatus
        })
        .then((result) => {
          if (result) {
            return res.status(200).json(result)
          } else {
            return res.status(201).json('registration error')
          }
        })
        .catch(function (err) {
          console.log(err)
          return res.status(201).json('Error')
        })
    } catch (error) {
      console.log(error)
    }
  },
  UpdateStatus: (req, res) => {
    try {
      const { title, _id } = req.body
      const { codeAgent } = req.user
      if (!title) {
        return res.status(201).json('please enter the title')
      }
      asyncLab.waterfall(
        [
          function (done) {
            modelStatus
              .findById(_id)
              .lean()
              .then((status) => {
                if (status) {
                  done(null, status)
                } else {
                  return res.status(201).json('Status not found')
                }
              })
              .catch(function (err) {
                console.log(err)
              })
          },
          function (status, done) {
            modelStatus
              .findByIdAndUpdate(status._id, { $set: { title } }, { new: true })
              .then((result) => {
                if (result) {
                  done(null, process, result)
                } else {
                  return res.status(201).json('modification error')
                }
              })
              .catch(function (err) {
                console.log(err)
              })
          },
          function (ancien, nouveau, done) {
            modelCorbeille
              .create({
                texte: `@${codeAgent} changed the status ${ancien.title} to ${nouveau.title} `,
              })
              .then((result) => {
                done(nouveau)
              })
              .catch(function (err) {
                console.log(err)
              })
          },
        ],
        function (result) {
          return res.status(200).json(result)
        },
      )
    } catch (error) {
      console.log(error)
    }
  },
  ReadStatus : (req, res)=>{
    try {
      const recherche = req.recherche
      let match = recherche
        ? { $match: { idStatus: recherche } }
        : { $match: {} }

        modelStatus.aggregate([
          match,
          {
            $lookup:{
              from:"processes",
              localField:"idProcess",
              foreignField:"idProcess",
              as :"process"
            }
          },
          {
            $unwind : "$process"
          },
          {
            $lookup:{
              from:"agentadmins",
              localField:"savedBy",
              foreignField:"codeAgent",
              as :"agent"
            }
          },
          {
            $unwind : "$process"
          },
          {
            $lookup:{
              from:"actions",
              localField:"idStatus",
              foreignField:"idStatus",
              as :"action"
            }
          },
        ]).then(result=>{
          if(result.length > 0){
            let data = recherche ? result[0] : result.reverse()
            return res.status(200).json(data)
          }
        }).catch(function(err){console.log(err)})
    } catch (err) {
      console.log(err)
    }
  }
}
