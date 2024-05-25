const Roles = require("../Model/Tracker/Role");
const asyncLab = require("async");
const modelAction = require("../Model/Tracker/Action");
const modelClient = require("../Model/Tracker/Client");
const { differenceDays } = require("../Static/fonction");
const _ = require("lodash");

const retournNombre = (customer) => {
  let insla = 0;
  let outsla = 0;
  for (let i = 0; i < customer.length; i++) {
    if (
      differenceDays(customer[i].updatedAt, new Date()) >
      customer[i].action.delai
    ) {
      outsla = outsla + 1;
    } else {
      insla = insla + 1;
    }
  }
  return { insla, outsla };
};
module.exports = {
  RoleAttente: (req, res) => {
    const { id } = req.params;

    if (!id) {
      return res.status(201).json("Error");
    }
    try {
      asyncLab.waterfall(
        [
          function (done) {
            Roles.findOne({ id })
              .lean()
              .then((result) => {
                if (result) {
                  done(null, result);
                } else {
                  return res.status(201).json("Result");
                }
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (role, done) {
            modelAction
              .find({ idRole: role.id })
              .lean()
              .then((action) => {
                if (action.length > 0) {
                  let table = [];
                  for (let i = 0; i < action.length; i++) {
                    table.push(action[i].idAction);
                  }
                  done(null, table);
                } else {
                  return res
                    .status(201)
                    .json("Aucun statut affecté à ce département");
                }
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (result, done) {
            modelClient
              .aggregate([
                { $match: { actionEnCours: { $in: result }, active: true } },
                {
                  $lookup: {
                    from: "actions",
                    localField: "actionEnCours",
                    foreignField: "idAction",
                    as: "action",
                  },
                },
                { $unwind: "$action" },
                {
                  $lookup: {
                    from: "status",
                    localField: "action.idStatus",
                    foreignField: "idStatus",
                    as: "status",
                  },
                },
                { $unwind: "$status" },
                {
                  $lookup: {
                    from: "roles",
                    localField: "action.idRole",
                    foreignField: "id",
                    as: "role",
                  },
                },
              ])
              .then((response) => {
                done(response);
              });
          },
        ],
        function (result) {
          if (result.length > 0) {
            return res.status(200).json(result.reverse());
          } else {
            return res.status(201).json("Aucun client en attente");
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
  RemotedBy: (req, res) => {
    try {
      const { codeAgent, debut, fin } = req.body;
      if (!codeAgent || !debut || !fin) {
        return res.status(201).json("Error");
      }
      asyncLab.waterfall([
        function (done) {
          modelClient
            .aggregate([
              {
                $match: {
                  "result.codeAgent": codeAgent,
                  "result.createdAt": {
                    $gte: new Date(debut),
                    $lte: new Date(fin),
                  },
                },
              },
              { $unwind: "$result" },
              { $match: { "result.codeAgent": codeAgent } },
            ])
            .then((result) => {
              if (result.length > 0) {
                return res.status(200).json(result.reverse());
              } else {
                return res.status(201).json("Aucune action trouvée");
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
  CustomerDeedline: (req, res) => {
    try {
      asyncLab.waterfall([
        function (done) {
          modelClient
            .aggregate([
              { $match: { active: true } },
              {
                $lookup: {
                  from: "actions",
                  localField: "actionEnCours",
                  foreignField: "idAction",
                  as: "action",
                },
              },
              { $unwind: "$action" },
              {
                $lookup: {
                  from: "roles",
                  localField: "action.idRole",
                  foreignField: "id",
                  as: "role",
                },
              },
              { $unwind: "$role" },
              { $addFields: { roleTitle: "$role.title" } },
            ])
            .then((result) => {
              if (result.length > 0) {
                done(null, result);
              } else {
                return res.status(201).json("no current customers");
              }
            })
            .catch(function (err) {
              console.log(err);
            });
        },
        function (clients, done) {
          let table = [];
          let data = _.uniqBy(clients, "roleTitle");

          for (let i = 0; i < data.length; i++) {
            table.push({
              role: data[i].roleTitle,
              result: retournNombre(
                _.filter(clients, { roleTitle: data[i].roleTitle })
              ),
            });
          }
          res.send(table);
        },
      ]);
    } catch (error) {
      console.log(error);
    }
  },

  AnalyseClient: (req, res) => {
    try {
      const { codeclient } = req.body;
      if (!codeclient) {
        return res.status(201).json("please enter the customer code");
      }
      modelClient
        .aggregate([
          { $match: { unique_account_id: codeclient.trim().toUpperCase() } },
          {
            $lookup: {
              from: "actions",
              localField: "actionEnCours",
              foreignField: "idAction",
              as: "action",
            },
          },
          { $unwind: "$action" },
          {
            $lookup: {
              from: "status",
              localField: "action.idStatus",
              foreignField: "idStatus",
              as: "status",
            },
          },
          { $unwind: "$status" },
          {
            $lookup: {
              from: "roles",
              localField: "action.idRole",
              foreignField: "id",
              as: "role",
            },
          },
        ])
        .then((result) => {
          if (result.length > 0) {
            return res.status(200).json(result.reverse());
          } else {
            return res.status(201).json("No result found");
          }
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  },

  AttenteStatut: (req, res) => {
    try {
      const { idAction } = req.body;
      modelClient
        .aggregate([
          { $match: { actionEnCours: idAction } },
          {
            $lookup: {
              from: "actions",
              localField: "actionEnCours",
              foreignField: "idAction",
              as: "action",
            },
          },
          { $unwind: "$action" },
        ])
        .then((result) => {
          if (result.length > 0) {
            return res.status(200).json(result);
          } else {
            return res.status(201).json("No result found");
          }
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  },
};
