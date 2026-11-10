#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/32ec3705587e447676509fc58ec87980ebe0d9c983282ee94aa4f0e26116e342/contract';
import startContract from '../../snapshots/32ec3705587e447676509fc58ec87980ebe0d9c983282ee94aa4f0e26116e342/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/8321d01a843f6bcbce8832b614e3475d5752b947c8778ebe6307ca610397a513/contract';
import endContract from '../../snapshots/8321d01a843f6bcbce8832b614e3475d5752b947c8778ebe6307ca610397a513/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'berita',
        column: col('status', 'text', {
          notNull: true,
          default: lit('PUBLISHED'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.dropDefault({
        schema: 'public',
        table: 'berita',
        column: 'status',
      }),
      this.setDefault({
        schema: 'public',
        table: 'berita',
        column: 'status',
        defaultSql: "DEFAULT 'DRAFT'",
        operationClass: 'widening',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'berita',
        constraint: 'berita_status_1b4a7b6b',
        expression: "\"status\" IN ('DRAFT', 'PUBLISHED')",
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
