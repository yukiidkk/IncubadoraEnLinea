const express = require("express");
const router = express.Router();
const { registro } = require("../controladores/registrocontrolador");

router.post("/registro", registro);

module.exports = router;
