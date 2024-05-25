const modelClient = require("../Model/Tracker/Client");
const modelEtape = require("../Model/Tracker/Etapes");
const asyncLab = require("async");

module.exports = {
  Clients: (req, res) => {
    try {
      //A visité et à apeler

      const { data, title } = req.body;

      asyncLab.waterfall([
        function (done) {
          if (data.length > 0 && title === "Feedback") {
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
          } else {
            done(null, true);
          }
        },
        function (result, done) {
          if (data.length > 0 && title === "Client") {
            modelClient
              .insertMany(data)
              .then((response) => {
                if (response) {
                  return res.status(200).json("Enregistrement effectuer");
                } else {
                  return res.status(200).json("Erreur d'enregistrement");
                }
              })
              .catch(function (err) {
                console.log(err);
              });
          } else {
            done(result);
          }
        },
      ]);
    } catch (error) {
      console.log(error);
    }
  },

  PostReponse: (req, res) => {
    try {
      const {
        feedbackSelect,
        commentaire,
        customer_id,
        status,
        role,
        dateDebut,
        action,
      } = req.body;
      const { codeAgent, _id } = req.user;
      let dateFin = new Date();

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
                  return res.status(404).json("Client introuvable");
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
                    return res.status(404).json("Aucune étape suivante");
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
                      dateDebut,
                      delaiPrevu: action?.delai,
                      action: action?.title,
                      dateFin: dateFin,
                      codeAgent,
                    },
                  },
                  $set: {
                    actionEnCours: etape.next,
                  },
                },
                { new: true }
              )
              .then((response) => {
                console.log(response);
                done(response);
              })
              .catch(function (err) {
                return res.status(404).json("Error " + err);
              });
          },
        ],
        function (client) {
          if (client) {
            return res.status(200).json(client);
          } else {
            return res.status(404).json("Error");
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
  RenseigneFeedback: (req, res) => {
    try {
      console.log(req.body);
      const {
        commentaire,
        customer_id,
        _idClient,
        status,
        role,
        dateDebut,
        action,
        ancienAction,
      } = req.body;
      const { codeAgent } = req.user;
      let dateFin = new Date();

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
                  return res.status(404).json("Client introuvable");
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
                      dateDebut,
                      delaiPrevu: ancienAction?.delai,

                      dateFin: dateFin,
                      codeAgent,
                    },
                  },
                  $set: {
                    actionEnCours: action?.idAction,
                  },
                },
                { new: true }
              )
              .then((response) => {
                done(response);
              })
              .catch(function (err) {
                return res.status(404).json("Error " + err);
              });
          },
        ],
        function (client) {
          if (client) {
            return res.status(200).json(client);
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
