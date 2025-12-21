import { UserModel } from "../src/models";

export const userSeeder = async () => {
  const users = [
    {
      firstname: "Admin",
      lastname: "System",
      email: "admin@gym.com",
      password: "Admin123!",
      role: "admin",
      active: true
    },
    {
      firstname: "Jean",
      lastname: "Manager",
      email: "jean.manager@gym.com",
      password: "Manager123!",
      role: "manager",
      active: true
    },
    {
      firstname: "Marie",
      lastname: "Dupont",
      email: "marie.dupont@gym.com",
      password: "Member123!",
      role: "member",
      active: true
    },
    {
      firstname: "Pierre",
      lastname: "Martin",
      email: "pierre.martin@gym.com",
      password: "Member123!",
      role: "member",
      active: true
    },
    {
      firstname: "Sophie",
      lastname: "Bernard",
      email: "sophie.bernard@gym.com",
      password: "Member123!",
      role: "member",
      active: true
    }
  ];

  console.log("🌱 Seeding users...");
  
 
  const createdUsers = [];
  for (const userData of users) {
    const user = await UserModel.create(userData);
    createdUsers.push(user);
  }
  
  console.log(`✅ ${createdUsers.length} users created`);
  
  return createdUsers;
};
