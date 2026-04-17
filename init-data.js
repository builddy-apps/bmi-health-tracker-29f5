import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'app.db'));
db.pragma('journal_mode = WAL');

// Check if data already exists
const count = db.prepare('SELECT COUNT(*) as count FROM bmi_records').get();
if (count.count > 0) {
    console.log('Data already seeded, skipping...');
    db.close();
    process.exit(0);
}

// Seed health_recommendations if empty
const recCount = db.prepare('SELECT COUNT(*) as count FROM health_recommendations').get();
if (recCount.count === 0) {
    const insertRec = db.prepare(`
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
                'Listen to your body\'s hunger and fullness cues.'
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

    const insertManyRecs = db.transaction((recs) => {
        for (const rec of recs) {
            insertRec.run(rec.category, rec.tips, rec.nutritional_advice, rec.activity_suggestions);
        }
    });

    insertManyRecs(recommendations);
}

// Insert BMI records
const insertBMI = db.prepare(`
    INSERT INTO bmi_records (height, weight, unit_system, bmi_value, category, health_tips, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const daysAgo = (days) => new Date(Date.now() - days * 86400000).toISOString();

const bmiRecords = [
    // Normal weight records - metric
    {
        height: 175,
        weight: 68,
        unit_system: 'metric',
        bmi_value: 22.2,
        category: 'normal',
        health_tips: JSON.stringify(['Maintain this balanced lifestyle with consistent habits.', 'Stay hydrated and prioritize sleep.', 'Listen to your body\'s hunger and fullness cues.']),
        created_at: daysAgo(28)
    },
    {
        height: 165,
        weight: 55,
        unit_system: 'metric',
        bmi_value: 20.2,
        category: 'normal',
        health_tips: JSON.stringify(['Maintain this balanced lifestyle with consistent habits.', 'Stay hydrated and prioritize sleep.', 'Listen to your body\'s hunger and fullness cues.']),
        created_at: daysAgo(25)
    },
    {
        height: 178,
        weight: 75,
        unit_system: 'metric',
        bmi_value: 23.7,
        category: 'normal',
        health_tips: JSON.stringify(['Maintain this balanced lifestyle with consistent habits.', 'Stay hydrated and prioritize sleep.', 'Listen to your body\'s hunger and fullness cues.']),
        created_at: daysAgo(22)
    },
    // Normal weight - imperial
    {
        height: 67,
        weight: 125,
        unit_system: 'imperial',
        bmi_value: 19.6,
        category: 'normal',
        health_tips: JSON.stringify(['Maintain this balanced lifestyle with consistent habits.', 'Stay hydrated and prioritize sleep.', 'Listen to your body\'s hunger and fullness cues.']),
        created_at: daysAgo(20)
    },
    {
        height: 64,
        weight: 108,
        unit_system: 'imperial',
        bmi_value: 18.5,
        category: 'normal',
        health_tips: JSON.stringify(['Maintain this balanced lifestyle with consistent habits.', 'Stay hydrated and prioritize sleep.', 'Listen to your body\'s hunger and fullness cues.']),
        created_at: daysAgo(18)
    },
    {
        height: 66,
        weight: 115,
        unit_system: 'imperial',
        bmi_value: 18.6,
        category: 'normal',
        health_tips: JSON.stringify(['Maintain this balanced lifestyle with consistent habits.', 'Stay hydrated and prioritize sleep.', 'Listen to your body\'s hunger and fullness cues.']),
        created_at: daysAgo(15)
    },
    // Overweight records
    {
        height: 180,
        weight: 85,
        unit_system: 'metric',
        bmi_value: 26.2,
        category: 'overweight',
        health_tips: JSON.stringify(['Small, sustainable changes lead to long-term success.', 'Focus on adding more vegetables to your plate.', 'Celebrate non-scale victories like increased energy.']),
        created_at: daysAgo(17)
    },
    {
        height: 160,
        weight: 72,
        unit_system: 'metric',
        bmi_value: 28.1,
        category: 'overweight',
        health_tips: JSON.stringify(['Small, sustainable changes lead to long-term success.', 'Focus on adding more vegetables to your plate.', 'Celebrate non-scale victories like increased energy.']),
        created_at: daysAgo(14)
    },
    {
        height: 163,
        weight: 78,
        unit_system: 'metric',
        bmi_value: 29.4,
        category: 'overweight',
        health_tips: JSON.stringify(['Small, sustainable changes lead to long-term success.', 'Focus on adding more vegetables to your plate.', 'Celebrate non-scale victories like increased energy.']),
        created_at: daysAgo(11)
    },
    {
        height: 70,
        weight: 190,
        unit_system: 'imperial',
        bmi_value: 27.3,
        category: 'overweight',
        health_tips: JSON.stringify(['Small, sustainable changes lead to long-term success.', 'Focus on adding more vegetables to your plate.', 'Celebrate non-scale victories like increased energy.']),
        created_at: daysAgo(9)
    },
    // Underweight records
    {
        height: 170,
        weight: 52,
        unit_system: 'metric',
        bmi_value: 18.0,
        category: 'underweight',
        health_tips: JSON.stringify(['Focus on nutrient-dense foods to add healthy calories.', 'Eat smaller, more frequent meals throughout the day.', 'Consult a healthcare provider to rule out underlying issues.']),
        created_at: daysAgo(13)
    },
    {
        height: 168,
        weight: 48,
        unit_system: 'metric',
        bmi_value: 17.0,
        category: 'underweight',
        health_tips: JSON.stringify(['Focus on nutrient-dense foods to add healthy calories.', 'Eat smaller, more frequent meals throughout the day.', 'Consult a healthcare provider to rule out underlying issues.']),
        created_at: daysAgo(7)
    },
    // Obese records
    {
        height: 172,
        weight: 95,
        unit_system: 'metric',
        bmi_value: 32.1,
        category: 'obese',
        health_tips: JSON.stringify(['Be kind to yourself on this journey; health is a marathon, not a sprint.', 'Seek support from healthcare professionals or support groups.', 'Focus on gaining health rather than just losing weight.']),
        created_at: daysAgo(10)
    },
    {
        height: 185,
        weight: 110,
        unit_system: 'metric',
        bmi_value: 32.1,
        category: 'obese',
        health_tips: JSON.stringify(['Be kind to yourself on this journey; health is a marathon, not a sprint.', 'Seek support from healthcare professionals or support groups.', 'Focus on gaining health rather than just losing weight.']),
        created_at: daysAgo(6)
    },
    {
        height: 69,
        weight: 210,
        unit_system: 'imperial',
        bmi_value: 31.0,
        category: 'obese',
        health_tips: JSON.stringify(['Be kind to yourself on this journey; health is a marathon, not a sprint.', 'Seek support from healthcare professionals or support groups.', 'Focus on gaining health rather than just losing weight.']),
        created_at: daysAgo(4)
    },
    // Recent records showing progress
    {
        height: 175,
        weight: 70,
        unit_system: 'metric',
        bmi_value: 22.9,
        category: 'normal',
        health_tips: JSON.stringify(['Maintain this balanced lifestyle with consistent habits.', 'Stay hydrated and prioritize sleep.', 'Listen to your body\'s hunger and fullness cues.']),
        created_at: daysAgo(3)
    },
    {
        height: 175,
        weight: 69,
        unit_system: 'metric',
        bmi_value: 22.5,
        category: 'normal',
        health_tips: JSON.stringify(['Maintain this balanced lifestyle with consistent habits.', 'Stay hydrated and prioritize sleep.', 'Listen to your body\'s hunger and fullness cues.']),
        created_at: daysAgo(2)
    },
    {
        height: 68,
        weight: 138,
        unit_system: 'imperial',
        bmi_value: 21.0,
        category: 'normal',
        health_tips: JSON.stringify(['Maintain this balanced lifestyle with consistent habits.', 'Stay hydrated and prioritize sleep.', 'Listen to your body\'s hunger and fullness cues.']),
        created_at: daysAgo(1)
    },
    {
        height: 170,
        weight: 60,
        unit_system: 'metric',
        bmi_value: 20.8,
        category: 'normal',
        health_tips: JSON.stringify(['Maintain this balanced lifestyle with consistent habits.', 'Stay hydrated and prioritize sleep.', 'Listen to your body\'s hunger and fullness cues.']),
        created_at: daysAgo(0.5)
    },
    {
        height: 71,
        weight: 165,
        unit_system: 'imperial',
        bmi_value: 23.0,
        category: 'normal',
        health_tips: JSON.stringify(['Maintain this balanced lifestyle with consistent habits.', 'Stay hydrated and prioritize sleep.', 'Listen to your body\'s hunger and fullness cues.']),
        created_at: daysAgo(0.2)
    }
];

const insertAll = db.transaction(() => {
    for (const record of bmiRecords) {
        insertBMI.run(
            record.height,
            record.weight,
            record.unit_system,
            record.bmi_value,
            record.category,
            record.health_tips,
            record.created_at
        );
    }
});

insertAll();

const finalCount = db.prepare('SELECT COUNT(*) as count FROM bmi_records').get();
const recFinalCount = db.prepare('SELECT COUNT(*) as count FROM health_recommendations').get();

console.log('Seeded successfully!');
console.log(`- ${finalCount.count} BMI records`);
console.log(`- ${recFinalCount.count} health recommendations`);
console.log('\nSample data includes:');
console.log('- BMI records spanning the last 30 days');
console.log('- Mix of metric and imperial measurements');
console.log('- All BMI categories: underweight, normal, overweight, obese');
console.log('- Health tips personalized for each category');

db.close();