const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// We have to use a raw schema setup here because this is a CommonJS script (.cjs)
// and our main app uses ES modules. This avoids import issues.
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/service-marketplace';

const runSeed = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Check if admin exists
        const adminExists = await usersCollection.findOne({ email: 'admin@buildconnect.com' });

        if (adminExists) {
            console.log('Admin user already exists.');
        } else {
            console.log('Creating admin user...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            await usersCollection.insertOne({
                firstName: 'System',
                lastName: 'Admin',
                email: 'admin@buildconnect.com',
                password: hashedPassword,
                role: 'admin',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            console.log('Admin user created directly in DB! (admin@buildconnect.com / admin123)');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error seeding admin:', err);
        process.exit(1);
    }
};

runSeed();
