const express = require("express");

const { requireUser } = require("../controllers/authController");
const {
  addGoal,
  changePassword,
  contributeToGoal,
  deleteGoal,
  deleteAccount,
  updateBudget,
  updatePreferences,
  updateProfile
} = require("../controllers/userController");

const router = express.Router();

router.use(requireUser);
router.put("/profile", updateProfile);
router.put("/preferences", updatePreferences);
router.put("/budget", updateBudget);
router.put("/password", changePassword);
router.delete("/account", deleteAccount);
router.post("/goals", addGoal);
router.post("/goals/:goalId/contribute", contributeToGoal);
router.delete("/goals/:goalId", deleteGoal);

module.exports = router;
