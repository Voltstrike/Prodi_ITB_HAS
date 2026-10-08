#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/997c2bbd9dc71b8b4d795c3c376a426c5b42dc7a325a5e71fe05469a1243f434/contract';
import startContract from '../../snapshots/997c2bbd9dc71b8b4d795c3c376a426c5b42dc7a325a5e71fe05469a1243f434/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/e8fcd2b10468ca2981299b6aaef8dc26e060a1266883473fe854c17b0d0cd2f3/contract';
import endContract from '../../snapshots/e8fcd2b10468ca2981299b6aaef8dc26e060a1266883473fe854c17b0d0cd2f3/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'adminUser',
        column: col('isActive', 'bool', {
          notNull: true,
          default: lit(true),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
