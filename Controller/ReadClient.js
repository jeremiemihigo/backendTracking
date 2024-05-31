const modelClient = require("../Model/Tracker/Client");
const modelRole = require("../Model/Tracker/Role");
const modelAction = require("../Model/Tracker/Action");
const modelTeam = require("../Model/Teams");
const asyncLab = require("async");
const { periode } = require("../Static/fonction");

module.exports = {
  //Read Client Field and ZBM
  ReadClientField: (req, res) => {
    try {
      asyncLab.waterfall(
        [
          function (done) {
            if (req.user.role === "ZBM") {
              //Tous les clients de la region
              done(null, {
                $match: { active: true, shop_region: req.user.region },
              });
            }
            if (
              [
                "SYSTEM AND DATA",
                "FIELD",
                "MANAGING DIRECTOR",
                "SUPER USER",
              ].includes(req.user.role)
            ) {
              done(null, { $match: { active: true } });
            }
            if (
              [
                "CALL OPERATOR",
                "PROCESS OFFICER",
                "SHOP MANAGER",
                "RS",
              ].includes(req.user.role)
            ) {
              modelTeam
                .aggregate([
                  { $match: { idTeam: req.user.team } },
                  {
                    $lookup: {
                      from: "actions",
                      localField: "actions",
                      foreignField: "idAction",
                      as: "allaction",
                    },
                  },
                  { $unwind: "$allaction" },
                ])
                .then((actions) => {
                  let table = [];
                  if (actions.length > 0) {
                    for (let i = 0; i < actions.length; i++) {
                      table.push(actions[i].allaction.idAction);
                    }
                  }
                  if (req.user.role === "PROCESS OFFICER") {
                    done(null, {
                      $match: {
                        actionEnCours: { $in: table },
                        active: true,
                        shop_region: req.user.region,
                      },
                    });
                  }
                  if (req.user.role === "CALL OPERATOR") {
                    done(null, {
                      $match: {
                        actionEnCours: { $in: table },
                        active: true,
                      },
                    });
                  }
                  if (req.user.role === "SHOP MANAGER") {
                    done(null, {
                      $match: {
                        $or: [
                          {
                            "client.person_in_charge": {
                              $in: ["Tech", "Tech Volant"],
                            },
                            visited: "nVisited",
                          },
                          { actionEnCours: { $in: table } },
                        ],
                        shop_name: req.user.shop,
                        active: true,
                      },
                    });
                  }
                  if (req.user.role === "RS") {
                    done(null, {
                      $match: {
                        $or: [
                          {
                            "client.person_in_charge": {
                              $in: ["PA", "PA Volant", "Tech", "Tech Volant"],
                            },
                            visited: "nVisited",
                          },
                          { actionEnCours: { $in: table } },
                        ],
                        shop_name: req.user.shop,
                        active: true,
                      },
                    });
                  }
                })
                .catch(function (err) {
                  console.log(err);
                });
            }
          },
          function (recherche, done) {
            const periodes = periode();
            if (["SHOP MANAGER", "RS"].includes(req.user.role)) {
              modelClient
                .aggregate([
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
                      from: "statutactions",
                      localField: "action.idAction",
                      foreignField: "idAction",
                      as: "statutaction",
                    },
                  },
                  {
                    $lookup: {
                      from: "roles",
                      localField: "action.idRole",
                      foreignField: "id",
                      as: "role",
                    },
                  },
                  {
                    $addFields: {
                      id: "$_id",
                      actionTitle: "$action.title",
                      statusTitle: "$status.title",
                    },
                  },
                  {
                    $lookup: {
                      from: "datatotracks",
                      let: { codeclient: "$unique_account_id" },
                      pipeline: [
                        {
                          $match: {
                            $expr: {
                              $and: [
                                { $eq: ["$month", periodes] },
                                { $eq: ["$unique_account_id", "$$codeclient"] },
                              ],
                            },
                          },
                        },
                      ],
                      as: "client",
                    },
                  },
                  { $unwind: "$client" },
                  recherche,
                ])
                .then((response) => {
                  done(response);
                })
                .catch(function (err) {
                  console.log(err);
                });
            } else {
              modelClient
                .aggregate([
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
                      from: "statutactions",
                      localField: "action.idAction",
                      foreignField: "idAction",
                      as: "statutaction",
                    },
                  },
                  {
                    $lookup: {
                      from: "roles",
                      localField: "action.idRole",
                      foreignField: "id",
                      as: "role",
                    },
                  },
                  {
                    $addFields: {
                      id: "$_id",
                      actionTitle: "$action.title",
                      statusTitle: "$status.title",
                    },
                  },
                  {
                    $lookup: {
                      from: "datatotracks",
                      let: { codeclient: "$unique_account_id" },
                      pipeline: [
                        {
                          $match: {
                            $expr: {
                              $and: [
                                { $eq: ["$month", periodes] },
                                { $eq: ["$unique_account_id", "$$codeclient"] },
                              ],
                            },
                          },
                        },
                      ],
                      as: "client",
                    },
                  },
                  recherche,
                ])
                .then((response) => {
                  done(response);
                })
                .catch(function (err) {
                  console.log(err);
                });
            }
          },
        ],
        function (result) {
          if (result) {
            return res.status(200).json(result.reverse());
          } else {
            return res.status(200).json([]);
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
  ReadManagment: (req, res) => {
    try {
      asyncLab.waterfall(
        [
          function (done) {
            modelRole
              .findOne({ title: req.user.role })

              .then((role) => {
                if (role) {
                  done(null, role);
                }
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (role, done) {
            modelAction.find({ idRole: role.id }).then((actions) => {
              let table = [];
              for (let i = 0; i < actions.length; i++) {
                table.push(actions[i]?.idAction);
              }
              done(null, {
                $match: {
                  actionEnCours: { $in: table },
                  active: true,
                },
              });
            });
          },
          function (recherche, done) {
            const toDay = new Date();
            const periode = `${
              toDay.getMonth() + 1 < 10
                ? "0" + (toDay.getMonth() + 1)
                : toDay.getMonth() + 1
            }-${toDay.getFullYear()}`;
            modelClient
              .aggregate([
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
                    from: "statutactions",
                    localField: "action.idAction",
                    foreignField: "idAction",
                    as: "statutaction",
                  },
                },
                {
                  $lookup: {
                    from: "roles",
                    localField: "action.idRole",
                    foreignField: "id",
                    as: "role",
                  },
                },
                {
                  $addFields: {
                    id: "$_id",
                    actionTitle: "$action.title",
                    statusTitle: "$status.title",
                  },
                },
                {
                  $lookup: {
                    from: "datatotracks",
                    let: { codeclient: "$unique_account_id" },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              { $eq: ["$month", periode] },
                              { $eq: ["$unique_account_id", "$$codeclient"] },
                            ],
                          },
                        },
                      },
                    ],
                    as: "client",
                  },
                },
                recherche,
              ])
              .then((response) => {
                done(response);
              });
          },
        ],
        function (result) {
          if (result) {
            return res.status(200).json(result.reverse());
          } else {
            return res.status(200).json([]);
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
};
