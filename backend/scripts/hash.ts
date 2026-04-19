import authController from "../auth/controller.ts";

const password = process.argv[2];
if (!password) {
  console.error("Usage: npx tsx src/scripts/hash.ts <password>");
  process.exit(1);
}

console.log(await authController.hashPassword(password));

