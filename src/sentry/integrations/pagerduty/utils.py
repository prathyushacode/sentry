import logging

from django.http import Http404

from sentry.incidents.models import IncidentStatus
from sentry.integrations.metric_alerts import incident_attachment_info
from sentry.models import PagerDutyService
from sentry.shared_integrations.exceptions import ApiError

from .client import PagerDutyClient

logger = logging.getLogger("sentry.integrations.pagerduty")


def build_incident_attachment(
    incident, integration_key, new_status: IncidentStatus, metric_value=None
):
    data = incident_attachment_info(incident, new_status, metric_value)
    severity = "info"
    if new_status == IncidentStatus.CRITICAL:
        severity = "critical"
    elif new_status == IncidentStatus.WARNING:
        severity = "warning"
    elif new_status == IncidentStatus.CLOSED:
        severity = "info"

    event_action = "resolve"
    if new_status in [IncidentStatus.WARNING, IncidentStatus.CRITICAL]:
        event_action = "trigger"

    return {
        "routing_key": integration_key,
        "event_action": event_action,
        "dedup_key": f"incident_{incident.organization_id}_{incident.identifier}",
        "payload": {
            "summary": incident.alert_rule.name,
            "severity": severity,
            "source": str(incident.identifier),
            "custom_details": {"details": data["text"]},
        },
        "links": [{"href": data["title_link"], "text": data["title"]}],
    }


def send_incident_alert_notification(action, incident, metric_value, new_status: IncidentStatus):
    integration = action.integration
    try:
        service = PagerDutyService.objects.get(id=action.target_identifier)
    except PagerDutyService.DoesNotExist:
        # service has been removed after rule creation
        logger.info(
            "fetch.fail.pagerduty_metric_alert",
            extra={
                "integration_id": integration.id,
                "organization_id": incident.organization_id,
                "target_identifier": action.target_identifier,
            },
        )
        raise Http404
    integration_key = service.integration_key
    client = PagerDutyClient(integration_key=integration_key)
    attachment = build_incident_attachment(incident, integration_key, new_status, metric_value)
    try:
        client.send_trigger(attachment)
    except ApiError as e:
        logger.info(
            "rule.fail.pagerduty_metric_alert",
            extra={
                "error": str(e),
                "service_name": service.service_name,
                "service_id": service.id,
                "integration_id": integration.id,
            },
        )
        raise e
