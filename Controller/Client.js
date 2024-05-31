const modelClient = require("../Model/Tracker/Client");
const modelEtape = require("../Model/Tracker/Etapes");
const asyncLab = require("async");

module.exports = {
  Clients: (req, res) => {
    try {
      //A visité et à apeler

      const { data } = req.body;
      console.log(data)

      asyncLab.waterfall([
        function (done) {
          modelClient
            .insertMany(data)
            .then((result) => {
              if (result) {
                return res.status(200).json("Enregistrement effectuer");
              }
            })
            .catch(function (err) {
              console.log(err);
            });
        },
      ]);
    } catch (error) {
      console.log(error);
    }
  },
};
