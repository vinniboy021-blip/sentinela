from functools import lru_cache
from pathlib import Path

import re as _re

from pydantic import AliasChoices, Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: str = "development"
    database_url: str = Field(default="postgresql+psycopg://osint:osint@postgres:5432/osint", validation_alias=AliasChoices("DATABASE_URL", "SQLALCHEMY_DATABASE_URL"))
    redis_url: str = "redis://redis:6379/0"
    session_cookie: str = "sentinela_session"
    session_ttl_seconds: int = Field(default=28800, ge=300, le=604800)
    cookie_secure: bool = Field(
        default=False, validation_alias=AliasChoices("COOKIE_SECURE", "SECURE_COOKIES")
    )
    cors_origins: str = "http://localhost:3000"
    trusted_hosts: str = "localhost,127.0.0.1,api,testserver"
    login_max_attempts: int = Field(default=5, ge=1)
    login_window_seconds: int = Field(default=900, ge=30)
    rate_limit_per_minute: int = Field(default=120, ge=10)
    evidence_path: Path = Field(
        default=Path("/data/evidence"),
        validation_alias=AliasChoices("EVIDENCE_PATH", "EVIDENCE_ROOT", "EVIDENCE_STORAGE_DIR"),
    )
    evidence_max_bytes: int = Field(default=20 * 1024 * 1024, ge=1024)
    connector_timeout_seconds: int = 20
    connector_secret_key: str = Field(
        default="", validation_alias=AliasChoices("CONNECTOR_SECRET_KEY", "APP_SECRET_KEY")
    )
    ollama_url: str = Field(
        default="http://ollama:11434", validation_alias=AliasChoices("OLLAMA_URL", "OLLAMA_BASE_URL")
    )
    ollama_model: str = "llama3.2"
    ai_enabled: bool = False
    allow_test_sqlite: bool = False
    metrics_enabled: bool = True
    collection_max_records: int = 100
    collection_max_attempts: int = 3
    worker_concurrency: int = 4
    scheduler_tick_seconds: int = 15
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_starttls: bool = True
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from: str = "sentinela@localhost"
    alert_webhook_url: str = ""
    alert_webhook_secret: str = ""
    open_registration: bool = False

    @field_validator("smtp_from")
    @classmethod
    def validate_smtp_from(cls, value: str) -> str:
        # Accept any RFC 5321 local-part@domain; header injection requires
        # \n or \r which are stripped here. Strict TLD validation is not
        # applied because internal SMTP relays use single-label hostnames.
        if "\n" in value or "\r" in value or len(value) > 320:
            raise ValueError("smtp_from contém caracteres inválidos")
        if not _re.fullmatch(r"[^@\s]{1,254}@[^@\s]+", value):
            raise ValueError("smtp_from deve ter o formato local@domínio")
        return value

    @model_validator(mode="after")
    def production_safety(self) -> "Settings":
        if self.environment != "development" and "osint:osint@" in self.database_url:
            raise ValueError(
                "DATABASE_URL contém credenciais padrão; configure DATABASE_URL no ambiente"
            )
        if self.database_url.startswith("sqlite") and not self.allow_test_sqlite:
            raise ValueError("SQLite somente é permitido para testes com ALLOW_TEST_SQLITE=true")
        if self.environment != "development":
            if not self.connector_secret_key:
                raise ValueError(
                    "CONNECTOR_SECRET_KEY é obrigatório fora do ambiente de desenvolvimento; "
                    "gere com: python3 -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
                )
        if self.environment == "production":
            if not self.cookie_secure:
                raise ValueError("COOKIE_SECURE=true é obrigatório em produção")
            if "*" in self.cors_origins:
                raise ValueError("CORS em produção exige origens explícitas")
            if self.alert_webhook_url and not self.alert_webhook_secret:
                raise ValueError("ALERT_WEBHOOK_SECRET é obrigatório quando ALERT_WEBHOOK_URL está configurada")
        return self

    @property
    def allowed_origins(self) -> list[str]:
        return [value.strip() for value in self.cors_origins.split(",") if value.strip()]

    @property
    def allowed_hosts(self) -> list[str]:
        return [value.strip() for value in self.trusted_hosts.split(",") if value.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
