"use strict";

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/Connection");
const app = express();
app.use(cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

const bodyParser = require("body-parser");
app.use(bodyParser.json());
require("dotenv").config();
connectDB();
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT || 8000;

const postTracker = require("./Routes/Post");
const getTracker = require("./Routes/Read");
const putTracker = require("./Routes/Update");

app.use("/tracker/post", postTracker);
app.use("/tracker/read", getTracker);
app.use("/tracker/update", putTracker);

const { Server } = require("socket.io");
const io = new Server({
  cors: {
    origin: "*",
  },
});
const modelClient = require("./Model/Tracker/Client");
const modelEtape = require("./Model/Tracker/Etapes");
const modelAction = require("./Model/Tracker/Action");
const asyncLab = require("async");
const { ObjectId } = require("mongodb");
const { periode } = require("./Static/fonction");

let onlineuser = [];

const addNewUser = (codeAgent, nom, socketId) => {
  !onlineuser.some((user) => user.codeAgent === codeAgent) &&
    onlineuser.push({
      codeAgent,
      nom,
      socketId,
    });
};
const removeUser = (socketId) => {
  if (onlineuser.length > 0) {
    onlineuser = onlineuser.filter((user) => user.socketId !== socketId);
  }
};

io.on("connection", (socket) => {
  socket.on("newUser", (donner) => {
    const { codeAgent, nom } = donner;
    addNewUser(codeAgent, nom, socket.id);
    io.emit("userConnected", onlineuser);
  });
  socket.on("renseignefeedback", (donner) => {
    if (donner.type === "feedback") {
      const {
        commentaire,
        customer_id,
        _idClient,
        status,
        role,
        dateDebut,
        action,
        ancienAction,
        codeAgent,
      } = donner;
      try {
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
                    let erreur = {
                      content: "Client introuvable",
                      error: "error",
                    };
                    io.to(socket.id).emit("renseigne", erreur);
                  }
                })
                .catch(function (err) {
                  console.log(err);
                });
            },
            function (result, done) {
              modelAction
                .findByIdAndUpdate(
                  ancienAction._id,
                  { $set: { lastchange: new Date() } },
                  { new: true }
                )
                .then((response) => {
                  done(null, result);
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
                        dateDebut,
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
                .catch(function (err) {
                  let erreur = { content: "Error :" + err, error: "error" };
                  io.to(socket.id).emit("renseigne", erreur);
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
                                { $eq: ["$unique_account_id", "$$codeclient"] },
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
              let result = { content: client, error: "success" };
              io.emit("renseigne", result);
            } else {
              let erreur = { content: "Error :", error: "error" };
              io.to(socket.id).emit("renseigne", erreur);
            }
          }
        );
      } catch (error) {
        console.log(error);
      }
    }
    if (donner.type === "post") {
      try {
        const {
          feedbackSelect,
          commentaire,
          customer_id,
          status,
          role,
          dateDebut,
          codeAgent,
          action,
        } = donner;
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
                    let erreur = {
                      content: "Client introuvable",
                      error: "error",
                    };
                    io.to(socket.id).emit("renseigne", erreur);
                  }
                })
                .catch(function (err) {
                  console.log(err);
                });
            },

            function (result, done) {
              if (result.actionEnCours === "Y13JKS") {
                done(null, {
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
                      let erreur = {
                        content: "Aucune étape suivante",
                        error: "error",
                      };
                      io.to(socket.id).emit("renseigne", erreur);
                    }
                  })
                  .catch(function (err) {
                    console.log(err);
                  });
              }
            },
            function (result, etape, done) {
              modelAction
                .findByIdAndUpdate(
                  feedbackSelect._id,
                  { $set: { lastchange: new Date() } },
                  { new: true }
                )
                .then((response) => {
                  done(null, result, etape);
                })
                .catch(function (err) {
                  console.log(err);
                });
            },
            function (result, etape, done) {
              const dates = new Date().toISOString();
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
                        dateDebut,
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
                  let erreur = {
                    content: "Error " + err,
                    error: "error",
                  };
                  io.to(socket.id).emit("renseigne", erreur);
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
                                { $eq: ["$unique_account_id", "$$codeclient"] },
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
              let result = { content: client, error: "success" };
              io.emit("renseigne", result);
            } else {
              let erreur = { content: "Error :", error: "error" };
              io.to(socket.id).emit("renseigne", erreur);
            }
          }
        );
      } catch (error) {
        console.log(error);
      }
    }
  });
  socket.on("disconnect", () => {
    removeUser(socket.id);
    io.emit("userConnected", onlineuser);
  });
});
const portIO = process.env.PORT || 800;
// io.listen(portIO);
//Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// // Socket.IO
