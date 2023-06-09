const express = require("express");
const router = express.Router();

// Import the database query object
const pool = require("../database_setup/database");

// Import JWT functions from auth.js
const { authenticateToken } = require("../auth");

// ===== USER FUNCTIONS =====
// Create a new set
router.post(
    "/exercises/:exercise_id/sets",
    authenticateToken,
    async (req, res) => {
        const { exercise_id } = req.params;
        const { weight, reps } = req.body;
        const authenticated_id = req.user.user_id.toString();

        try {
            const userResult = await pool.query(
                "SELECT user_id FROM Exercises WHERE exercise_id = $1",
                [exercise_id]
            );

            const user_id = userResult.rows[0].user_id.toString();

            if (user_id === authenticated_id) {
                await pool.query("BEGIN");
                const result = await pool.query(
                    "INSERT INTO Sets (exercise_id, user_id, weight, reps) VALUES ($1, $2, $3, $4) RETURNING *",
                    [exercise_id, user_id, weight, reps]
                );
                await pool.query("COMMIT");
                res.status(201).json(result.rows[0]);
            } else {
                res.status(403).json(
                    "Unauthorized to create workout for this user"
                );
            }
        } catch (error) {
            console.error(error.message);
            await pool.query("ROLLBACK");
            res.status(500).send("Failed to create set");
        }
    }
);

// Get all sets for this exercise
router.get(
    "/exercises/:exercise_id/sets",
    authenticateToken,
    async (req, res) => {
        const { exercise_id } = req.params;
        const authenticated_id = req.user.user_id.toString();

        try {
            const userResult = await pool.query(
                "SELECT user_id FROM Exercises WHERE exercise_id = $1",
                [exercise_id]
            );

            const user_id = userResult.rows[0].user_id.toString();

            if (user_id === authenticated_id) {
                const result = await pool.query(
                    "SELECT * FROM Sets WHERE exercise_id = $1",
                    [exercise_id]
                );
                res.status(200).json(result.rows);
            } else {
                res.status(403).json(
                    "Unauthorized to create workout for this user"
                );
            }
        } catch (error) {
            console.error(error.message);
            res.status(500).send("Failed to fetch sets");
        }
    }
);

// Delete a set
router.delete("/sets/:set_id", authenticateToken, async (req, res) => {
    const { set_id } = req.params;
    const authenticated_id = req.user.user_id.toString();

    try {
        const userResult = await pool.query(
            "SELECT user_id FROM Sets WHERE set_id = $1",
            [set_id]
        );

        const user_id = userResult.rows[0].user_id.toString();

        if (user_id === authenticated_id) {
            await pool.query("DELETE FROM Sets WHERE set_id = $1", [set_id]);
            res.status(200).send("Successfully deleted set");
        } else {
            res.status(403).json(
                "Unauthorized to create workout for this user"
            );
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Failed to delete set");
    }
});

// ===== ADMIN FUNCTIONS =====
// Fetch all sets
router.get("/sets", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM Sets");
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Failed to fetch sets");
    }
});

// Export this router to use globally
module.exports = router;
