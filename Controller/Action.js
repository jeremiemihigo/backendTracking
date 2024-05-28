const modelAction = require("../Model/Tracker/Action");
const modelStatut = require("../Model/Tracker/StatutAction");
const asyncLab = require("async");
const { generateString } = require("../Static/fonction");
const ActionStatus = require("../Model/Tracker/StatutAction");

module.exports = {
  AddAction: (req, res, next) => {
    try {
      console.log(req.body);
      const { idStatus, title, color, idRole, delai, objectif } = req.body;

      if (!idStatus || !title || !delai) {
        return res.status(404).json("Please fill in the fields");
      }
      const { codeAgent } = req.user;
      asyncLab.waterfall(
        [
          function (done) {
            modelAction
              .findOne({ idStatus, title })
              .then((conforme) => {
                if (conforme) {
                  return res.status(404).json("This action already exists");
                } else {
                  done(null, conforme);
                }
              })
              .catch(function (err) {
                return res.status(404).json("Erreur");
              });
          },
          function (result, done) {
            modelAction
              .create({
                idStatus,
                title,
                idRole,
                color,
                idAction: generateString(6),
                delai,
                objectif,
                savedBy: codeAgent,
              })
              .then((response) => {
                done(response);
              })
              .catch(function (err) {
                console.log(err);
                return res.status(404).json("Erreur");
              });
          },
        ],
        function (result) {
          if (result) {
            req.recherche = result.idAction;
            next();
          } else {
            return res.status(404).json("Registration error");
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
  AddStatut: (req, res) => {
    try {
      const { idAction, title } = req.body;
      const { codeAgent } = req.user;
      if (!idAction || !title) {
        return res.status(201).json("Please fill in the fields");
      }
      const idStatut = generateString(10);
      asyncLab.waterfall(
        [
          function (done) {
            modelStatut
              .findOne({ idAction, title })
              .then((exist) => {
                if (exist) {
                  return res.status(201).json("This status already exists");
                } else {
                  done(null, exist);
                }
              })
              .catch(function (err) {
                return res.status(201).json("Registration error");
              });
          },
          function (exis, done) {
            modelStatut
              .create({ title, idStatut, idAction, savedBy: codeAgent })

              .then((action) => {
                done(action);
              })
              .catch(function (err) {
                return res.status(201).json("Registration error");
              });
          },
        ],
        function (result) {
          if (result) {
            return res.status(200).json(result);
          } else {
            return res.status(201).json("Registration error");
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
  ReadStatut: (req, res) => {
    try {
      const recherche = req.recherche;
      let match = recherche
        ? { $match: { idRole: recherche } }
        : { $match: {} };
      modelStatut
        .aggregate([
          match,
          {
            $lookup: {
              from: "agentadmins",
              localField: "savedBy",
              foreignField: "codeAgent",
              as: "agentSave",
            },
          },
          {
            $unwind: "$agentSave",
          },
          {
            $lookup: {
              from: "actions",
              localField: "idAction",
              foreignField: "idAction",
              as: "action",
            },
          },
          {
            $unwind: "$action",
          },
          {
            $lookup: {
              from: "statuss",
              localField: "action.idStatus",
              foreignField: "idStatus",
              as: "status",
            },
          },
          {
            $unwind: "$status",
          },
          {
            $lookup: {
              from: "roles",
              localField: "action.idRole",
              foreignField: "idRole",
              as: "role",
            },
          },
          {
            $unwind: "$role",
          },
        ])
        .then((response) => {
          if (response.length > 0) {
            let data = recherche ? response[0] : response.reverse();
            return res.status(200).json(data);
          }
        });
    } catch (error) {}
  },
  ReadAction: (req, res) => {
    try {
      const recherche = req.recherche;
      let match = recherche
        ? { $match: { idAction: recherche } }
        : { $match: {} };

      modelAction
        .aggregate([
          match,
          {
            $lookup: {
              from: "status",
              localField: "idStatus",
              foreignField: "idStatus",
              as: "status",
            },
          },
          {
            $unwind: "$status",
          },
          {
            $lookup: {
              from: "statutactions",
              localField: "idAction",
              foreignField: "idAction",
              as: "statusAction",
            },
          },
          {
            $lookup: {
              from: "roles",
              localField: "idRole",
              foreignField: "id",
              as: "roles",
            },
          },
        ])
        .then((result) => {
          if (result.length > 0) {
            let data = recherche ? result[0] : result.reverse();
            return res.status(200).json(data);
          }
        });
    } catch (error) {
      console.log(error);
    }
  },
  //Action status
  AddActionStatus: (req, res, next) => {
    try {
      const { title, idAction } = req.body;

      const { codeAgent } = req.user;
      if (!title || !idAction) {
        return res.status(404).json("Error");
      }
      asyncLab.waterfall(
        [
          function (done) {
            ActionStatus.findOne({
              title: title.toUpperCase(),
              idAction,
            })
              .lean()
              .then((result) => {
                if (result) {
                  return res.status(404).json("this status already exists");
                } else {
                  done(null, true);
                }
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (result, done) {
            ActionStatus.create({
              title,
              savedBy: codeAgent,
              idLabel: generateString(7),
              idAction,
            })
              .then((response) => {
                done(response);
              })
              .catch(function (err) {
                console.log(err);
              });
          },
        ],
        function (response) {
          if (response) {
            req.recherche = idAction;
            next();
          } else {
            return res.status(404).json("Error");
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
};
