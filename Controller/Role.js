const modelRole = require("../Model/Tracker/Role");
const asyncLab = require("async");
const { generateString } = require("../Static/fonction");
const { ObjectId } = require("mongodb");

module.exports = {
  AddRole: (req, res, next) => {
    try {
      const { title } = req.body;
      const id = generateString(8);
      const { codeAgent } = req.user;
      if (!title) {
        return res.status(404).json("Error");
      }

      asyncLab.waterfall(
        [
          function (done) {
            modelRole
              .findOne({ title: title.toUpperCase() })
              .then((role) => {
                if (role) {
                  return res.status(404).json("Ce role existe deja");
                } else {
                  done(null, role);
                }
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (role, done) {
            modelRole
              .create({
                title,
                id,
                savedBy: codeAgent,
              })
              .then((save) => {
                done(save);
              })
              .catch(function (err) {
                return res.status(404).json("Registration error " + err);
              });
          },
        ],
        function (result) {
          if (result) {
            req.recherche = result.id;
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
  AddMembers: (req, res, next) => {
    try {
      const { code, id, object } = req.body;
      if (!code || !id) {
        return res.status(201).json("Please fill in the fields");
      }
      asyncLab.waterfall(
        [
          function (done) {
            let script =
              object === "add"
                ? { $addToSet: { members: code } }
                : { $pull: { members: code } };
            console.log(script);
            modelRole
              .findByIdAndUpdate(id, script, { new: true })
              .then((result) => {
                done(result);
              })
              .catch(function (err) {
                return res.status(404).json("Error");
              });
          },
        ],
        function (result) {
          if (result) {
            req.recherche = id;
            next();
          } else {
            return res.status(404).json("Registration error");
          }
        }
      );
    } catch (error) {}
  },

  ReadRole: (req, res) => {
    try {
      const recherche = req.recherche;
      let match = recherche
        ? { $match: { _id: new ObjectId(recherche) } }
        : { $match: {} };
      modelRole
        .aggregate([
          match,
          {
            $lookup: {
              from: "agentadmins",
              localField: "members",
              foreignField: "codeAgent",
              as: "agents",
            },
          },
          {
            $lookup: {
              from: "agentadmins",
              localField: "leader",
              foreignField: "codeAgent",
              as: "leaderRole",
            },
          },
        ])
        .then((result) => {
          if (result.length > 0) {
            let data = recherche ? result[0] : result.reverse();
            return res.status(200).json(data);
          }
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {}
  },
  //Modification et affectation du leader
  UpdateRole: (req, res) => {
    try {
      const { codeLeader, id, title } = req.body;
      if (!codeLeader || !id || !title) {
        return res.status(404).json("Error");
      }
      asyncLab.waterfall(
        [
          function (done) {
            modelRole
              .findOneAndUpdate(
                { id },
                { $set: { title, leader: codeLeader } },
                { new: true }
              )
              .then((result) => {
                done(result);
              })
              .catch(function (err) {
                return res.status(404).json("Error");
              });
          },
        ],
        function (result) {
          if (result) {
            req.recherche = result.id;
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
