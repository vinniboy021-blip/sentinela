"""Optional integration point for an operator-managed Kali MCP endpoint."""

import os

import httpx

from app.connectors.security import ConnectorError, PublicNetworkBackend, validate_public_url

KALI_MCP_URL = os.getenv("KALI_MCP_URL", "").rstrip("/")


def health() -> dict:
    if not KALI_MCP_URL:
        return {"status": "disabled", "message": "KALI_MCP_URL não configurada"}
    try:
        validate_public_url(KALI_MCP_URL)
        transport = httpx.HTTPTransport(retries=0, trust_env=False)
        transport._pool._network_backend = PublicNetworkBackend()
        with httpx.Client(
            transport=transport,
            timeout=3,
            follow_redirects=False,
            trust_env=False,
        ) as client:
            response = client.get(f"{KALI_MCP_URL}/health")
        if response.status_code >= 400:
            return {"status": "unhealthy", "http_status": response.status_code}
        return {"status": "ready"}
    except ConnectorError as exc:
        return {"status": "misconfigured", "detail": str(exc)}
    except httpx.HTTPError:
        return {"status": "unreachable"}
