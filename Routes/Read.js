const express = require("express");
const { ReadMainProcess } = require("../Controller/MainProcess");
const router = express.Router();
const { protect, readUser } = require("../MiddleWare/protect");
const { ReadProcess } = require("../Controller/Process");
const { ReadStatus } = require("../Controller/Status");
const { ReadAgent } = require("../Controller/AgentAdmin");
const { ReadDepartement } = require("../Controller/Departement");
const { ReadRole } = require("../Controller/Role");
const { ReadEtape, ReadTechNTech } = require("../Controller/Etapes");
const { ReadInitiale } = require("../Controller/Initiale");
const { RoleAttente } = require("../Controller/Analyse");
const { ReadAction } = require("../Controller/Action");
const { ReadClientField, ReadManagment } = require("../Controller/ReadClient");
const { ReadData } = require("../Controller/DataToTrack");
const {
  ReadTeams,
  ReadTeamsRole,
  ReadOneTeam,
} = require("../Controller/Teams");

//AgentAdmin
router.get("/agent", protect, ReadAgent);
//Login
router.get("/user", readUser);
//Main process
router.get("/main", protect, ReadMainProcess);
//Process
//action
router.get("/action", protect, ReadAction);

router.get("/process", protect, ReadProcess);
//Status
router.get("/status", protect, ReadStatus);
//Actions
//Departement
router.get("/departement", protect, ReadDepartement);
//Roles
router.get("/role", protect, ReadRole);
//Etapes
router.get("/etape", protect, ReadEtape);
//Clients
router.get("/clientField", protect, ReadClientField);
router.get("/readManagment", protect, ReadManagment);
// router.get("/demandeFeedback", protect, ReadDemandFeedback)
//History
//Initial
router.get("/initiale", protect, ReadInitiale);
//Tech Non tech
router.get("/techNonTech", ReadTechNTech);
//Analyse
router.get("/analyseRole/:id", protect, RoleAttente);

//DATA TO TRACK
router.get("/read_data_to_track", ReadData);

//Team
router.get("/team", protect, ReadTeams);
router.get("/teamrole/:role", protect, ReadTeamsRole);
router.get("/oneTeam/:id", ReadOneTeam);
//Historique

module.exports = router;
