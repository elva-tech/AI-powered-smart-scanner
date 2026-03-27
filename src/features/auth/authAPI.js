export const loginAPI = async (email, password) => {
  await new Promise((res) => setTimeout(res, 800));

  let role = "User";
  let name = "User";

  if (email === "admin@corp.com") {
    role = "Administrator";
    name = "Admin";
  } else if (email === "analyst@corp.com") {
    role = "Analyst";
    name = "Analyst";
  }

  return {
    success: true,
    data: {
      email,
      name,
      role,
    },
  };
};