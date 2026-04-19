export interface User {
  id: number;
  username: string;
  isConnected: boolean;
}

export const assertIsUsers = (user: unknown): user is User[] => {
  return (
    Array.isArray(user) && user.every((item: unknown) => assertIsUser(item))
  );
};

export const assertIsUser = (user: unknown): user is User => {
  return (
    typeof user === "object" &&
    user !== null &&
    "id" in user &&
    typeof user.id === "number" &&
    "username" in user &&
    typeof user.username === "string"
  );
};
