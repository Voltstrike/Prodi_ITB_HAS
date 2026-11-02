#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/33e4a59def4229b2c699b708d715d2160072141e37fccdc2b98e0e8f21f55d85/contract';
import startContract from '../../snapshots/33e4a59def4229b2c699b708d715d2160072141e37fccdc2b98e0e8f21f55d85/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/c987cb0d8039515bf2d69672f058cd4170643ea45256f4fd0762aeb549868cc6/contract';
import endContract from '../../snapshots/c987cb0d8039515bf2d69672f058cd4170643ea45256f4fd0762aeb549868cc6/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'profil',
        column: col('fotoProdi', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
