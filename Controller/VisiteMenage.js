const modelClient = require("../Model/Tracker/Client");
const asyncLab = require("async");

module.exports = {
  pushClientVisite: (req, res) => {
    try {
      const { data } = req.body;
      if (data && data.length === 0) {
        return res.status(201).json("Data not found");
      }

      for (let i = 0; i < data.length; i++) {
        asyncLab.waterfall([
          //recherche du client
          function (done) {
            modelClient
              .findOne({
                unique_account_id: data[i].codeclient,
                active: true,
                month: data[i].periode,
              })
              .lean()
              .then((result) => {
                if (result) {
                  done(null, result);
                } else {
                  done("aucun client");
                }
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (client, done) {
            const dates = new Date().toISOString();
            const nextAction =
              client.actionEnCours === "Y13JKS"
                ? "BXLMWU"
                : client.actionEnCours === "XZ445X" && "SA89AF";
            modelClient
              .findByIdAndUpdate(client._id, {
                $set: {
                  objectVisite: {
                    codeAgent: data[i].codeAgent,
                    idDemande: data[i].idDemande,
                    raison: data[i].raison,
                    dateSave: data[i].dateSave,
                  },
                  visited: "visited",
                  actionEnCours: nextAction,
                  updatedAt: dates.split("T")[0],
                },
              })
              .then((result) => {
                if (i + 1 === data.length) {
                  return res.status(200).json("operation carried out");
                }
              });
          },
        ]);
      }
    } catch (error) {
      console.log(error);
    }
  },
};
