const Team = require("../Model/Teams");
const asyncLab = require("async");
const { generateString } = require("../Static/fonction");
const modelAgentAdmin = require("../Model/AgentAdmin");
const { ObjectId } = require("mongodb");

module.exports = {
  AddTeams: (req, res, next) => {
    try {
      const { title, role } = req.body;
      const { codeAgent } = req.user;
      if (!title || !role) {
        return res.status(201).json("Veuillez renseigner les champs");
      }
      asyncLab.waterfall(
        [
          function (done) {
            Team.findOne({
              title: title.toUpperCase(),
              role,
            })
              .lean()
              .then((result) => {
                if (result) {
                  return res.status(201).json("La team existe deja");
                } else {
                  done(null, result);
                }
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (team, done) {
            Team.create({
              title,
              role,
              createdBy: codeAgent,
              idTeam: generateString(6),
            })
              .then((result) => {
                if (result) {
                  done(result);
                } else {
                  return res.status(201).json("Erreur d'enregistrement");
                }
              })
              .catch(function (err) {
                console.log(err);
              });
          },
        ],
        function (result) {
          return res.status(200).json(result);
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
  ReadTeams: (req, res) => {
    try {
      Team.find({})
        .lean()
        .then((result) => {
          if (result.length > 0) {
            return res.status(200).json(result);
          }
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  },
  ReadTeamsRole: (req, res) => {
    console.log("suis la");
    try {
      const { role } = req.params;
      Team.aggregate([
        { $match: { role: role } },
        {
          $lookup: {
            from: "agentadmins",
            localField: "idTeam",
            foreignField: "team",
            as: "agent",
          },
        },
      ])

        .then((result) => {
          if (result.length > 0) {
            return res.status(200).json(result);
          }
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  },
  AddActionInTeam: (req, res, next) => {
    try {
      const { data, id } = req.body;
      Team.findByIdAndUpdate(
        id,
        {
          $set: {
            actions: data,
          },
        },
        { new: true }
      )
        .then((result) => {
          if (result) {
            req.recherche = id;
            next();
          }
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  },
  AddMemberTeam: (req, res) => {
    try {
      const { idTeam, id } = req.body;
      if (!idTeam || !id) {
        return res.status(201).json("Error");
      }
      modelAgentAdmin
        .findByIdAndUpdate(id, { $set: { team: idTeam } }, { new: true })
        .then((result) => {
          if (result) {
            return res.status(200).json(result);
          } else {
            return res.status(201).json("Error");
          }
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  },
  ReadOneTeam: (req, res) => {
    try {
      const { id } = req.params;
      const recherche = req.recherche ? req.recherche : id;
      Team.aggregate([
        { $match: { _id: new ObjectId(recherche) } },
        {
          $lookup: {
            from: "agentadmins",
            localField: "idTeam",
            foreignField: "team",
            as: "agents",
          },
        },
        {
          $lookup: {
            from: "actions",
            localField: "actions",
            foreignField: "idAction",
            as: "action",
          },
        },
      ])
        .then((result) => {
          if (result.length > 0) {
            let data = req.recherche ? result[0] : result.reverse();
            return res.status(200).json(data);
          }
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  },
  DeleteAction: (req, res) => {
    try {
      const { document, idAction } = req.body;
      if (!document || !idAction) {
        return res.status(201).json("Error");
      }
      asyncLab.waterfall([
        function (done) {
          Team.findByIdAndUpdate(
            document,
            { $pull: { actions: idAction } },
            { new: true }
          )
            .then((result) => {
              if (result) {
                return res.status(200).json(document);
              } else {
                return res.status(201).json("Error");
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
  DeleteMember: (req, res) => {
    try {
      const { id } = req.body;
      console.log(id);
      if (!id) {
        return res.status(201).json("Error");
      }
      modelAgentAdmin
        .findByIdAndUpdate(id, { $unset: { team: "" } }, { new: true })
        .then((result) => {
          if (result) {
            return res.status(200).json(id);
          } else {
            return res.status(201).json("Error");
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
