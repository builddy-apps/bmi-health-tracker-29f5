import express from 'express';
import cors from 'cors';
import { db, seedRecommendations, createBMIRecord, getBMIHistory, deleteBMIRecord, getHealthRecommendation } from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Seed health recommendations on startup
seedRecommendations();

// Helper function to calculate BMI value
function calculateBMIValue(height, weight, unitSystem) {
    if (unitSystem === 'metric') {
        const heightInMeters = height / 100;
        return weight / (heightInMeters * heightInMeters);
    } else {
        return (weight / (height * height)) * 703;
    }
}

// Helper function to determine BMI category
function getBMICategory(bmi) {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
}

// POST /api/bmi/calculate - Calculate BMI, save to DB, return results
app.post('/api/bmi/calculate', (req, res) => {
    try {
        const { height, weight, unit_system } = req.body;

        if (!height || !weight || !unit_system) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: height, weight, unit_system'
            });
        }

        if (height <= 0 || weight <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Height and weight must be positive numbers'
            });
        }

        if (!['metric', 'imperial'].includes(unit_system)) {
            return res.status(400).json({
                success: false,
                error: 'unit_system must be either "metric" or "imperial"'
            });
        }

        const bmiValue = calculateBMIValue(height, weight, unit_system);
        const category = getBMICategory(bmiValue);
        const recommendation = getHealthRecommendation(category);
        const healthTips = recommendation ? JSON.parse(recommendation.tips) : [];

        const recordData = {
            height,
            weight,
            unit_system,
            bmi_value: bmiValue,
            category,
            health_tips: healthTips
        };

        const result = createBMIRecord(recordData);

        res.json({
            success: true,
            data: {
                id: result.lastInsertRowid,
                bmi: parseFloat(bmiValue.toFixed(1)),
                category,
                health_tips: healthTips,
                recommendation: recommendation ? {
                    nutritional_advice: recommendation.nutritional_advice,
                    activity_suggestions: recommendation.activity_suggestions
                } : null,
                created_at: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('BMI calculation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate BMI'
        });
    }
});

// GET /api/bmi/history - Returns paginated history
app.get('/api/bmi/history', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const history = getBMIHistory(limit, offset);

        res.json({
            success: true,
            data: history,
            pagination: {
                page,
                limit,
                totalRecords: history.length
            }
        });
    } catch (error) {
        console.error('History fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve history'
        });
    }
});

// GET /api/health-tips/:category - Returns personalized tips for BMI category
app.get('/api/health-tips/:category', (req, res) => {
    try {
        const category = req.params.category.toLowerCase();
        const validCategories = ['underweight', 'normal', 'overweight', 'obese'];

        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid category. Must be: underweight, normal, overweight, or obese'
            });
        }

        const recommendation = getHealthRecommendation(category);

        if (!recommendation) {
            return res.status(404).json({
                success: false,
                error: 'No recommendations found for this category'
            });
        }

        res.json({
            success: true,
            data: recommendation
        });
    } catch (error) {
        console.error('Health tips fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve health tips'
        });
    }
});

// DELETE /api/bmi/history/:id - Delete specific record
app.delete('/api/bmi/history/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid record ID'
            });
        }

        const result = deleteBMIRecord(id);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Record not found'
            });
        }

        res.json({
            success: true,
            message: 'Record deleted successfully'
        });
    } catch (error) {
        console.error('Delete record error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete record'
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'An unexpected server error occurred'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`BMI Health Tracker server running on http://localhost:${PORT}`);
});