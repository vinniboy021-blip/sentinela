"""initial relational schema — gerado a partir dos modelos ORM"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def _utcnow() -> sa.text:
    return sa.text("NOW()")


def upgrade() -> None:
    # users
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False, unique=True),
        sa.Column("password_hash", sa.Text, nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default="analyst"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
        sa.CheckConstraint("role IN ('admin','analyst','viewer')", name="valid_role"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # roles / permissions (RBAC catalog)
    op.create_table(
        "roles",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(50), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
    )
    op.create_table(
        "permissions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
    )
    op.create_table(
        "role_permissions",
        sa.Column("role_id", sa.String(36), sa.ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("permission_id", sa.String(36), sa.ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
    )

    # sessions
    op.create_table(
        "sessions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("csrf_token", sa.String(64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
    )
    op.create_index("ix_sessions_token_hash", "sessions", ["token_hash"], unique=True)
    op.create_index("ix_sessions_user_id", "sessions", ["user_id"])
    op.create_index("ix_sessions_expires_at", "sessions", ["expires_at"])

    # investigations
    op.create_table(
        "investigations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("title", sa.String(250), nullable=False),
        sa.Column("objective", sa.Text, nullable=False, server_default=""),
        sa.Column("scope", sa.Text, nullable=False, server_default=""),
        sa.Column("status", sa.String(30), nullable=False, server_default="active"),
        sa.Column("owner_id", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
    )
    op.create_index("ix_investigations_owner_id", "investigations", ["owner_id"])
    op.create_index("ix_investigations_status", "investigations", ["status"])

    # investigation_members
    op.create_table(
        "investigation_members",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("investigation_id", sa.String(36), sa.ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default="viewer"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
        sa.UniqueConstraint("investigation_id", "user_id"),
        sa.CheckConstraint("role IN ('owner','editor','viewer')", name="valid_role"),
    )
    op.create_index("ix_investigation_members_investigation_id", "investigation_members", ["investigation_id"])
    op.create_index("ix_investigation_members_user_id", "investigation_members", ["user_id"])

    # connectors
    op.create_table(
        "connectors",
        sa.Column("id", sa.String(80), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False, server_default=""),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("health", sa.String(30), nullable=False, server_default="unknown"),
        sa.Column("last_error", sa.Text, nullable=True),
        sa.Column("last_checked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_success_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
    )

    # connector_configurations
    op.create_table(
        "connector_configurations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("connector_id", sa.String(80), sa.ForeignKey("connectors.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("settings", JSONB, nullable=False, server_default="{}"),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
    )
    op.create_index("ix_connector_configurations_connector_id", "connector_configurations", ["connector_id"])

    # monitors
    op.create_table(
        "monitors",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("investigation_id", sa.String(36), sa.ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("connector_id", sa.String(80), sa.ForeignKey("connectors.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("query", sa.String(2048), nullable=False),
        sa.Column("config", JSONB, nullable=False, server_default="{}"),
        sa.Column("interval_seconds", sa.Integer, nullable=True),
        sa.Column("cron", sa.String(120), nullable=True),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("next_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("alert_on_change", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
        sa.CheckConstraint("interval_seconds IS NULL OR interval_seconds >= 60", name="minimum_interval"),
        sa.CheckConstraint("(interval_seconds IS NULL) <> (cron IS NULL)", name="one_schedule"),
    )
    op.create_index("ix_monitors_investigation_id", "monitors", ["investigation_id"])
    op.create_index("ix_monitors_connector_id", "monitors", ["connector_id"])
    op.create_index("ix_monitors_due", "monitors", ["enabled", "next_run_at"])

    # collection_jobs
    op.create_table(
        "collection_jobs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("investigation_id", sa.String(36), sa.ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("connector_id", sa.String(80), sa.ForeignKey("connectors.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("query", sa.String(2048), nullable=False),
        sa.Column("config", JSONB, nullable=False, server_default="{}"),
        sa.Column("status", sa.String(30), nullable=False, server_default="pending"),
        sa.Column("priority", sa.Integer, nullable=False, server_default="5"),
        sa.Column("attempts", sa.Integer, nullable=False, server_default="0"),
        sa.Column("task_id", sa.String(100), nullable=True),
        sa.Column("idempotency_key", sa.String(200), nullable=False, unique=True),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.Text, nullable=True),
        sa.Column("monitor_id", sa.String(36), sa.ForeignKey("monitors.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
        sa.CheckConstraint(
            "status IN ('pending','queued','running','succeeded','failed','cancelled','dead_letter')",
            name="valid_status",
        ),
        sa.CheckConstraint("priority BETWEEN 0 AND 9", name="valid_priority"),
    )
    op.create_index("ix_collection_jobs_investigation_id", "collection_jobs", ["investigation_id"])
    op.create_index("ix_collection_jobs_connector_id", "collection_jobs", ["connector_id"])
    op.create_index("ix_collection_jobs_status", "collection_jobs", ["status"])
    op.create_index("ix_collection_jobs_task_id", "collection_jobs", ["task_id"])
    op.create_index("ix_collection_jobs_monitor_id", "collection_jobs", ["monitor_id"])
    op.create_index("ix_collection_jobs_recovery", "collection_jobs", ["status", "scheduled_at"])

    # collection_runs
    op.create_table(
        "collection_runs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("job_id", sa.String(36), sa.ForeignKey("collection_jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("result_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("error", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
    )
    op.create_index("ix_collection_runs_job_id", "collection_runs", ["job_id"])

    # entities
    op.create_table(
        "entities",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("investigation_id", sa.String(36), sa.ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.String(60), nullable=False),
        sa.Column("canonical_value", sa.String(1024), nullable=False),
        sa.Column("label", sa.String(250), nullable=False, server_default=""),
        sa.Column("attributes", JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
        sa.UniqueConstraint("investigation_id", "type", "canonical_value"),
    )
    op.create_index("ix_entities_investigation_id", "entities", ["investigation_id"])
    op.create_index("ix_entities_type", "entities", ["type"])

    # entity_aliases
    op.create_table(
        "entity_aliases",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("entity_id", sa.String(36), sa.ForeignKey("entities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("value", sa.String(1024), nullable=False),
        sa.Column("source", sa.String(200), nullable=False, server_default="manual"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
        sa.UniqueConstraint("entity_id", "value"),
    )
    op.create_index("ix_entity_aliases_entity_id", "entity_aliases", ["entity_id"])

    # observations
    op.create_table(
        "observations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("investigation_id", sa.String(36), sa.ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("job_id", sa.String(36), sa.ForeignKey("collection_jobs.id", ondelete="SET NULL"), nullable=True),
        sa.Column("monitor_id", sa.String(36), sa.ForeignKey("monitors.id", ondelete="SET NULL"), nullable=True),
        sa.Column("connector_id", sa.String(80), sa.ForeignKey("connectors.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("entity_id", sa.String(36), sa.ForeignKey("entities.id", ondelete="SET NULL"), nullable=True),
        sa.Column("source_url", sa.Text, nullable=False, server_default=""),
        sa.Column("source_name", sa.String(150), nullable=False, server_default=""),
        sa.Column("acquisition_method", sa.String(100), nullable=False, server_default=""),
        sa.Column("collected_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
        sa.Column("external_id", sa.String(1024), nullable=False, server_default=""),
        sa.Column("fingerprint", sa.String(64), nullable=False),
        sa.Column("data", JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
        sa.UniqueConstraint("investigation_id", "connector_id", "fingerprint"),
    )
    op.create_index("ix_observations_investigation_id", "observations", ["investigation_id"])
    op.create_index("ix_observations_job_id", "observations", ["job_id"])
    op.create_index("ix_observations_monitor_id", "observations", ["monitor_id"])
    op.create_index("ix_observations_connector_id", "observations", ["connector_id"])
    op.create_index("ix_observations_entity_id", "observations", ["entity_id"])
    op.create_index("ix_observations_fingerprint", "observations", ["fingerprint"])
    op.create_index("ix_observations_collected_at", "observations", ["collected_at"])
    op.create_index("ix_observations_investigation_time", "observations", ["investigation_id", "collected_at"])

    # entity_relationships
    op.create_table(
        "entity_relationships",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("investigation_id", sa.String(36), sa.ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_entity_id", sa.String(36), sa.ForeignKey("entities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_entity_id", sa.String(36), sa.ForeignKey("entities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("relationship_type", sa.String(80), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="unverified"),
        sa.Column("confidence", sa.Float, nullable=False, server_default="0"),
        sa.Column("explanation", sa.Text, nullable=False, server_default=""),
        sa.Column("evidence_ids", JSONB, nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
        sa.CheckConstraint("confidence >= 0 AND confidence <= 1", name="valid_confidence"),
        sa.CheckConstraint("status IN ('confirmed','probable','unverified','rejected')", name="valid_status"),
        sa.CheckConstraint("source_entity_id <> target_entity_id", name="distinct_entities"),
    )
    op.create_index("ix_entity_relationships_investigation_id", "entity_relationships", ["investigation_id"])
    op.create_index("ix_entity_relationships_source_entity_id", "entity_relationships", ["source_entity_id"])
    op.create_index("ix_entity_relationships_target_entity_id", "entity_relationships", ["target_entity_id"])

    # correlation_candidates
    op.create_table(
        "correlation_candidates",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("investigation_id", sa.String(36), sa.ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_entity_id", sa.String(36), sa.ForeignKey("entities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_entity_id", sa.String(36), sa.ForeignKey("entities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("score", sa.Float, nullable=False),
        sa.Column("rule", sa.String(100), nullable=False),
        sa.Column("explanation", sa.Text, nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="pending"),
        sa.Column("payload", JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
        sa.CheckConstraint("score >= 0 AND score <= 1", name="valid_score"),
        sa.UniqueConstraint("investigation_id", "source_entity_id", "target_entity_id", "rule"),
    )
    op.create_index("ix_correlation_candidates_investigation_id", "correlation_candidates", ["investigation_id"])
    op.create_index("ix_correlation_candidates_source_entity_id", "correlation_candidates", ["source_entity_id"])
    op.create_index("ix_correlation_candidates_target_entity_id", "correlation_candidates", ["target_entity_id"])

    # correlation_reviews
    op.create_table(
        "correlation_reviews",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("candidate_id", sa.String(36), sa.ForeignKey("correlation_candidates.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reviewer_id", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("decision", sa.String(30), nullable=False),
        sa.Column("notes", sa.Text, nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
    )
    op.create_index("ix_correlation_reviews_candidate_id", "correlation_reviews", ["candidate_id"])
    op.create_index("ix_correlation_reviews_reviewer_id", "correlation_reviews", ["reviewer_id"])

    # evidence
    op.create_table(
        "evidence",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("investigation_id", sa.String(36), sa.ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("entity_id", sa.String(36), sa.ForeignKey("entities.id", ondelete="SET NULL"), nullable=True),
        sa.Column("filename", sa.String(250), nullable=False),
        sa.Column("content_type", sa.String(150), nullable=False),
        sa.Column("storage_key", sa.String(500), nullable=False, unique=True),
        sa.Column("sha256", sa.String(64), nullable=False),
        sa.Column("size_bytes", sa.Integer, nullable=False),
        sa.Column("source_url", sa.Text, nullable=False, server_default=""),
        sa.Column("collected_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
        sa.Column("notes", sa.Text, nullable=False, server_default=""),
        sa.Column("retention_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
        sa.CheckConstraint("size_bytes >= 0", name="valid_size"),
    )
    op.create_index("ix_evidence_investigation_id", "evidence", ["investigation_id"])
    op.create_index("ix_evidence_entity_id", "evidence", ["entity_id"])
    op.create_index("ix_evidence_sha256", "evidence", ["sha256"])
    op.create_index("ix_evidence_retention_until", "evidence", ["retention_until"])

    # evidence_versions
    op.create_table(
        "evidence_versions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("evidence_id", sa.String(36), sa.ForeignKey("evidence.id", ondelete="CASCADE"), nullable=False),
        sa.Column("version", sa.Integer, nullable=False),
        sa.Column("sha256", sa.String(64), nullable=False),
        sa.Column("storage_key", sa.String(500), nullable=False),
        sa.Column("size_bytes", sa.Integer, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
        sa.UniqueConstraint("evidence_id", "version"),
    )
    op.create_index("ix_evidence_versions_evidence_id", "evidence_versions", ["evidence_id"])

    # timelines
    op.create_table(
        "timelines",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("investigation_id", sa.String(36), sa.ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_type", sa.String(80), nullable=False),
        sa.Column("title", sa.String(250), nullable=False),
        sa.Column("details", JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
    )
    op.create_index("ix_timelines_investigation_id", "timelines", ["investigation_id"])
    op.create_index("ix_timelines_event_type", "timelines", ["event_type"])

    # alerts
    op.create_table(
        "alerts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("investigation_id", sa.String(36), sa.ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("monitor_id", sa.String(36), sa.ForeignKey("monitors.id", ondelete="SET NULL"), nullable=True),
        sa.Column("observation_id", sa.String(36), sa.ForeignKey("observations.id", ondelete="SET NULL"), nullable=True),
        sa.Column("event_type", sa.String(80), nullable=False),
        sa.Column("title", sa.String(250), nullable=False),
        sa.Column("details", JSONB, nullable=False, server_default="{}"),
        sa.Column("dedupe_key", sa.String(250), nullable=False, unique=True),
        sa.Column("is_read", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
    )
    op.create_index("ix_alerts_investigation_id", "alerts", ["investigation_id"])
    op.create_index("ix_alerts_monitor_id", "alerts", ["monitor_id"])
    op.create_index("ix_alerts_observation_id", "alerts", ["observation_id"])
    op.create_index("ix_alerts_is_read", "alerts", ["is_read"])

    # notification_deliveries
    op.create_table(
        "notification_deliveries",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("alert_id", sa.String(36), sa.ForeignKey("alerts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("channel", sa.String(30), nullable=False, server_default="internal"),
        sa.Column("recipient", sa.String(320), nullable=False, server_default=""),
        sa.Column("status", sa.String(30), nullable=False, server_default="pending"),
        sa.Column("attempts", sa.Integer, nullable=False, server_default="0"),
        sa.Column("last_error", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
    )
    op.create_index("ix_notification_deliveries_alert_id", "notification_deliveries", ["alert_id"])

    # threat_indicators
    op.create_table(
        "threat_indicators",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("investigation_id", sa.String(36), sa.ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("indicator_type", sa.String(60), nullable=False),
        sa.Column("value", sa.String(1024), nullable=False),
        sa.Column("source", sa.String(150), nullable=False),
        sa.Column("source_url", sa.Text, nullable=False, server_default=""),
        sa.Column("confidence", sa.Float, nullable=False, server_default="0"),
        sa.Column("data", JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
        sa.UniqueConstraint("investigation_id", "indicator_type", "value", "source"),
    )
    op.create_index("ix_threat_indicators_investigation_id", "threat_indicators", ["investigation_id"])
    op.create_index("ix_threat_indicators_indicator_type", "threat_indicators", ["indicator_type"])
    op.create_index("ix_threat_indicators_value", "threat_indicators", ["value"])

    # reports
    op.create_table(
        "reports",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("investigation_id", sa.String(36), sa.ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(250), nullable=False),
        sa.Column("format", sa.String(20), nullable=False),
        sa.Column("content", sa.Text, nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
    )
    op.create_index("ix_reports_investigation_id", "reports", ["investigation_id"])

    # audit_logs
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("investigation_id", sa.String(36), sa.ForeignKey("investigations.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(120), nullable=False),
        sa.Column("object_type", sa.String(80), nullable=False, server_default=""),
        sa.Column("object_id", sa.String(100), nullable=True),
        sa.Column("details", JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
    )
    op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"])
    op.create_index("ix_audit_logs_investigation_id", "audit_logs", ["investigation_id"])
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"])

    # ai_analysis_runs
    op.create_table(
        "ai_analysis_runs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("investigation_id", sa.String(36), sa.ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("model", sa.String(100), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("prompt", sa.Text, nullable=False),
        sa.Column("response", JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
    )
    op.create_index("ix_ai_analysis_runs_investigation_id", "ai_analysis_runs", ["investigation_id"])

    # social_profiles
    op.create_table(
        "social_profiles",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("investigation_id", sa.String(36), sa.ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("platform", sa.String(60), nullable=False),
        sa.Column("identifier", sa.String(1024), nullable=False),
        sa.Column("label", sa.String(250), nullable=False, server_default=""),
        sa.Column("monitor_id", sa.String(36), sa.ForeignKey("monitors.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
        sa.UniqueConstraint("investigation_id", "platform", "identifier"),
    )
    op.create_index("ix_social_profiles_investigation_id", "social_profiles", ["investigation_id"])
    op.create_index("ix_social_profiles_monitor_id", "social_profiles", ["monitor_id"])

    # workspace_items
    op.create_table(
        "workspace_items",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("investigation_id", sa.String(36), sa.ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("kind", sa.String(30), nullable=False),
        sa.Column("label", sa.String(250), nullable=False),
        sa.Column("content", sa.Text, nullable=False, server_default=""),
        sa.Column("status", sa.String(30), nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=_utcnow()),
        sa.CheckConstraint("kind IN ('hypothesis','observation','task')", name="valid_kind"),
        sa.CheckConstraint("status IN ('open','in_progress','resolved','dismissed')", name="valid_workspace_status"),
    )
    op.create_index("ix_workspace_items_investigation_id", "workspace_items", ["investigation_id"])


def downgrade() -> None:
    op.drop_table("workspace_items")
    op.drop_table("social_profiles")
    op.drop_table("ai_analysis_runs")
    op.drop_table("audit_logs")
    op.drop_table("reports")
    op.drop_table("threat_indicators")
    op.drop_table("notification_deliveries")
    op.drop_table("alerts")
    op.drop_table("timelines")
    op.drop_table("evidence_versions")
    op.drop_table("evidence")
    op.drop_table("correlation_reviews")
    op.drop_table("correlation_candidates")
    op.drop_table("entity_relationships")
    op.drop_table("observations")
    op.drop_table("entity_aliases")
    op.drop_table("entities")
    op.drop_table("collection_runs")
    op.drop_table("collection_jobs")
    op.drop_table("monitors")
    op.drop_table("connector_configurations")
    op.drop_table("connectors")
    op.drop_table("investigation_members")
    op.drop_table("investigations")
    op.drop_table("sessions")
    op.drop_table("role_permissions")
    op.drop_table("permissions")
    op.drop_table("roles")
    op.drop_index("ix_users_email", "users")
    op.drop_table("users")
