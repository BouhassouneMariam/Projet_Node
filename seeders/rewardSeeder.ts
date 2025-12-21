import { RewardModel } from "../src/models";

export const rewardSeeder = async () => {
    const rewards = [
       
        {
            name: "Premier Défi",
            description: "Complétez votre premier défi",
            type: "trophy",
            iconUrl: "/rewards/first-challenge.svg",
            rarity: "common",
            conditionType: "challengeComplete",
            isActive: true
        },
        {
            name: "Débutant Victorieux",
            description: "Complétez un défi de niveau débutant",
            type: "medal",
            iconUrl: "/rewards/beginner-medal.svg",
            rarity: "common",
            conditionType: "challengeComplete",
            conditionDifficulty: "beginner",
            isActive: true
        },
        {
            name: "Guerrier Intermédiaire",
            description: "Complétez un défi de niveau intermédiaire",
            type: "medal",
            iconUrl: "/rewards/intermediate-medal.svg",
            rarity: "rare",
            conditionType: "challengeComplete",
            conditionDifficulty: "intermediate",
            isActive: true
        },
        {
            name: "Maître Avancé",
            description: "Complétez un défi de niveau avancé",
            type: "trophy",
            iconUrl: "/rewards/advanced-trophy.svg",
            rarity: "epic",
            conditionType: "challengeComplete",
            conditionDifficulty: "advanced",
            isActive: true
        },
        
        {
            name: "Esprit d'Équipe",
            description: "Complétez votre premier défi social",
            type: "medal",
            iconUrl: "/rewards/team-spirit.svg",
            rarity: "rare",
            conditionType: "socialComplete",
            isActive: true
        },
        {
            name: "Duo de Choc",
            description: "Complétez un défi social avancé",
            type: "trophy",
            iconUrl: "/rewards/power-duo.svg",
            rarity: "legendary",
            conditionType: "socialComplete",
            conditionDifficulty: "advanced",
            isActive: true
        },
       
        {
            name: "Centurion",
            description: "Atteignez 100 points",
            type: "title",
            iconUrl: "/rewards/centurion.svg",
            rarity: "common",
            conditionType: "pointsThreshold",
            conditionValue: 100,
            isActive: true
        },
        {
            name: "Gladiateur",
            description: "Atteignez 500 points",
            type: "title",
            iconUrl: "/rewards/gladiator.svg",
            rarity: "rare",
            conditionType: "pointsThreshold",
            conditionValue: 500,
            isActive: true
        },
        {
            name: "Champion",
            description: "Atteignez 1000 points",
            type: "trophy",
            iconUrl: "/rewards/champion.svg",
            rarity: "epic",
            conditionType: "pointsThreshold",
            conditionValue: 1000,
            isActive: true
        },
        {
            name: "Légende Vivante",
            description: "Atteignez 5000 points",
            type: "trophy",
            iconUrl: "/rewards/legend.svg",
            rarity: "legendary",
            conditionType: "pointsThreshold",
            conditionValue: 5000,
            isActive: true
        }
    ];

    console.log("🌱 Seeding rewards...");
    
    const existingRewards = await RewardModel.countDocuments();
    if (existingRewards > 0) {
        console.log("Rewards already exist. Skipping seeding.");
        return [];
    }

    const createdRewards = await RewardModel.insertMany(rewards);
    console.log(`✅ ${createdRewards.length} rewards created`);
    
    return createdRewards;
};