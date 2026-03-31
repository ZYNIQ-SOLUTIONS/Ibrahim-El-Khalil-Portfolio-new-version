export const KEYCLOAK_CONFIG = {
  url: 'https://auth.zyniq.cloud',
  realm: 'zyniq-studio',
  clientId: 'zyniq-studio', // standard client
};

export const loginWithKeycloak = () => {
  const redirectUri = encodeURIComponent(window.location.origin + '/admin');
  const authUrl = `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/auth?client_id=${KEYCLOAK_CONFIG.clientId}&redirect_uri=${redirectUri}&response_type=token&scope=openid`;
  window.location.href = authUrl;
};

export const getTokenFromHash = () => {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const token = params.get('access_token');
  if (token) {
    // Clean URL
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    return token;
  }
  return null;
};
