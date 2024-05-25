const modelDataToTrack = require("../Model/DataToTrack");
const { periode } = require("../Static/fonction");

module.exports = {
  AddData: (req, res) => {
    try {
      //A visité et à apeler
      const { data } = req.body;
      if (data.length > 0) {
        modelDataToTrack
          .insertMany(data)
          .then((result) => {
            if (result) {
              return res
                .status(200)
                .json(
                  `${data.length} customers have just been successfully registered`
                );
            }
          })
          .catch(function (err) {
            return res.status(201).json("Error : " + err);
          });
      }
    } catch (error) {
      return res.status(201).json("Error : " + error);
    }
  },
  ReadData: (req, res) => {
    try {
      const periodes = periode();
      console.log(periodes)
      modelDataToTrack
        .aggregate([
          { $match: { month: periodes } },
          {
            $lookup: {
              from: "clients",
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
          { $addFields: { id: "$_id" } },
        ])
        .then((result) => {
          if (result.length > 0) {
            return res.status(200).json(result.reverse());
          } else {
            return res.status(201).json([]);
          }
        })
        .catch(function (err) {
          return res.status(201).json("Error " + err);
        });
    } catch (error) {
      return res.status(201).json("Error " + error);
    }
  },
};
