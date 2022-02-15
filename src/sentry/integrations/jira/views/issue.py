from __future__ import annotations

import logging

from jwt import ExpiredSignatureError
from rest_framework.request import Request
from rest_framework.response import Response

from sentry.integrations.utils import AtlassianConnectValidationError, get_integration_from_request
from sentry.models import ExternalIssue, Group, GroupLink
from sentry.utils.sdk import configure_scope

from ..utils import build_context, set_badge
from . import JiraBaseHook

logger = logging.getLogger(__name__)


class JiraIssueHookView(JiraBaseHook):
    html_file = "sentry/integrations/jira-issue.html"

    def handle_group(self, group: Group) -> Response:
        context = build_context(group)
        logger.info(
            "issue_hook.response",
            extra={"type": context["type"], "title_url": context["title_url"]},
        )
        return self.get_response(context)

    def get(self, request: Request, issue_key, *args, **kwargs) -> Response:
        with configure_scope() as scope:
            try:
                integration = get_integration_from_request(request, "jira")
            except AtlassianConnectValidationError:
                scope.set_tag("failure", "AtlassianConnectValidationError")
                return self.get_response({"error_message": "Unable to verify installation."})
            except ExpiredSignatureError:
                scope.set_tag("failure", "ExpiredSignatureError")
                return self.get_response({"refresh_required": True})

            try:
                external_issue = ExternalIssue.objects.get(
                    integration_id=integration.id, key=issue_key
                )
                # TODO: handle multiple
                group_link = GroupLink.objects.filter(
                    linked_type=GroupLink.LinkedType.issue,
                    linked_id=external_issue.id,
                    relationship=GroupLink.Relationship.references,
                ).first()
                if not group_link:
                    raise GroupLink.DoesNotExist()
                group = Group.objects.get(id=group_link.group_id)
            except (ExternalIssue.DoesNotExist, GroupLink.DoesNotExist, Group.DoesNotExist) as e:
                scope.set_tag("failure", e.__class__.__name__)
                set_badge(integration, issue_key, 0)
                return self.get_response({"issue_not_linked": True})

            scope.set_tag("organization.slug", group.organization.slug)
            result = self.handle_group(group)
            scope.set_tag("status_code", result.status_code)

            # XXX(CEO): group_link_num is hardcoded as 1 now, but when we handle
            #  displaying multiple linked issues this should be updated to the
            #  actual count.
            set_badge(integration, issue_key, 1)
            return result
