const express = require("express");

const { requireUser } = require("../controllers/authController");
const {
  addGoal,
  contributeToGoal,
  updateBudget,
  updatePreferences,
  updateProfile
} = require("../controllers/userController");

const router = express.Router();

router.use(requireUser);
router.put("/profile", updateProfile);
router.put("/preferences", updatePreferences);
router.put("/budget", updateBudget);
router.post("/goals", addGoal);
router.post("/goals/:goalId/contribute", contributeToGoal);

module.exports = router;
