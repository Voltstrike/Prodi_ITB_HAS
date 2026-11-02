#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/275a1fff110ed606f2e9a154a9442e63b0695c3d42213e5571ff65c6fc937366/contract';
import startContract from '../../snapshots/275a1fff110ed606f2e9a154a9442e63b0695c3d42213e5571ff65c6fc937366/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/33e4a59def4229b2c699b708d715d2160072141e37fccdc2b98e0e8f21f55d85/contract';
import endContract from '../../snapshots/33e4a59def4229b2c699b708d715d2160072141e37fccdc2b98e0e8f21f55d85/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'berita',
        column: col('thumbnail', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
