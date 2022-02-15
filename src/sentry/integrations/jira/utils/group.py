from __future__ import annotations

from functools import reduce
from typing import Any, Mapping
from urllib.parse import quote

from sentry.api.serializers import serialize
from sentry.api.serializers.models.group import StreamGroupSerializer
from sentry.models import Group
from sentry.utils.http import absolute_uri


def accum(tot: int, item: Mapping[int, int]) -> int:
    return tot + item[1]


# TODO: find more efficient way of getting stats
def get_serialized_and_stats(group: Group, stats_period: str) -> tuple[Mapping[str, Any], int]:
    result = serialize(
        group,
        None,
        StreamGroupSerializer(stats_period=stats_period),
    )
    stats = result["stats"][stats_period]
    return result, reduce(accum, stats, 0)


def get_release_url(group: Group, release: str) -> str:
    project = group.project
    return absolute_uri(
        "/organizations/{}/releases/{}/?project={}".format(
            project.organization.slug, quote(release), project.id
        )
    )


def get_group_url(group: Group) -> str:
    return group.get_absolute_url(params={"referrer": "sentry-issues-glance"})


def build_context(group: Group) -> Mapping[str, Any]:
    result, stats_24hr = get_serialized_and_stats(group, "24h")
    _, stats_14d = get_serialized_and_stats(group, "14d")

    first_release = group.get_first_release()
    if first_release is not None:
        last_release = group.get_last_release()
    else:
        last_release = None

    first_release_url = None
    if first_release:
        first_release_url = get_release_url(group, first_release)

    last_release_url = None
    if last_release:
        last_release_url = get_release_url(group, last_release)

    return {
        "type": result.get("metadata", {}).get("type", "Unknown Error"),
        "title": group.title,
        "title_url": get_group_url(group),
        "first_seen": result["firstSeen"],
        "last_seen": result["lastSeen"],
        "first_release": first_release,
        "first_release_url": first_release_url,
        "last_release": last_release,
        "last_release_url": last_release_url,
        "stats_24hr": stats_24hr,
        "stats_14d": stats_14d,
    }
