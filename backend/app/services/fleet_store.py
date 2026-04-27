"""
In-memory fleet state loaded from fleet_seed.json (exported from the legacy Node server).

Supports mutations: inspection toggle, alert ack, work order complete, work order create.
"""

from __future__ import annotations

import copy
import json
import threading
from pathlib import Path
from typing import Any

from app.core.config import Settings
from app.services import zone_captures

_lock = threading.RLock()
_fleet: dict[str, dict[str, Any]] | None = None

_SEED_PATH = Path(__file__).resolve().parent / "fleet_seed.json"


def _walkthrough_checklist() -> list[dict[str, Any]]:
    z = [
        ("Forward Fuselage", "nose-fwd", "Radome & pitot covers removed / stowed"),
        ("Forward Fuselage", "nose-fwd-2", "Windshield condition (cracks, delam)"),
        ("Wings", "wing-l", "Left wing leading edge — ice boot / slats visual"),
        ("Wings", "wing-r", "Right wing leading edge — symmetry vs left"),
        ("Engines", "eng-1", "Engine 1 inlet / fan blades — FOD, nicks"),
        ("Engines", "eng-2", "Engine 2 inlet / fan blades — oil streaks"),
        ("Landing Gear", "lg-n", "Nose gear — tire wear, strut extension, pins"),
        ("Empennage", "emp", "Tail skid / APU drain — leaks, security"),
    ]
    grouped: dict[str, list[dict[str, str]]] = {}
    for zone, iid, task in z:
        grouped.setdefault(zone, []).append({"id": iid, "task": task, "status": "pending"})
    return [{"zone": name, "items": items} for name, items in grouped.items()]


def _demo_predictions() -> dict[str, Any]:
    return {
        "labels": ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6"],
        "datasets": [
            {"label": "Structural health", "data": [72, 74, 76, 78, 80, 82], "color": "#5b8def"},
            {"label": "System reliability", "data": [81, 82, 83, 84, 85, 86], "color": "#00d68f"},
        ],
    }


def _enrich_aircraft(tail: str, ac: dict[str, Any]) -> None:
    """Layer demo-friendly values on top of seed JSON (placeholders → usable UI)."""
    if tail in ("N787CC", "N777AD", "N737BA"):
        ac["health"] = {"N787CC": 87, "N777AD": 79, "N737BA": 91}[tail]
        ac["status"] = "operational"
        ac["bayLocation"] = {"N787CC": "Hangar 1 — Bay A", "N777AD": "Hangar 2 — Bay C", "N737BA": "Line MX — Gate 14"}[tail]
        ac["assignedMechanic"] = {"N787CC": "J. Rivera", "N777AD": "M. Okonkwo", "N737BA": "S. Kim"}[tail]
        ac["aiConfidence"] = "94.2%"
        ac["savings"] = "$2.4M"
        ac["savingsEvents"] = "−12 evts"
        ac["toolsRequired"] = ["Borescope kit", "Torque wrench 200–800 in·lb", "Composite tap test hammer"]
        ac["safetyNotes"] = ["Jacking: verify wind limits per AMM.", "Hazard zones posted for engine runs."]
        ac["riskFactors"] = [
            {"name": "Corrosion-prone belly", "probability": 62},
            {"name": "High-cycle landing gear", "probability": 48},
            {"name": "ECS pack thermal stress", "probability": 35},
        ]
        for comp in ac.get("components", {}).values():
            if isinstance(comp, dict) and comp.get("health") == 0:
                comp["health"] = ac["health"] - 5
                comp["trend"] = "stable ↑"
        for ic in ac.get("internalComponents", {}).values():
            if isinstance(ic, dict) and ic.get("health") == 0:
                ic["health"] = max(60, ac["health"] - 10)
                ic["trend"] = "nominal"
                ic["zone"] = "Zone 200"
        for cz in ac.get("cameraZones", []):
            if isinstance(cz, dict) and cz.get("status") == "-":
                cz["status"] = "nominal"
                cz["description"] = "Gyro camera online — last sweep OK"
                cz["lastInspected"] = "Today 06:15Z"
                cz["findings"] = 0
        if not ac.get("alerts"):
            ac["alerts"] = [
                {"severity": "warning", "message": "Elevated vibration trend — Engine 1 (monitor)", "time": "2h ago"},
                {"severity": "critical", "message": "Borescope due on left pack outlet duct", "time": "5h ago"},
            ]
        if not ac.get("workOrders"):
            ac["workOrders"] = [
                {"title": "Zonal inspection — wing fixed trailing edge", "type": "Inspection", "priority": "high", "days": 3},
                {"title": "Replace brake wear pins (main L)", "type": "Corrective", "priority": "medium", "days": 9},
            ]
        pred = ac.get("predictions") or {}
        if not pred.get("labels"):
            ac["predictions"] = _demo_predictions()
        if ac.get("inspectionChecklist") == [{"zone": "-", "items": []}]:
            ac["inspectionChecklist"] = _walkthrough_checklist()
    else:
        ac.setdefault("health", 72)
        ac.setdefault("status", "operational")
        ac.setdefault("bayLocation", "Remote parking")
        ac.setdefault("assignedMechanic", "—")
        if not ac.get("predictions", {}).get("labels"):
            ac["predictions"] = _demo_predictions()
        if ac.get("inspectionChecklist") == [{"zone": "-", "items": []}]:
            ac["inspectionChecklist"] = _walkthrough_checklist()


