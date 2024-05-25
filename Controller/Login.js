const ModelAgentAdmin = require("../Model/AgentAdmin");
const asyncLab = require("async");
const bcrypt = require("bcrypt");

exports.LoginAgentAdmin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(201).json("Veuillez renseigner les champs");
  }
  try {
    //const user = await Model_User.aggregate([ look])
    const user = await ModelAgentAdmin.findOne({
      codeAgent: username,
      active: true,
    }).select("+password");

    if (!user) {
      return res.status(201).json("Accès non autorisée");
    }

    const isMatch = await user.matchPasswords(password);

    if (!isMatch) {
      return res.status(201).json("Accès non autorisée");
    }
    const token = user.getSignedToken();
    return res.status(200).json({ token, role : user?.role });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};
exports.resetPassword = (req, res) => {
  try {
    const { id } = req.body;
    asyncLab.waterfall(
      [
        function (done) {
          ModelAgentAdmin.findById(id).then((response) => {
            if (response) {
              done(null, response);
            } else {
              return res.status(201).json("Agent introuvable");
            }
          });
        },

        function (agent, done) {
          bcrypt.hash("1234", 10, function (err, bcrypePassword) {
            ModelAgentAdmin.findOneAndUpdate(
              { codeAgent: agent.codeAgent },
              { $set: { password: bcrypePassword, first: true } },
              { new: true }
            )
              .then((response) => {
                done(response);
              })
              .catch(function (err) {
                console.log(err);
              });
          });
        },
      ],
      function (response) {
        if (response) {
          return res.status(200).json(response);
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};
exports.Bloquer = (req, res) => {
  try {
    const { id } = req.body;
    asyncLab.waterfall(
      [
        function (done) {
          ModelAgentAdmin.findById(id).then((response) => {
            if (response) {
              done(null, response);
            } else {
              return res.status(201).json("Agent introuvable");
            }
          });
        },

        function (agent, done) {
          ModelAgentAdmin.findByIdAndUpdate(
            agent._id,
            { $set: { active: !agent.active } },
            { new: true }
          )
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
          return res.status(200).json(response);
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};
