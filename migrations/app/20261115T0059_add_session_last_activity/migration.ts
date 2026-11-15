#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/5884e1e45d7e37c9b182bd94b0744b579bb4068b4d349b85fba111a542da4c99/contract';
import endContract from '../../snapshots/5884e1e45d7e37c9b182bd94b0744b579bb4068b4d349b85fba111a542da4c99/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/8321d01a843f6bcbce8832b614e3475d5752b947c8778ebe6307ca610397a513/contract';
import startContract from '../../snapshots/8321d01a843f6bcbce8832b614e3475d5752b947c8778ebe6307ca610397a513/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'adminSession',
        column: col('lastActivityAt', 'timestamptz', {
          notNull: true,
          default: fn('now()'),
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
