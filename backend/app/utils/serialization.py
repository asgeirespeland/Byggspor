"""Serialization helpers for grouping flat DB rows by a source key."""

from __future__ import annotations

from typing import Any, Callable, Sequence, TypeVar

T = TypeVar("T")


def group_by_source(
    items: Sequence[T],
    *,
    key_fn: Callable[[T], Any],
    group_fn: Callable[[T], dict],
    item_fn: Callable[[T], dict],
    collection_key: str = "items",
) -> list[dict]:
    """Group flat DB rows into ``{ ...metadata, <collection_key>: [...] }`` dicts.

    Args:
        items: Flat sequence of DB model instances.
        key_fn: Extracts the grouping key (e.g. ``lambda pm: pm.source_id``).
        group_fn: Called once per group to build the group metadata dict.
            Must NOT include the collection list — that's added automatically.
        item_fn: Serializes a single item into a dict.
        collection_key: Name of the list field in each group (default ``"items"``).

    Returns:
        List of group dicts, each with a ``collection_key`` list of serialized items.
    """
    groups: dict[Any, dict] = {}
    for item in items:
        gid = key_fn(item)
        if gid not in groups:
            group = group_fn(item)
            group[collection_key] = []
            groups[gid] = group
        groups[gid][collection_key].append(item_fn(item))
    return list(groups.values())
