const express = require('express')
const {UpdateMainProcess,ReadMainProcess} = require('../Controller/MainProcess')
const router = express.Router()

const { protect } = require('../MiddleWare/protect')
const {UpdateProcess,ReadProcess,} = require('../Controller/Process')

const { UpdateStatus, ReadStatus } = require('../Controller/Status')
const {AddStatut} = require('../Controller/Action')
const {ReadRole,UpdateRole, AddMembers,} = require('../Controller/Role')
const { resetPassword, Bloquer } = require('../Controller/Login')
const { AddMemberTeam, AddActionInTeam, ReadOneTeam } = require('../Controller/Teams')

//AgentAdmin
router.put('/main', protect, UpdateMainProcess, ReadMainProcess)
router.put('/process', protect, UpdateProcess, ReadProcess)
//Status
router.put('/status', protect, UpdateStatus, ReadStatus)
//Actions
router.put('/addStatus', protect, AddStatut)
//Roles
router.put('/role', UpdateRole, ReadRole)
router.put('/addMember', protect, AddMembers, ReadRole)
//Reset password
router.put("/reset",protect, resetPassword)
router.put("/bloquer", protect, Bloquer)
//Team
router.put("/addMemberTeam", protect, AddMemberTeam, ReadOneTeam )
router.put("/addActionTeam", protect, AddActionInTeam, ReadOneTeam )

module.exports = router
