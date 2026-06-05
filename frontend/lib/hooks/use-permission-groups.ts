"use client";

import { useMemo, useState } from "react";

export type PermissionCode = string;

export interface PermissionItem {
  code: PermissionCode;
  label?: string; // friendly label (optional)
  selected: boolean;
}

export interface PermissionGroup {
  entity: string; // e.g. "students" or "platform_subscriptions"
  permissions: PermissionItem[];
  selected: boolean; // true when all permissions in group selected
}

export interface UsePermissionGroupsOptions {
  initialPermissions?: PermissionCode[]; // all available permission codes
  initialSelected?: PermissionCode[]; // initially selected permissions
  labelMap?: Record<string, string>; // optional mapping to friendly labels
}

/**
 * Group permission codes by their entity prefix (before first colon), e.g. "file:create" -> "file"
 */
function groupPermissionCodes(codes: PermissionCode[], labelMap?: Record<string, string>): PermissionGroup[] {
  const groupsMap: Record<string, PermissionItem[]> = {};

  for (const code of codes) {
    const parts = code.split(":");
    const entity = parts.length > 1 ? parts[0] : "misc";
    if (!groupsMap[entity]) groupsMap[entity] = [];
    groupsMap[entity].push({ code, label: labelMap?.[code], selected: false });
  }

  const groups: PermissionGroup[] = Object.keys(groupsMap)
    .sort()
    .map((entity) => ({ entity, permissions: groupsMap[entity].sort((a, b) => a.code.localeCompare(b.code)), selected: false }));

  return groups;
}

/**
 * Hook that returns grouped permissions and helper actions:
 * - search/filter
 * - select/unselect whole group
 * - select/unselect individual permission
 */
export function usePermissionGroups(options?: UsePermissionGroupsOptions) {
  const allCodes = options?.initialPermissions ?? [];
  const initiallySelected = new Set(options?.initialSelected ?? []);
  const labelMap = options?.labelMap;

  // Create the base groups only once from allCodes
  const baseGroups = useMemo(() => groupPermissionCodes(allCodes, labelMap), [allCodes.join("|")]);

  // Internal state: groups with selection state and current search query
  const [groups, setGroups] = useState<PermissionGroup[]>(() => {
    // mark selected items
    return baseGroups.map((g) => ({
      entity: g.entity,
      permissions: g.permissions.map((p) => ({ ...p, selected: initiallySelected.has(p.code) })),
      selected: g.permissions.every((p) => initiallySelected.has(p.code)),
    }));
  });

  const [query, setQuery] = useState("");

  // Derived flat list of selected permission codes
  const selectedCodes = useMemo(() => {
    const codes: string[] = [];
    for (const g of groups) {
      for (const p of g.permissions) {
        if (p.selected) codes.push(p.code);
      }
    }
    return codes;
  }, [groups]);

  // Search / filter groups and permissions by query (against code and label)
  const filteredGroups = useMemo(() => {
    if (!query || query.trim() === "") return groups;
    const q = query.toLowerCase();
    return groups
      .map((g) => ({
        entity: g.entity,
        selected: g.selected,
        permissions: g.permissions.filter((p) => (p.code + " " + (p.label || "")).toLowerCase().includes(q)),
      }))
      .filter((g) => g.permissions.length > 0);
  }, [groups, query]);

  // Actions
  function setSearch(q: string) {
    setQuery(q);
  }

  function toggleGroup(entity: string) {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.entity !== entity) return g;
        const willSelect = !g.selected;
        return {
          ...g,
          selected: willSelect,
          permissions: g.permissions.map((p) => ({ ...p, selected: willSelect })),
        };
      })
    );
  }

  function selectGroup(entity: string) {
    setGroups((prev) => prev.map((g) => (g.entity === entity ? { ...g, selected: true, permissions: g.permissions.map((p) => ({ ...p, selected: true })) } : g)));
  }

  function unselectGroup(entity: string) {
    setGroups((prev) => prev.map((g) => (g.entity === entity ? { ...g, selected: false, permissions: g.permissions.map((p) => ({ ...p, selected: false })) } : g)));
  }

  function togglePermission(code: PermissionCode) {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        permissions: g.permissions.map((p) => {
          if (p.code !== code) return p;
          return { ...p, selected: !p.selected };
        }),
      }))
    );
    // After toggling an item we need to update group selected flags
    setGroups((prev) => prev.map((g) => ({ ...g, selected: g.permissions.every((p) => p.selected) })));
  }

  function setSelectedCodes(codes: PermissionCode[]) {
    const setCodes = new Set(codes);
    setGroups((prev) => prev.map((g) => ({ ...g, selected: g.permissions.every((p) => setCodes.has(p.code)), permissions: g.permissions.map((p) => ({ ...p, selected: setCodes.has(p.code) })) })));
  }

  function selectAll() {
    setGroups((prev) => prev.map((g) => ({ ...g, selected: true, permissions: g.permissions.map((p) => ({ ...p, selected: true })) })));
  }

  function clearAll() {
    setGroups((prev) => prev.map((g) => ({ ...g, selected: false, permissions: g.permissions.map((p) => ({ ...p, selected: false })) })));
  }

  return {
    groups: filteredGroups,
    allGroups: groups,
    query,
    setSearch,
    selectedCodes,
    toggleGroup,
    selectGroup,
    unselectGroup,
    togglePermission,
    setSelectedCodes,
    selectAll,
    clearAll,
  };
}
