const jwt = require("jsonwebtoken");
const ModelAgentAdmin = require("../Model/AgentAdmin");
const { ObjectId } = require("mongodb");
const _ = require("lodash")

module.exports = {
  protect: async (req, res, next) => {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return res.status(201).json("token expired");
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded?.id) {
        return res.status(201).json("token expired");
      }
      ModelAgentAdmin.findOne({ _id: new ObjectId(decoded.id), active: true })
        .then((user) => {
      
          if (user) {
            req.user = user;
            next();
          } else {
            return res.status(201).json("token expired");
          }
        })
        .catch(function (err) {
          return res.status(201).json("token expired");
        });
    } catch (error) {
      return res.status(201).json("token expired");
    }
  },
  readUser: (req, res) => {
    try {
      let token;
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
      ) {
        token = req.headers.authorization.split(" ")[1];
      }
      if (token === "null") {
        return res.status(404).json("token expired");
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded) {
        return res.status(404).json("token expired");
      }

      ModelAgentAdmin.aggregate([
        { $match: { _id: new ObjectId(decoded.id), active: true } },
        {
          $lookup: {
            from: "roles",
            localField: "role",
            foreignField: "title",
            as: "allRoles",
          },
        },
        { $unwind: "$allRoles" },
        { $addFields: { roleId: "$allRoles.id" } },
        {
          $lookup: {
            from: "actions",
            localField: "roleId",
            foreignField: "idRole",
            as: "actionRole",
          },
        },
        {
          $lookup: {
            from: "teams",
            localField: "team",
            foreignField: "idTeam",
            as: "team",
          },
        },
        { $project: { allRoles: 0 } },
      ])
        .then((response) => {
          if (response.length === 1) {
            let table = response[0]?.actionRole.map(x=> x.idAction)
            if (response[0].team.length > 0) {
             for(let i=0; i<response[0].team[0].actions.length; i++){
             table.push(response[0].team[0].actions[i])
             }
            }
            response[0]["permission"] = table
            return res.status(200).json(response[0]);
          } else {
            return res.status(404).json("token expired");
          }
        })
        .catch(function (err) {
          return res.status(404).json("token expired");
        });
    } catch (error) {}
  },
};
