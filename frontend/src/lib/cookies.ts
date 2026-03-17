import Cookies from "universal-cookie";

const cookies = new Cookies();
const TOKEN_COOKIE_NAME = "@cert-storage-token";
const TOKEN_COOKIE_EXPIRES_AT = new Date("2099-12-31T23:59:59.000Z");

const COOKIE_NAME = "@cert-storage-token";
const COOKIE_OPTIONS = {
  path: "/",
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
