const modelDepartement = require('../Model/Departement')
const { generateNumber } = require('../Static/fonction')

module.exports = {
  AddDepartement: (req, res) => {
    try {
      const { title } = req.body
      if (!title ) {
        return res.status(200).json('Veuillez renseigner les champs')
      }
      const id = generateNumber(8)
      modelDepartement
        .create({
          title,
          id,
        })
        .then((result) => {
          if (result) {
            return res.status(200).json(result)
          } else {
            return res.status(404).json('Error')
          }
        })
        .catch(function (err) {
          return res.status(404).json('Error : ' + err)
        })
    } catch (error) {
      console.log(error)
    }
  },
  ReadDepartement: (req, res) => {
    try {
      modelDepartement
        .aggregate([
          {
            $lookup: {
              from: 'roles',
              localField: 'role',
              foreignField: 'idRole',
              as: 'roles',
            },
          },
          {
            $lookup: {
              from: 'agentadmins',
              localField: 'leader',
              foreignField: 'codeAgent',
              as: 'leaders',
            },
          },

        ])
        .then((result) => {
          if (result.length > 0) {
            return res.status(200).json(result.reverse())
          }else{
            return res.status(200).json([])
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
