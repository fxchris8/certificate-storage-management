import Cookies from "universal-cookie";

const cookies = new Cookies();

// Login
export const getToken = (): string => {
  const token = cookies.get("@cert-storage-token");
  console.log("[COOKIE] Getting token:", token ? "Token exists" : "No token found");
  return token;
};

export const setToken = (token: string) => {
  cookies.set("@cert-storage-token", token, { path: "/" });
};

export const removeToken = () => {
  cookies.remove("@cert-storage-token", { path: "/" });
};
