import { GymModel } from "../src/models";
import { Types } from "mongoose";

export const gymSeeder = async (users: any[], exerciseTypes: any[]) => {
  const managers = users.filter(
    (u) => u.role === "manager" || u.role === "admin"
  );

  const gyms = [
    {
      name: "FitZone Paris",
      address: "15 Rue de la République, 75001 Paris",
      capacity: 150,
      equipment: [
        "Tapis de course",
        "Vélos",
        "Haltères",
        "Machines guidées",
        "Barres olympiques",
      ],
      facilities: ["Vestiaires", "Douches", "Parking", "WiFi", "Sauna"],
      owner: managers[0]._id,
      approved: true,
      description: "Salle de sport moderne au cœur de Paris",
      phone: "01 23 45 67 89",
      email: "contact@fitzone-paris.fr",
      exerciseTypes: exerciseTypes.slice(0, 6).map((e) => e._id),
      location: {
        type: "Point" as const,
        coordinates: [2.3522, 48.8566], // Paris
      },
      city: "Paris",
      postalCode: "75001",
      country: "France",
    },
    {
      name: "PowerGym Lyon",
      address: "42 Avenue des Sports, 69003 Lyon",
      capacity: 200,
      equipment: [
        "Racks à squat",
        "Bancs de musculation",
        "Kettlebells",
        "TRX",
        "Battle ropes",
      ],
      facilities: ["Vestiaires", "Douches", "Espace cardio", "Zone crossfit"],
      owner: managers[0]._id,
      approved: true,
      description: "Salle dédiée au CrossFit et musculation intensive",
      phone: "04 78 90 12 34",
      email: "info@powergym-lyon.fr",
      exerciseTypes: exerciseTypes.slice(3, 10).map((e) => e._id),
      location: {
        type: "Point" as const,
        coordinates: [4.8357, 45.764],
      },
      city: "Lyon",
      postalCode: "69003",
      country: "France",
    },
    {
      name: "BodyShape Marseille",
      address: "88 Boulevard de la Mer, 13008 Marseille",
      capacity: 120,
      equipment: [
        "Appareils cardio",
        "Poids libres",
        "Swiss balls",
        "Élastiques",
      ],
      facilities: [
        "Vestiaires",
        "Douches",
        "Cours collectifs",
        "Nutritionniste",
      ],
      owner: managers.length > 1 ? managers[1]._id : managers[0]._id,
      approved: true,
      description: "Remise en forme et bien-être en bord de mer",
      phone: "04 91 23 45 67",
      email: "contact@bodyshape-marseille.fr",
      exerciseTypes: exerciseTypes.slice(0, 5).map((e) => e._id),
      location: {
        type: "Point" as const,
        coordinates: [5.3698, 43.2965], // Marseille
      },
      city: "Marseille",
      postalCode: "13008",
      country: "France",
    },
    {
      name: "IronTemple Toulouse",
      address: "12 Rue du Muscle, 31000 Toulouse",
      capacity: 80,
      equipment: [
        "Plateforme haltérophilie",
        "Barres et disques olympiques",
        "Cages à squat",
      ],
      facilities: ["Vestiaires", "Douches", "Coaching personnalisé"],
      owner: managers[0]._id,
      approved: false,
      description: "Temple de la force pour athlètes confirmés",
      phone: "05 61 12 34 56",
      email: "irontemple@toulouse.fr",
      exerciseTypes: exerciseTypes
        .filter((e) => e.difficulty === "advanced")
        .map((e) => e._id),
      location: {
        type: "Point" as const,
        coordinates: [1.4442, 43.6047], // Toulouse
      },
      city: "Toulouse",
      postalCode: "31000",
      country: "France",
    },
  ];

  console.log("🌱 Seeding gyms...");
  const createdGyms = await GymModel.insertMany(gyms);
  console.log(`✅ ${createdGyms.length} gyms created`);

  return createdGyms;
};
