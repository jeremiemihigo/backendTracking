const modelClient = require("../Model/Tracker/Client");
const modelEtape = require("../Model/Tracker/Etapes");
const asyncLab = require("async");

module.exports = {
  Clients: (req, res) => {
    try {
      //A visité et à apeler

      const { data } = req.body;

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
  PostClient: (req, res) => {
    try {
      if (req.body?.type === "feedback") {
        try {
          const {
            commentaire,
            customer_id,
            _idClient,
            status,
            role,
            action,
            ancienAction,
            codeAgent,
          } = req.body;
          asyncLab.waterfall(
            [
              function (done) {
                modelClient
                  .findById(_idClient)
                  .lean()
                  .then((result) => {
                    if (result) {
                      done(null, result);
                    } else {
                      return res.status(201).json("Client introuvable");
                    }
                  })
                  .catch(function (err) {
                    console.log(err);
                  });
              },

              function (result, done) {
                modelClient
                  .findByIdAndUpdate(
                    result._id,
                    {
                      $push: {
                        result: {
                          action: ancienAction?.title,
                          commentaire,
                          customer_id,
                          status,
                          role,
                          feedbackSelect: action?.title,
                          dateDebut: result?.updatedAt,
                          delaiPrevu: ancienAction?.delai,
                          dateFin: new Date().getTime(),
                          codeAgent,
                        },
                      },
                      $set: {
                        actionEnCours: action?.idAction,
                        updatedAt: new Date().getTime(),
                      },
                    },
                    { new: true }
                  )
                  .then((response) => {
                    done(null, response);
                  })
                  .catch(function (err) {});
              },
              function (client, done) {
                const periodes = periode();
                modelClient
                  .aggregate([
                    { $match: { _id: new ObjectId(client._id) } },
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
                                  {
                                    $eq: ["$unique_account_id", "$$codeclient"],
                                  },
                                ],
                              },
                            },
                          },
                        ],
                        as: "client",
                      },
                    },
                  ])
                  .then((response) => {
                    if (response.length > 0) {
                      done(response);
                    }
                  });
              },
            ],
            function (client) {
              if (client) {
                return res.status(200).json(client);
              } else {
                return res.status(201).json("Error");
              }
            }
          );
        } catch (error) {
          console.log(error);
        }
      }
      if (req.body.type === "post") {
        try {
          const {
            feedbackSelect,
            commentaire,
            customer_id,
            status,
            role,
            codeAgent,
            action,
          } = req.body;
          asyncLab.waterfall(
            [
              function (done) {
                modelClient
                  .findOne({
                    unique_account_id: customer_id,
                    actionEnCours: action.idAction,
                  })
                  .lean()
                  .then((result) => {
                    if (result) {
                      done(null, result);
                    } else {
                      return res.status(201).json("error");
                    }
                  })
                  .catch(function (err) {
                    console.log(err);
                  });
              },

              function (result, done) {
                if (result.actionEnCours === "Y13JKS") {
                  done(null, result, {
                    label: "Y13JKS",
                    next: "XZ445X",
                  });
                } else {
                  modelEtape
                    .findOne({ label: feedbackSelect?.idLabel })
                    .lean()
                    .then((etape) => {
                      if (etape) {
                        done(null, result, etape);
                      } else {
                        return res.status(201).json("error");
                      }
                    })
                    .catch(function (err) {
                      console.log(err);
                    });
                }
              },
              function (result, etape, done) {
                modelClient
                  .findByIdAndUpdate(
                    result._id,
                    {
                      $push: {
                        result: {
                          feedbackSelect: feedbackSelect?.title,
                          commentaire,
                          customer_id,
                          status,
                          role,
                          dateDebut: result?.updatedAt,
                          delaiPrevu: action?.delai,
                          action: action?.title,
                          dateFin: new Date().getTime(),
                          codeAgent,
                        },
                      },
                      $set: {
                        actionEnCours: etape.next,
                        updatedAt: new Date().getTime(),
                      },
                    },
                    { new: true }
                  )
                  .then((response) => {
                    done(null, response);
                  })
                  .catch(function (err) {
                    return res.status(201).json("error");
                  });
              },
              function (client, done) {
                const periodes = periode();
                modelClient
                  .aggregate([
                    { $match: { _id: new ObjectId(client._id) } },
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
                                  {
                                    $eq: ["$unique_account_id", "$$codeclient"],
                                  },
                                ],
                              },
                            },
                          },
                        ],
                        as: "client",
                      },
                    },
                  ])
                  .then((response) => {
                    if (response.length > 0) {
                      done(response);
                    }
                  });
              },
            ],
            function (client) {
              if (client) {
                return res.status(201).json(client);
              } else {
                return res.status(201).json("error");
              }
            }
          );
        } catch (error) {
          console.log(error);
        }
      }
    } catch (error) {}
  },
};
