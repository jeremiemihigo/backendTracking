const express = require("express");
const { LoginAgentAdmin, UpdatePassword } = require("../Controller/Login");
const { MainProcess, ReadMainProcess } = require("../Controller/MainProcess");
const router = express.Router();

const { protect } = require("../MiddleWare/protect");
const { AddProcess, ReadProcess } = require("../Controller/Process");

const { AddStatus, ReadStatus } = require("../Controller/Status");
const {
  AddAction,

  ReadAction,
  AddActionStatus,
} = require("../Controller/Action");
const { AddAdminAgent, ReadAgent } = require("../Controller/AgentAdmin");
const { AddDepartement } = require("../Controller/Departement");
const { AddRole, ReadRole } = require("../Controller/Role");
const { Etape, ReadEtape } = require("../Controller/Etapes");
const {
  Clients,
  PostReponse,
  RenseigneFeedback,
  PostClient,
} = require("../Controller/Client");
const { Historique } = require("../Controller/History");
const { Initiale, ReadInitiale } = require("../Controller/Initiale");
const {
  RemotedBy,
  CustomerDeedline,
  AnalyseClient,
  AttenteStatut,
} = require("../Controller/Analyse");
const { AddData, ReadData } = require("../Controller/DataToTrack");
const {
  AddTeams,
  AddMemberTeam,
  DeleteMember,
  DeleteAction,
} = require("../Controller/Teams");
const { Rapport } = require("../Controller/Rapport");
const { pushClientVisite } = require("../Controller/VisiteMenage");

//AgentAdmin
router.post("/agent", AddAdminAgent, ReadAgent);
//Login
router.post("/login", LoginAgentAdmin);
router.post("/resetpassword", UpdatePassword);

//Main process
router.post("/main", protect, MainProcess, ReadMainProcess);

//Process
router.post("/process", protect, AddProcess, ReadProcess);
//Status
router.post("/status", protect, AddStatus, ReadStatus);

//Actions
router.post("/action", protect, AddAction, ReadAction);
router.post("/statusLabel", protect, AddActionStatus, ReadAction);

//Departement
router.post("/departement", protect, AddDepartement);

//Roles
router.post("/role", protect, AddRole, ReadRole);

//Etapes
router.post("/etape", protect, Etape, ReadEtape);

//Clients
router.post("/client", protect, Clients);
router.post("/feedbackvm", pushClientVisite);
router.post("/postclient", protect, PostClient);
//History
router.post("/history", protect, Historique);
//Initial
router.post("/initiale", Initiale, ReadInitiale);
//Analyse
router.post("/remotedBy", RemotedBy);
router.post("/deedline", protect, CustomerDeedline);
router.post("/analyseClient", AnalyseClient);
router.post("/attenteStatut", AttenteStatut);

//DATA TO TRACK
router.post("/datatotrack", protect, AddData);

//Team
router.post("/team", protect, AddTeams);
router.post("/memberTeam", protect, AddMemberTeam);
router.post("/deletememberteam", protect, DeleteMember);
router.post("/deleteaction", protect, DeleteAction);

//Rapport
router.post("/rapport", Rapport);

module.exports = router;