def _load_fleet() -> dict[str, dict[str, Any]]:
    if not _SEED_PATH.is_file():
        raise FileNotFoundError(f"Missing fleet seed: {_SEED_PATH}")
    raw = json.loads(_SEED_PATH.read_text(encoding="utf-8"))
    out: dict[str, dict[str, Any]] = {}
    for tail, ac in raw.items():
        ac2 = copy.deepcopy(ac)
        _enrich_aircraft(tail, ac2)
        out[tail] = ac2
    return out


def get_fleet() -> dict[str, dict[str, Any]]:
    global _fleet
    with _lock:
        if _fleet is None:
            _fleet = _load_fleet()
        return _fleet


def metrics() -> dict[str, Any]:
    with _lock:
        fleet = get_fleet()
        n = len(fleet)
        if n == 0:
            return {
                "aircraftCount": 0,
                "averageHealth": 0,
                "totalAlerts": 0,
                "criticalCount": 0,
                "pendingWorkOrders": 0,
                "savingsYTD": "-",
            }
        total_h = sum(int(ac.get("health") or 0) for ac in fleet.values())
        alerts = sum(len(ac.get("alerts") or []) for ac in fleet.values())
        crit = sum(
            1
            for ac in fleet.values()
            for a in ac.get("alerts") or []
            if isinstance(a, dict) and a.get("severity") == "critical"
        )
        wo = sum(len(ac.get("workOrders") or []) for ac in fleet.values())
        return {
            "aircraftCount": n,
            "averageHealth": round(total_h / n),
            "totalAlerts": alerts,
            "criticalCount": crit,
            "pendingWorkOrders": wo,
            "savingsYTD": "$4.1M",
        }


def fleet_summary() -> list[dict[str, Any]]:
    with _lock:
        fleet = get_fleet()
        rows = []
        for tail, data in fleet.items():
            rows.append(
                {
                    "tailNumber": tail,
                    "name": data.get("name", "-"),
                    "health": data.get("health", 0),
                    "status": data.get("status", "-"),
                    "route": data.get("route", "-"),
                    "bayLocation": data.get("bayLocation", "-"),
                    "assignedMechanic": data.get("assignedMechanic", "-"),
                    "alertCount": len(data.get("alerts") or []),
                }
            )
        return rows


def get_aircraft(tail: str) -> dict[str, Any] | None:
    with _lock:
        ac = get_fleet().get(tail)
        if ac is None:
            return None
        return copy.deepcopy(ac)


def camera_payload(tail: str, settings: Settings) -> dict[str, Any] | None:
    ac = get_aircraft(tail)
    if ac is None:
        return None
    zones = ac.get("cameraZones", []) or []
    return {
        "tailNumber": tail,
        "cameraStatus": {
            "battery": "94%",
            "signal": "Strong",
            "gyroAlignment": "Locked",
            "mode": "Inspection sweep",
        },
        "zones": zones,
        "exterior_zone_photos": zone_captures.exterior_zone_photos_payload(tail, zones, settings),
    }


def toggle_inspection_item(tail: str, item_id: str, _notes: str | None) -> bool:
    order = ("pending", "pass", "fail", "skip")

    def _next(st: str) -> str:
        try:
            i = order.index(st)
        except ValueError:
            i = 0
        return order[(i + 1) % len(order)]

    with _lock:
        fleet = get_fleet()
        ac = fleet.get(tail)
        if not ac:
            return False
        for zone in ac.get("inspectionChecklist") or []:
            for item in zone.get("items") or []:
                if item.get("id") == item_id:
                    item["status"] = _next(str(item.get("status") or "pending"))
                    return True
        return False


def acknowledge_alert(tail: str, index: int) -> dict[str, Any]:
    with _lock:
        fleet = get_fleet()
        ac = fleet.get(tail)
        if not ac:
            return {"success": False, "remainingAlerts": []}
        alerts = ac.get("alerts") or []
        if 0 <= index < len(alerts):
            ac["alerts"] = [a for i, a in enumerate(alerts) if i != index]
        return {"success": True, "remainingAlerts": copy.deepcopy(ac.get("alerts") or [])}


def complete_workorder(tail: str, index: int, status: str | None) -> dict[str, Any]:
    with _lock:
        fleet = get_fleet()
        ac = fleet.get(tail)
        if not ac:
            return {"success": False, "workOrders": []}
        wos = ac.get("workOrders") or []
        if status == "completed" and 0 <= index < len(wos):
            ac["workOrders"] = [w for i, w in enumerate(wos) if i != index]
        return {"success": True, "workOrders": copy.deepcopy(ac.get("workOrders") or [])}


def add_workorder(tail: str, workorder: dict[str, Any]) -> dict[str, Any]:
    with _lock:
        fleet = get_fleet()
        ac = fleet.get(tail)
        if not ac:
            return {"success": False, "workOrders": []}
        wos = list(ac.get("workOrders") or [])
        wos.append(copy.deepcopy(workorder))
        ac["workOrders"] = wos
        return {"success": True, "workOrders": copy.deepcopy(ac["workOrders"])}
