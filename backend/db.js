import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'app.db'));
db.pragma('journal_mode = WAL');

db.exec(`
    CREATE TABLE IF NOT EXISTS bmi_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        height REAL NOT NULL,
        weight REAL NOT NULL,
        unit_system TEXT NOT NULL CHECK(unit_system IN ('metric', 'imperial')),
        bmi_value REAL NOT NULL,
        category TEXT NOT NULL,
        health_tips TEXT,
        created_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS health_recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT UNIQUE NOT NULL,
        tips TEXT,
        nutritional_advice TEXT,
        activity_suggestions TEXT
    );
`);

function seedRecommendations() {
    const check = db.prepare('SELECT COUNT(*) as count FROM health_recommendations').get();
    if (check.count > 0) return;

    const insert = db.prepare(`
        INSERT INTO health_recommendations (category, tips, nutritional_advice, activity_suggestions)
        VALUES (?, ?, ?, ?)
    `);

    const recommendations = [
        {
            category: 'underweight',
            tips: JSON.stringify([
                'Focus on nutrient-dense foods to add healthy calories.',
                'Eat smaller, more frequent meals throughout the day.',
                'Consult a healthcare provider to rule out underlying issues.'
            ]),
            nutritional_advice: 'Incorporate healthy fats like avocado, nuts, and olive oil. Add protein sources like eggs, lean meats, and legumes to every meal.',
            activity_suggestions: 'Focus on strength training to build muscle mass rather than excessive cardio. Yoga and Pilates can help build body awareness.'
        },
        {
            category: 'normal',
            tips: JSON.stringify([
                'Maintain this balanced lifestyle with consistent habits.',
                'Stay hydrated and prioritize sleep.',
                'Listen to your body’s hunger and fullness cues.'
            ]),
            nutritional_advice: 'Continue eating a varied diet rich in fruits, vegetables, whole grains, and lean proteins. Allow for treats in moderation.',
            activity_suggestions: 'Mix aerobic activities like brisk walking or cycling with strength training twice a week. Find physical activities you genuinely enjoy.'
        },
        {
            category: 'overweight',
            tips: JSON.stringify([
                'Small, sustainable changes lead to long-term success.',
                'Focus on adding more vegetables to your plate.',
                'Celebrate non-scale victories like increased energy.'
            ]),
            nutritional_advice: 'Prioritize whole foods and reduce intake of processed sugars and refined carbs. Be mindful of portion sizes without depriving yourself.',
            activity_suggestions: 'Start with low-impact activities like swimming or walking. Aim for 150 minutes of moderate activity per week, broken into manageable chunks.'
        },
        {
            category: 'obese',
            tips: JSON.stringify([
                'Be kind to yourself on this journey; health is a marathon, not a sprint.',
                'Seek support from healthcare professionals or support groups.',
                'Focus on gaining health rather than just losing weight.'
            ]),
            nutritional_advice: 'Work with a dietitian if possible. Focus on satiating, fiber-rich foods. Keep a food journal to identify patterns and triggers.',
            activity_suggestions: 'Begin with chair exercises or water aerobics to reduce joint stress. Short, frequent walks (10 mins) are a great starting point.'
        }
    ];

    const insertMany = db.transaction((recs) => {
        for (const rec of recs) {
            insert.run(rec.category, rec.tips, rec.nutritional_advice, rec.activity_suggestions);
        }
    });

    insertMany(recommendations);
}

function createBMIRecord(data) {
    const stmt = db.prepare(`
        INSERT INTO bmi_records (height, weight, unit_system, bmi_value, category, health_tips)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(data.height, data.weight, data.unit_system, data.bmi_value, data.category, JSON.stringify(data.health_tips));
}

function getBMIHistory(limit = 50, offset = 0) {
    const stmt = db.prepare(`
        SELECT * FROM bmi_records 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
    `);
    const rows = stmt.all(limit, offset);
    return rows.map(row => ({
        ...row,
        health_tips: JSON.parse(row.health_tips)
    }));
}

function deleteBMIRecord(id) {
    const stmt = db.prepare('DELETE FROM bmi_records WHERE id = ?');
    return stmt.run(id);
}

function getHealthRecommendation(category) {
    const stmt = db.prepare('SELECT * FROM health_recommendations WHERE category = ?');
    const row = stmt.get(category);
    if (!row) return null;
    return {
        ...row,
        tips: JSON.parse(row.tips)
    };
}

export { db, seedRecommendations, createBMIRecord, getBMIHistory, deleteBMIRecord, getHealthRecommendation };