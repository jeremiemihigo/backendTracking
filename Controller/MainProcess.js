const modelMainProcess = require("../Model/Tracker/MainProcess");
const asyncLab = require("async");
const { generateNumber } = require("../Static/fonction");
const modelCorbeille = require("../Model/Tracker/Corbeille");

module.exports = {
  MainProcess: (req, res, next) => {
    console.log(req.body);
    try {
      const { title } = req.body;
      const codeAgent = "1012";
      const idMainProcess = generateNumber(7);
      if (!title) {
        return res.status(201).json("please fill in the main process");
      }

      modelMainProcess
        .create({
          title,
          idMainProcess,
          savedBy: codeAgent,
        })
        .then((result) => {
          if (result) {
            req.recherche = result.idMainProcess;
            next();
          } else {
            return res.status(201).json("registration error");
          }
        })
        .catch(function (err) {
          return res.status(201).json("Error");
        });
    } catch (error) {
      console.log(error);
    }
  },
  UpdateMainProcess: (req, res, next) => {
    try {
      const { title, _id } = req.body;
      const { codeAgent } = req.user;
      if (!title) {
        return res.status(201).json("please enter the title");
      }
      asyncLab.waterfall(
        [
          function (done) {
            modelMainProcess
              .findById(_id)
              .lean()
              .then((main) => {
                if (main) {
                  done(null, main);
                } else {
                  return res.status(201).json("Main process not found");
                }
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (main, done) {
            modelMainProcess
              .findByIdAndUpdate(main._id, { $set: { title } }, { new: true })
              .then((result) => {
                if (result) {
                  done(null, main, result);
                } else {
                  return res.status(201).json("modification error");
                }
              })
              .catch(function (err) {
                console.log(err);
              });
          },
          function (ancien, nouveau, done) {
            modelCorbeille
              .create({
                texte: `@${codeAgent} changed the process main  ${ancien.title} to ${nouveau.title} `,
              })
              .then((result) => {
                done(ancien);
              })
              .catch(function (err) {
                console.log(err);
              });
          },
        ],
        function (result) {
          req.recherche = result.idMainProcess;
          next();
        }
      );
    } catch (error) {
      console.log(error);
    }
  },
  ReadMainProcess: (req, res) => {
    try {
      const recherche = req.recherche;
      let match = recherche
        ? { $match: { idMainProcess: recherche } }
        : { $match: {} };

      modelMainProcess
        .aggregate([
          match,
          {
            $lookup: {
              from: "processes",
              localField: "idMainProcess",
              foreignField: "idMainProcess",
              as: "allProcess",
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
    } catch (error) {
      console.log(error);
    }
  },
};
