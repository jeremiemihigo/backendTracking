const modelProcess = require('../Model/Tracker/Process')
const asyncLab = require('async')
const { generateString,  } = require('../Static/fonction')
const modelCorbeille = require('../Model/Tracker/Corbeille')

module.exports = {
  AddProcess: (req, res, next) => {
    try {
      const { title, idMainProcess } = req.body

      const { codeAgent } = req.user
      const idProcess = generateString(6)
      if (!title) {
        return res.status(201).json('please fill in the main process')
      }

      modelProcess
        .create({
          idMainProcess,
          savedBy: codeAgent,
          title,
          idProcess
        })
        .then((result) => {
          if (result) {
           req.recherche = result.idProcess
           next()
          } else {
            return res.status(201).json('registration error')
          }
        })
        .catch(function (err) {
          return res.status(201).json('Error')
        })
    } catch (error) {
      console.log(error)
    }
  },
  UpdateProcess: (req, res, next) => {
    try {
      const { title, _id } = req.body
      const { codeAgent } = req.user
      if (!title) {
        return res.status(201).json('please enter the title')
      }
      asyncLab.waterfall(
        [
          function (done) {
            modelProcess
              .findById(_id)
              .lean()
              .then((process) => {
                if (process) {
                  done(null, process)
                } else {
                  return res.status(201).json('process not found')
                }
              })
              .catch(function (err) {
                console.log(err)
              })
          },
          function (process, done) {
            modelProcess
              .findByIdAndUpdate(process._id, { $set: { title } }, { new: true })
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
                texte: `@${codeAgent} changed the process ${ancien.title} to ${nouveau.title} `,
              })
              .then((result) => {
                done(ancien)
              })
              .catch(function (err) {
                console.log(err)
              })
          },
        ],
        function (result) {
         req.recherche = result.idProcess
         next()
        },
      )
    } catch (error) {
      console.log(error)
    }
  },
  ReadProcess : (req, res)=>{
    try {
      const recherche = req.recherche
      let match = recherche
        ? { $match: { idProcess: recherche } }
        : { $match: {} }

        modelProcess.aggregate([
          match,
          {
            $lookup : {
              from:"mainprocesses",
              localField:"idMainProcess",
              foreignField:"idMainProcess",
              as :"main"
            }
          },
          {
            $unwind:"$main"
          },
         
          {
            $lookup : {
              from:"status",
              localField:"idProcess",
              foreignField:"idProcess",
              as :"status"
            }
          },
        ]).then(result=>{
          if(result.length > 0){
            let data = recherche ? result[0] : result.reverse()
            return res.status(200).json(data)
          }
        }).catch(function(err){console.log(err)})
    } catch (error) {
      console.log(error)
    }
  }
}
