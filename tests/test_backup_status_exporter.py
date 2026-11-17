from datetime import datetime, timezone
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location(
    "backup_status_exporter", Path(__file__).parents[1] / "scripts/export-backup-status.py",
)
exporter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(exporter)
NOW = datetime(2026, 11, 16, 6, 0, tzinfo=timezone.utc)


class ExporterTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.folder = Path(self.temp.name)
        self.paths = patch.multiple(
            exporter, ARCHIVES=self.folder / "archives",
            RECEIPT=self.folder / "receipt.json", STATE=self.folder / "local.json",
        )
        self.paths.start()
        exporter.ARCHIVES.mkdir()
        self.archive = exporter.ARCHIVES / "prodi-20261116T041936Z-YNYfHT.tar"
        self.archive.write_bytes(b"fixture-only")
        self.archive.with_name(self.archive.name + ".sha256").write_text("fixture")
        self.receipt = {
            "completed_at": "2026-11-16T04:20:07.705635+00:00",
            "archive_count": 14,
            "latest_backup": self.archive.name,
            "latest_sha256": "a" * 64,
            "recovery_file": "gdrive_itbhas_crypt:recovery/runtime-prodi-20261116T041936Z-YNYfHT-aaaa.json",
            "recovery_sha256": "b" * 64,
            "environment": {"MFA_ENCRYPTION_KEY": "PRIVATE-FIXTURE"},
        }
        exporter.RECEIPT.write_text(json.dumps(self.receipt))
        self.local = {"LoadState": "loaded", "ActiveState": "inactive", "Result": "success", "ExecMainExitTimestamp": "Mon 2026-11-16 04:19:59 UTC"}
        self.drive = {**self.local, "ExecMainExitTimestamp": "Mon 2026-11-16 04:20:08 UTC"}
        self.timer = {"LoadState": "loaded", "ActiveState": "active", "NextElapseUSecRealtime": "Mon 2026-11-16 19:30:00 UTC"}

    def tearDown(self):
        self.paths.stop()
        self.temp.cleanup()

    def snapshot(self):
        with patch.object(exporter, "properties", side_effect=[self.local, self.drive, self.timer]):
            return exporter.snapshot(NOW)

    def test_snapshot_allowlists_metadata_and_reports_actual_schedule(self):
        result = self.snapshot()
        self.assertEqual(result["local"]["lastSuccessAt"], "2026-11-16T04:19:59Z")
        self.assertEqual(result["drive"]["verifiedArchives"], 14)
        self.assertTrue(result["drive"]["recoveryVerified"])
        self.assertEqual(result["schedule"]["nextRunAt"], "2026-11-16T19:30:00Z")
        encoded = json.dumps(result)
        for sensitive in ("PRIVATE", "MFA_ENCRYPTION_KEY", "recovery_file", "gdrive_itbhas_crypt", str(self.folder)):
            self.assertNotIn(sensitive, encoded)

    def test_failure_preserves_previous_success_without_claiming_new_success(self):
        initial = self.snapshot()
        self.local.update(ActiveState="failed", Result="exit-code", ExecMainExitTimestamp="Mon 2026-11-16 05:30:00 UTC")
        self.drive.update(ActiveState="failed", Result="exit-code")
        result = self.snapshot()
        self.assertEqual(result["local"]["state"], "failed")
        self.assertEqual(result["drive"]["state"], "failed")
        self.assertEqual(result["local"]["lastSuccessAt"], initial["local"]["lastSuccessAt"])
        self.assertEqual(result["drive"]["lastSuccessAt"], initial["drive"]["lastSuccessAt"])

    def test_bad_receipt_and_future_dates_do_not_report_success(self):
        self.receipt["completed_at"] = "2026-11-17T04:20:00+00:00"
        exporter.RECEIPT.write_text(json.dumps(self.receipt))
        result = self.snapshot()
        self.assertIsNone(result["drive"]["lastSuccessAt"])
        self.assertEqual(result["drive"]["state"], "unknown")
        self.assertFalse(result["drive"]["recoveryVerified"])

    def test_symlinks_and_nonregular_or_oversized_receipts_are_rejected(self):
        exporter.RECEIPT.unlink()
        exporter.RECEIPT.symlink_to(self.archive)
        self.assertEqual(exporter.read_json(exporter.RECEIPT), {})
        exporter.RECEIPT.unlink()
        os.mkfifo(exporter.RECEIPT)
        self.assertEqual(exporter.read_json(exporter.RECEIPT), {})
        exporter.RECEIPT.unlink()
        exporter.RECEIPT.write_text("x" * (exporter.LIMIT + 1))
        self.assertEqual(exporter.read_json(exporter.RECEIPT), {})
        self.archive.unlink()
        self.archive.symlink_to(exporter.RECEIPT)
        self.assertEqual(exporter.archive_metadata(), (0, None))


if __name__ == "__main__":
    unittest.main()
