const { ObjectId } = require('mongodb')
const modelEtape = require('../Model/Tracker/Etapes')
const asyncLab = require('async')

module.exports = {
  Etape: (req, res, next) => {
    try {
      const { label, nexte } = req.body
      if (!label || !next) {
        return res.status(404).json('Error')
      }
      asyncLab.waterfall(
        [
          function (done) {
            modelEtape
              .findOne({ label })
              .lean()
              .then((result) => {
                if (result) {
                  done(null, result)
                } else {
                  done(null, false)
                }
              })
              .catch(function (err) {
                console.log(err)
              })
          },
          function (result, done) {
            if (result) {
              modelEtape
                .findByIdAndUpdate(
                  result._id,
                  { $set: { next: nexte } },
                  { new: true },
                )
                .then((response) => {
                  done(response)
                })
                .catch(function (err) {
                  console.log(err)
                })
            } else {
              modelEtape
                .create({ label, next: nexte })
                .then((response) => {
                  done(response)
                })
                .catch(function (err) {
                  console.log(err)
                })
            }
          },
        ],
        function (result) {
          if (result) {
            req.recherche = result._id
            next()
          }
        },
      )
    } catch (error) {
      console.log(error)
    }
  },
  ReadEtape: (req, res) => {
    try {
      const recherche = req.recherche
      let match = recherche
        ? {
            $match: {
              _id: new ObjectId(recherche),
              label: { $not: { $in: ['technique', 'nonTechnique'] } },
            },
          }
        : {
            $match: { label: { $not: { $in: ['technique', 'nonTechnique'] } } },
          }

      modelEtape
        .aggregate([
          match,
          {
            $lookup: {
              from: 'actions',
              localField: 'next',
              foreignField: 'idAction',
              as: 'nextAction',
            },
          },
          {
            $unwind: '$nextAction',
          },
          {
            $lookup: {
              from: 'status',
              localField: 'nextAction.idStatus',
              foreignField: 'idStatus',
              as: 'nextStatus',
            },
          },
          {
            $unwind: '$nextStatus',
          },
          {
            $lookup: {
              from: 'statutactions',
              localField: 'label',
              foreignField: 'idLabel',
              as: 'label',
            },
          },

          {
            $unwind: '$label',
          },
          {
            $lookup: {
              from: 'actions',
              localField: 'label.idAction',
              foreignField: 'idAction',
              as: 'actionprevious',
            },
          },
          {
            $unwind: '$actionprevious',
          },
          {
            $lookup: {
              from: 'status',
              localField: 'actionprevious.idStatus',
              foreignField: 'idStatus',
              as: 'previousStatus',
            },
          },
          {
            $unwind: '$previousStatus',
          },
          {
            $lookup: {
              from: 'roles',
              localField: 'actionprevious.idRole',
              foreignField: 'id',
              as: 'previousRole',
            },
          },
          {
            $lookup: {
              from: 'roles',
              localField: 'nextAction.idRole',
              foreignField: 'id',
              as: 'nextRole',
            },
          },
        ])
        .then((result) => {
          if (result) {
            let data = recherche ? result[0] : result.reverse()
            return res.status(200).json(data)
          }
        })
    } catch (error) {
      console.log(error)
    }
  },
  ReadTechNTech : (req, res)=>{
    try {
      let match = {
        $match: { label: { $in: ['technique', 'nonTechnique'] } },
      }
      modelEtape.aggregate([
        match,
        {
          $lookup : {
            from:"actions",
            localField:"next",
            foreignField:"idAction",
            as :"action"
          }
        },
        {
          $unwind:"$action"
        },
        {
          $lookup: {
            from: 'status',
            localField: 'action.idStatus',
            foreignField: 'idStatus',
            as: 'status',
          },
        },
        {
          $unwind:"$status"
        },
        {
          $lookup: {
            from: 'roles',
            localField: 'action.idRole',
            foreignField: 'id',
            as: 'role',
          },
        },
        {
          $unwind:"$role"
        },
      ]).then(response=>{
        if(response.length > 0){
          return res.status(200).json(response.reverse())
        }
      })
    } catch (error) {
      console.log(error)
    }
  }
}
