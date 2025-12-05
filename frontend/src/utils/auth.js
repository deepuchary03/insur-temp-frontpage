import { jwtDecode } from "jwt-decode";

export const getUser = () => {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

export const getAccessToken = () => {
  return localStorage.getItem("accessToken");
};

export const getRefreshToken = () => {
  return localStorage.getItem("refreshToken");
};

export const setAuthData = (authResponse) => {
  localStorage.setItem("accessToken", authResponse.accessToken);
  localStorage.setItem("refreshToken", authResponse.refreshToken);
  localStorage.setItem(
    "user",
    JSON.stringify({
      id: authResponse.userId,
      email: authResponse.email,
      fullName: authResponse.fullName,
      roles: authResponse.roles,
    })
  );
};

export const clearAuthData = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

export const isAuthenticated = () => {
  const token = getAccessToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const hasRole = (role) => {
  const user = getUser();
  if (!user?.roles) return false;

  // Check for both formats: 'AGENT' and 'ROLE_AGENT'
  return user.roles.some(
    (r) => r === role || r === `ROLE_${role}` || r.replace("ROLE_", "") === role
  );
};

export const isAdmin = () => hasRole("ADMIN");
export const isAgent = () => hasRole("AGENT");
export const isCustomer = () => hasRole("CUSTOMER");
