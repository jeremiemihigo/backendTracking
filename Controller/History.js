const modelClient = require("../Model/Tracker/Client");
const asyncLab = require("async");

module.exports = {
  Historique: (req, res) => {
    try {
      const { codeclient } = req.body;
      if (!codeclient || codeclient.length !== 12) {
        return res
          .status(201)
          .json("poorly structured code. the code must contain 12 characters");
      }
      asyncLab.waterfall([
        function (done) {
          modelClient
            .aggregate([
              { $match: { unique_account_id: codeclient } },
              { $unwind: "$result" },
              {
                $addFields: {
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
                $lookup: {
                  from: "actions",
                  localField: "beginAction",
                  foreignField: "idAction",
                  as: "begin",
                },
              },
              { $unwind: "$begin" },
              {
                $lookup: {
                  from: "roles",
                  localField: "begin.idRole",
                  foreignField: "id",
                  as: "rolebegin",
                },
              },
              { $project: { result: 0 } },
            ])
            .then((client) => {
              done(null, client);
            })
            .catch(function () {
              return res
                .status(201)
                .json(
                  "The server experienced a small problem while resolving this request. Please try again later"
                );
            });
        },
        function (client, done) {
          if (client.length > 0) {
            return res.status(200).json(client);
          } else {
            modelClient
              .aggregate([
                { $match: { unique_account_id: codeclient } },
                {
                  $lookup: {
                    from: "actions",
                    localField: "beginAction",
                    foreignField: "idAction",
                    as: "begin",
                  },
                },
                { $unwind: "$begin" },
                {
                  $lookup: {
                    from: "roles",
                    localField: "begin.idRole",
                    foreignField: "id",
                    as: "rolebegin",
                  },
                },
                { $project: { result: 0 } },
              ])
              .then((client) => {
                if (client.length > 0) {
                  return res.status(200).json(client);
                } else {
                  return res.status(201).json("customer not found");
                }
              })
              .catch(function () {
                return res
                  .status(201)
                  .json(
                    "The server experienced a small problem while resolving this request. Please try again later"
                  );
              });
          }
        },
      ]);
    } catch (error) {
      console.log(error);
    }
  },
};
