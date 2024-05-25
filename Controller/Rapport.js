const modelClient = require("../Model/Tracker/Client");
const asyncLab = require("async");

module.exports = {
  Rapport: (req, res) => {
    try {
      const { debut, fin, role } = req.body;

      if (!debut || !fin || !role) {
        return res.status(201).json("Veuillez renseigner les dates et le role");
      }
      let match =
        role === "overall"
          ? {
              $match: {
                "result.dateFin": {
                  $gte: new Date(debut),
                  $lte: new Date(fin),
                },
              },
            }
          : {
              $match: {
                "result.dateFin": {
                  $gte: new Date(debut),
                  $lte: new Date(fin),
                },
                "result.role": role,
              },
            };
      asyncLab.waterfall([
        function (done) {
          modelClient
            .aggregate([
              { $unwind: "$result" },
              match,
              {
                $lookup: {
                  from: "agentadmins",
                  localField: "result.codeAgent",
                  foreignField: "codeAgent",
                  as: "agent",
                },
              },
              { $unwind: "$agent" },
              {
                $addFields: {
                  nom: "$agent.nom",
                  action: "$result.action",
                  codeAgent: "$result.codeAgent",
                  commentaire: "$result.commentaire",
                  result_createdAt: "$result.createdAt",
                  dateFin: "$result.dateFin",
                  dateDebut: "$result.dateDebut",
                  delaiPrevu: "$result.delaiPrevu",
                  feedbackSelect: "$result.feedbackSelect",
                  result_updatedAt: "$result.updatedAt",
                  role: "$result.role",
                  status: "$result.status",
                },
              },
              {
                $project: {
                  agent: 0,
                  result: 0,
                  beginAction: 0,
                  actionEnCours: 0,
                  createdAt: 0,
                  updatedAt: 0,
                  __v: 0,
                  _id: 0,
                  active: 0,
                  result_updatedAt: 0,
                  result_createdAt: 0,
                },
              },
            ])
            .then((result) => {
              return res.status(200).json(result);
            });
        },
      ]);
    } catch (error) {
      console.log(error);
    }
  },
};
