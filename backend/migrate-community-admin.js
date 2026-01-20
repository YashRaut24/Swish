import mongoose from 'mongoose';
import Community from './src/models/Community.js';
import { config } from 'dotenv';

config({ path: './.env' });

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    
    const result = await mongoose.connection.db.collection('communities').updateMany(
      { creator: { $exists: true } },
      [
        {
          $set: { admin: '$creator' },
          $unset: 'creator'
        }
      ]
    );

    console.log(`Migrated ${result.modifiedCount} communities`);

    
    const communities = await Community.find({ communityId: { $exists: false } });
    for (const community of communities) {
      const communityId = community.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Math.random().toString(36).substr(2, 9);
      community.communityId = communityId;
      await community.save();
      console.log(`Added communityId to community: ${community.name}`);
    }

    console.log(`Added communityId to ${communities.length} communities`);

    await mongoose.disconnect();
    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
