import "dotenv/config";
import { connectMongoose, closeMongoose } from "../src/db/mangoose";
import { userSeeder } from "./userSeeder";
import { exerciseTypeSeeder } from "./exerciseTypeSeeder";
import { gymSeeder } from "./gymSeeder";
import { badgeSeeder } from "./badgeSeeder";
import { badgeRuleSeeder } from "./badgeRuleSeeder";
import { challengeSeeder } from "./challengeSeeder";
import { rewardSeeder } from "./rewardSeeder";
import { 
  UserModel, 
  ExerciseTypeModel, 
  GymModel, 
  BadgeModel, 
  BadgeRuleModel,
  ChallengeModel,
  TrainingStatModel,
  ScoreModel,
  SocialChallengeModel,
  UserBadgeModel,
  ChallengeShareModel,
  RewardModel,
  UserRewardModel
} from "../src/models";

if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in environment variables.");
  process.exit(1);
}

const MONGO_URI = process.env.MONGODB_URI;

async function clearDatabase() {
  console.log("\n🗑️  Clearing existing data...");
  
  await UserModel.deleteMany({});
  await ExerciseTypeModel.deleteMany({});
  await GymModel.deleteMany({});
  await BadgeModel.deleteMany({});
  await BadgeRuleModel.deleteMany({});
  await ChallengeModel.deleteMany({});
  await TrainingStatModel.deleteMany({});
  await ScoreModel.deleteMany({});
  await SocialChallengeModel.deleteMany({});
  await UserBadgeModel.deleteMany({});
  await ChallengeShareModel.deleteMany({});
  await RewardModel.deleteMany({});
  await UserRewardModel.deleteMany({});
  
  console.log("✅ Database cleared\n");
}

async function seedDatabase() {
  try {
    console.log("🚀 Starting database seeding...\n");
    console.log(`📡 Connecting to MongoDB: ${MONGO_URI}`);
    
    await connectMongoose(MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

 
    await clearDatabase();

    
    const users = await userSeeder();
    const exerciseTypes = await exerciseTypeSeeder();
    const badges = await badgeSeeder();
    await badgeRuleSeeder();
    const rewards = await rewardSeeder();
    const gyms = await gymSeeder(users, exerciseTypes);
    const challenges = await challengeSeeder(users, exerciseTypes, gyms);

    console.log("\n✨ Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Exercise Types: ${exerciseTypes.length}`);
    console.log(`   - Badges: ${badges.length}`);
    console.log(`   - Badge Rules: seeded`);
    console.log(`   - Rewards: ${rewards.length}`);
    console.log(`   - Gyms: ${gyms.length}`);
    console.log(`   - Challenges: ${challenges.length}`);
    
    console.log("\n👤 Test accounts:");
    console.log("   Admin: admin@gym.com / Admin123!");
    console.log("   Manager: jean.manager@gym.com / Manager123!");
    console.log("   Member: marie.dupont@gym.com / Member123!");

  } catch (error) {
    console.error("\n❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await closeMongoose();
    console.log("\n📡 Disconnected from MongoDB");
    process.exit(0);
  }
}


seedDatabase();