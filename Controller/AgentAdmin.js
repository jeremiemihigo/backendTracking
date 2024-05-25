const { ObjectId } = require('mongodb')
const ModelAgentAdmin = require('../Model/AgentAdmin')
const asyncLab = require('async')

module.exports = {
  //Corbeille done
  AddAdminAgent: (req, res, next) => {
    try { 
      const { nom, code, region, shop } = req.body
      // const { codeAgent } = req.user
      const codeAgent = "j.jeremie"
      //Agent admin qui fait l'operation
      if (!nom || !code || !req.body.roleSelect.title ) {
        return res.status(404).json('Please fill in the fields')
      }
      asyncLab.waterfall(
        [
          function (done) {
            ModelAgentAdmin.findOne({ codeAgent: code })
              .then((agent) => {
                if (agent) {
                  return res.status(404).json('this code already exists')
                } else {
                  done(null, agent)
                }
              })
              .catch(function (err) {
                console.log(err)
              })
          },
          function (agent, done) {
            ModelAgentAdmin.create({
              nom,
              password: '1234',
              savedBy: codeAgent,
              role : req.body.roleSelect?.title,
              shop,
              codeAgent: code,
              id: new Date(),
              region, 
            })
              .then((result) => {
                console.log(result)
                done(result)
              })
              .catch(function (err) {
                console.log(err)
                if (err) {
                  return res.status(404).json('Error')
                }
              })
          },
        ],
        function (result) {
          if (result) {
            req.recherche = result._id
            next()
          } else {
            return res.status(404).json("Erreur d'enregistrement")
          }
        },
      )
    } catch (error) {
      return res.status(404).json('Error')
    }
  },
  ReadAgent : (req, res)=>{
    try {
      const recherche = req.recherche
      let match = recherche
        ? { _id : new ObjectId(recherche) }
        : {  }

      ModelAgentAdmin.find(match).lean().then(result=>{
      
        if(result.length > 0){
          let data = recherche ? result[0] : result.reverse()
          return res.status(200).json(data)
        }else{
          return res.status(404).json('Error')
        }
      }).catch(function(err){return res.status(404).json("Error "+err)})
    } catch (error) {
      console.log(error)
    }
  },
  //Corbeille done
}
