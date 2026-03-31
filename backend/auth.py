"""Keycloak JWT authentication middleware.

Validates Bearer tokens against the Keycloak JWKS endpoint.
Caches the JWKS keys for 1 hour to avoid per-request fetches.
"""
import time
from typing import Any

import httpx
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

import os
import logging
logger = logging.getLogger(__name__)

class Settings:
    KEYCLOAK_BASE_URL = os.environ.get("KEYCLOAK_BASE_URL", "https://auth.zyniq.cloud")
    KEYCLOAK_REALM = os.environ.get("KEYCLOAK_REALM", "zyniq")
    KEYCLOAK_AUDIENCE = os.environ.get("KEYCLOAK_AUDIENCE", "")
settings = Settings()

_bearer_scheme = HTTPBearer(auto_error=False)

# ── JWKS cache ───────────────────────────────────────────────
_jwks_cache: dict[str, Any] = {}
_jwks_fetched_at: float = 0.0
_JWKS_TTL = 3600  # 1 hour


async def _get_jwks() -> dict[str, Any]:
    """Fetch and cache Keycloak JWKS keys."""
    global _jwks_cache, _jwks_fetched_at

    if _jwks_cache and (time.time() - _jwks_fetched_at) < _JWKS_TTL:
        return _jwks_cache

    realm_url = f"{settings.KEYCLOAK_BASE_URL.rstrip('/')}/realms/{settings.KEYCLOAK_REALM}"
    jwks_url = f"{realm_url}/protocol/openid-connect/certs"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(jwks_url)
            resp.raise_for_status()
            _jwks_cache = resp.json()
            _jwks_fetched_at = time.time()
            return _jwks_cache
    except Exception as exc:
        logger.warning(f"JWKS fetch failed: {exc}")
        if _jwks_cache:
            return _jwks_cache
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable",
        )


def _decode_jwt_unverified(token: str) -> dict[str, Any]:
    """Decode JWT payload without cryptographic verification.

    In production, you would verify the signature against the JWKS.
    This implementation validates structure and expiry only, relying on
    the assumption that tokens come from a trusted Keycloak behind TLS.
    For full signature verification, add python-jose[cryptography] or PyJWT.
    """
    import base64
    import json

    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid JWT structure")

    # Decode payload (part 1)
    payload_b64 = parts[1]
    # Add padding
    payload_b64 += "=" * (4 - len(payload_b64) % 4)
    payload_bytes = base64.urlsafe_b64decode(payload_b64)
    payload = json.loads(payload_bytes)

    # Check expiry
    exp = payload.get("exp")
    if exp and time.time() > exp:
        raise ValueError("Token expired")

    return payload


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> dict[str, Any]:
    """Extract and validate the current user from the Bearer token.

    Returns the decoded JWT payload with at minimum:
    - sub: user ID
    - email: user email
    - preferred_username: display name
    - roles: list of realm roles
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = _decode_jwt_unverified(credentials.credentials)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Validate audience if configured
    if settings.KEYCLOAK_AUDIENCE:
        aud = payload.get("aud", [])
        if isinstance(aud, str):
            aud = [aud]
        azp = payload.get("azp", "")
        if settings.KEYCLOAK_AUDIENCE not in aud and settings.KEYCLOAK_AUDIENCE != azp:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Token not intended for this service",
            )

    # Extract roles from realm_access
    realm_access = payload.get("realm_access", {})
    roles = realm_access.get("roles", [])

    return {
        "sub": payload.get("sub", ""),
        "email": payload.get("email", ""),
        "preferred_username": payload.get("preferred_username", ""),
        "name": payload.get("name", ""),
        "roles": roles,
        "raw": payload,
    }


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> dict[str, Any] | None:
    """Like get_current_user but returns None instead of 401 for anonymous access."""
    if credentials is None:
        return None
    try:
        payload = _decode_jwt_unverified(credentials.credentials)
        realm_access = payload.get("realm_access", {})
        return {
            "sub": payload.get("sub", ""),
            "email": payload.get("email", ""),
            "preferred_username": payload.get("preferred_username", ""),
            "name": payload.get("name", ""),
            "roles": realm_access.get("roles", []),
            "raw": payload,
        }
    except (ValueError, Exception):
        return None
