import Cookies from "universal-cookie";

const cookies = new Cookies();

const COOKIE_NAME = "@cert-storage-token";
const COOKIE_OPTIONS = {
  path: "/",
  maxAge: 30 * 24 * 60 * 60, // 30 hari (sama dengan JWT expiry)
  sameSite: "lax" as const,
};

// Login
export const getToken = (): string => {
  return cookies.get(COOKIE_NAME);
};

export const setToken = (token: string) => {
  cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
};

export const removeToken = () => {
  cookies.remove(COOKIE_NAME, { path: "/" });
};
