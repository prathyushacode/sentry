from django.test.client import RequestFactory
from django.urls import reverse

from sentry.models import OrganizationMember
from tests.apidocs.util import APIDocsTestCase


class OrganizationMemberDetailsDocs(APIDocsTestCase):
    def setUp(self):
        member = OrganizationMember.objects.get(user=self.user, organization=self.organization)

        self.url = reverse(
            "sentry-api-0-organization-member-details",
            kwargs={"organization_slug": self.organization.slug, "member_id": member.id},
        )

        self.login_as(user=self.user)

    def test_get(self):
        response = self.client.get(self.url)
        request = RequestFactory().get(self.url)

        self.validate_schema(request, response)
