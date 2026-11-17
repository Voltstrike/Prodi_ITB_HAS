#!/usr/bin/python3
from datetime import datetime, timezone, timedelta
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import tempfile

OUTPUT = Path("/data/prodi/backup-status/status.json")
STATE = Path("/var/lib/prodi-backup-status/local-success.json")
RECEIPT = Path("/var/lib/prodi-backup-drive/last-success.json")
ARCHIVES = Path("/data/prodi/backups/daily")
LIMIT = 16 * 1024

def iso(value):
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")

def timestamp(value, now):
    if not isinstance(value, str) or len(value) > 64:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None or parsed > now + timedelta(seconds=60):
            return None
        return iso(parsed)
    except ValueError:
        return None

def number(value):
    return value if type(value) is int and 0 <= value <= 9007199254740991 else None

def read_json(path):
    try:
        descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
        with os.fdopen(descriptor, "rb") as handle:
            info = os.fstat(handle.fileno())
            if not stat.S_ISREG(info.st_mode) or info.st_size > LIMIT:
                return {}
            data = handle.read(LIMIT + 1)
            if len(data) > LIMIT:
                return {}
            result = json.loads(data)
            return result if isinstance(result, dict) else {}
    except (OSError, ValueError):
        return {}

def properties(unit, fields):
    command = ["systemctl", "show", unit]
    for field in fields:
        command += ["-p", field]
    result = subprocess.run(
        command, stdin=subprocess.DEVNULL, capture_output=True,
        text=True, timeout=10, check=True,
    )
    return dict(
        line.split("=", 1)
        for line in result.stdout.splitlines() if "=" in line
    )

def systemd_time(value, now):
    if not value or value in ("n/a", "0", "infinity"):
        return None
    result = subprocess.run(
        ["date", "-u", "-d", value, "+%Y-%m-%dT%H:%M:%SZ"],
        stdin=subprocess.DEVNULL, capture_output=True,
        text=True, timeout=5,
    )
    return timestamp(result.stdout.strip(), now) if result.returncode == 0 else None

def service_state(props, last_success):
    if props.get("LoadState") != "loaded":
        return "unknown"
    if props.get("ActiveState") in (
        "active", "activating", "deactivating", "reloading",
    ):
        return "running"
    if (
        props.get("ActiveState") == "failed"
        or props.get("Result") not in ("", None, "success")
    ):
        return "failed"
    return "success" if last_success and props.get("Result") == "success" else "unknown"

def atomic_json(path, value, mode):
    descriptor, temporary = tempfile.mkstemp(prefix=".status-", dir=path.parent)
    try:
        with os.fdopen(descriptor, "w") as handle:
            json.dump(value, handle, separators=(",", ":"), allow_nan=False)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
            os.fchmod(handle.fileno(), mode)
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)

def archive_metadata():
    available = []
    if not ARCHIVES.is_dir() or ARCHIVES.is_symlink():
        return None, None
    for path in ARCHIVES.glob("prodi-*.tar"):
        if not re.fullmatch(r"prodi-[A-Za-z0-9_-]+\.tar", path.name):
            continue
        checksum = path.with_name(path.name + ".sha256")
        try:
            info, checksum_info = path.lstat(), checksum.lstat()
            if (
                not stat.S_ISREG(info.st_mode)
                or not stat.S_ISREG(checksum_info.st_mode)
            ):
                continue
            if info.st_size > 0:
                available.append((info.st_mtime_ns, info.st_size))
        except OSError:
            continue
    return len(available), number(max(available)[1]) if available else None

def snapshot(now):
    fields = ["LoadState", "ActiveState", "Result", "ExecMainExitTimestamp"]
    local = properties("prodi-backup.service", fields)
    drive = properties("prodi-backup-drive.service", fields)
    timer = properties(
        "prodi-backup.timer",
        ["LoadState", "ActiveState", "NextElapseUSecRealtime"],
    )

    local_success = timestamp(read_json(STATE).get("lastSuccessAt"), now)
    exit_at = systemd_time(local.get("ExecMainExitTimestamp"), now)

    if (
        local.get("LoadState") == "loaded"
        and local.get("ActiveState") == "inactive"
        and local.get("Result") == "success"
        and exit_at
    ):
        local_success = max(
            filter(None, [local_success, exit_at]),
            key=lambda value: datetime.fromisoformat(
                value.replace("Z", "+00:00")
            ),
        )
        atomic_json(STATE, {"lastSuccessAt": local_success}, 0o600)

    receipt = read_json(RECEIPT)
    completed = timestamp(receipt.get("completed_at"), now)
    verified = number(receipt.get("archive_count"))

    valid_receipt = (
        completed and verified
        and re.fullmatch(
            r"prodi-[A-Za-z0-9_-]+\.tar",
            str(receipt.get("latest_backup", "")),
        )
        and re.fullmatch(
            r"[a-f0-9]{64}",
            str(receipt.get("latest_sha256", "")),
        )
    )
    drive_success = completed if valid_receipt else None

    recovery_ok = bool(
        drive_success
        and re.fullmatch(
            r"gdrive_itbhas_crypt:recovery/runtime-prodi-[A-Za-z0-9_-]+\.json",
            str(receipt.get("recovery_file", "")),
        )
        and re.fullmatch(
            r"[a-f0-9]{64}",
            str(receipt.get("recovery_sha256", "")),
        )
    )

    count, size = archive_metadata()
    return {
        "version": 1,
        "generatedAt": iso(now),
        "schedule": {
            "active": (
                timer.get("LoadState") == "loaded"
                and timer.get("ActiveState") == "active"
            ),
            "nextRunAt": systemd_time(
                timer.get("NextElapseUSecRealtime"),
                now + timedelta(days=366),
            ),
        },
        "local": {
            "state": service_state(local, local_success),
            "lastSuccessAt": local_success,
            "availableArchives": count,
            "latestArchiveBytes": size,
        },
        "drive": {
            "state": service_state(drive, drive_success),
            "lastSuccessAt": drive_success,
            "verifiedArchives": verified if drive_success else None,
            "recoveryVerified": recovery_ok,
        },
    }

if __name__ == "__main__":
    try:
        os.umask(0o077)
        for folder in (OUTPUT.parent, STATE.parent):
            if not folder.is_dir() or folder.is_symlink():
                raise RuntimeError("Direktori status tidak valid.")
        result = snapshot(datetime.now(timezone.utc))
        atomic_json(OUTPUT, result, 0o644)
        print("Status backup diperbarui.")
    except Exception as error:
        print("Pembaruan status gagal:", type(error).__name__)
        raise SystemExit(1)
