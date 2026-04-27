"""
Fleet and aircraft routes migrated from `server/index.js` (Express) for the React client.
"""

from pathlib import Path
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.core.config import Settings, get_settings
from app.services import fleet_store, storage, zone_captures

router = APIRouter(tags=["fleet"])


def _require_tail(tail: str) -> None:
    if fleet_store.get_aircraft(tail) is None:
        raise HTTPException(status_code=404, detail="Aircraft not found")


class ToggleBody(BaseModel):
    notes: str | None = None


class WorkOrderPatch(BaseModel):
    status: str | None = None


class WorkOrderCreate(BaseModel):
    title: str = Field(min_length=1, max_length=220)
    type: str = Field(default="Corrective", max_length=80)
    priority: Literal["critical", "high", "medium", "low"] = "medium"
    days: int = Field(default=7, ge=1, le=365)


@router.get("/fleet")
def list_fleet():
    return fleet_store.fleet_summary()


@router.get("/fleet/metrics")
def fleet_metrics():
    return fleet_store.metrics()


@router.get("/aircraft/{tail}")
def get_aircraft_detail(tail: str):
    ac = fleet_store.get_aircraft(tail)
    if ac is None:
        raise HTTPException(status_code=404, detail="Aircraft not found")
    return {"tailNumber": tail, **ac}


@router.get("/aircraft/{tail}/camera")
def get_camera(
    tail: str,
    settings: Annotated[Settings, Depends(get_settings)],
):
    payload = fleet_store.camera_payload(tail, settings)
    if payload is None:
        raise HTTPException(status_code=404, detail="Aircraft not found")
    return payload


@router.get("/aircraft/{tail}/manuals")
def get_manuals(tail: str):
    ac = fleet_store.get_aircraft(tail)
    if ac is None:
        raise HTTPException(status_code=404, detail="Aircraft not found")
    return {"tailNumber": tail, "manuals": ac.get("maintenanceManuals", [])}


@router.get("/aircraft/{tail}/inspections")
def get_inspections(
    tail: str,
    settings: Annotated[Settings, Depends(get_settings)],
):
    ac = fleet_store.get_aircraft(tail)
    if ac is None:
        raise HTTPException(status_code=404, detail="Aircraft not found")
    checklist = ac.get("inspectionChecklist") or []
    zones = ac.get("cameraZones") or []
    photos = zone_captures.exterior_zone_photos_payload(tail, zones, settings)
    return {"tailNumber": tail, "checklist": checklist, "exterior_zone_photos": photos}


@router.delete("/aircraft/{tail}/exterior-zone-photos/{capture_id}")
def delete_exterior_zone_photo(
    tail: str,
    capture_id: str,
    settings: Annotated[Settings, Depends(get_settings)],
):
    """
    Remove a saved zone image from the manifest for this tail.
    Deletes the on-disk file when no other zone_captures row points at the same filename.
    """
    _require_tail(tail)
    rec = zone_captures.remove_zone_capture_by_id(
        settings,
        aircraft_tail=tail,
        capture_id=capture_id,
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Zone photo not found for this aircraft")
    fn = str(rec.get("frame_filename") or "").strip()
    if fn and zone_captures.count_references_to_frame_filename(settings, fn) == 0:
        storage.try_delete_orphan_frame_file(settings, fn)
    return {"success": True, "id": capture_id}


@router.post("/aircraft/{tail}/exterior-zones/{zone_id}/photo")
async def upload_exterior_zone_photo(
    tail: str,
    zone_id: str,
    settings: Annotated[Settings, Depends(get_settings)],
    file: UploadFile = File(...),
):
    """Save a photo for a camera inspection zone (no Gemini run)."""
    _require_tail(tail)
    ac = fleet_store.get_aircraft(tail)
    if ac is None:
        raise HTTPException(status_code=404, detail="Aircraft not found")
    valid_ids = {str(z.get("id")) for z in (ac.get("cameraZones") or []) if z.get("id")}
    if zone_id not in valid_ids:
        raise HTTPException(status_code=404, detail="Unknown exterior zone")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=422, detail="empty upload")
    filename = file.filename or "zone.jpg"
    ext = Path(filename).suffix or ".jpg"
    path_str = storage.save_frame(data, ext, None, settings)
    frame_fn = Path(path_str).name
    rec = zone_captures.append_zone_capture(
        settings,
        aircraft_tail=tail,
        zone_id=zone_id,
        frame_filename=frame_fn,
        run_id=None,
    )
    return {
        "success": True,
        "capture": {
            "id": rec["id"],
            "zoneId": zone_id,
            "capturedAt": rec["captured_at"],
            "imageUrl": f"/api/frames/file/{frame_fn}",
        },
    }


@router.post("/aircraft/{tail}/inspections/{item_id}/toggle")
def toggle_inspection(tail: str, item_id: str, body: ToggleBody | None = None):
    _require_tail(tail)
    notes = body.notes if body else None
    ok = fleet_store.toggle_inspection_item(tail, item_id, notes)
    if not ok:
        raise HTTPException(status_code=404, detail="Aircraft or inspection item not found")
    return {"success": True}


@router.post("/aircraft/{tail}/alerts/{index}/acknowledge")
def acknowledge_alert_route(tail: str, index: int):
    if index < 0:
        raise HTTPException(status_code=422, detail="Invalid index")
    _require_tail(tail)
    return fleet_store.acknowledge_alert(tail, index)


@router.post("/aircraft/{tail}/workorders")
def create_workorder(tail: str, body: WorkOrderCreate):
    _require_tail(tail)
    wo = {
        "title": body.title.strip(),
        "type": (body.type.strip() or "Corrective"),
        "priority": body.priority,
        "days": body.days,
    }
    return fleet_store.add_workorder(tail, wo)


@router.patch("/aircraft/{tail}/workorders/{index}")
def patch_workorder(tail: str, index: int, body: WorkOrderPatch):
    if index < 0:
        raise HTTPException(status_code=422, detail="Invalid index")
    _require_tail(tail)
    return fleet_store.complete_workorder(tail, index, body.status)
