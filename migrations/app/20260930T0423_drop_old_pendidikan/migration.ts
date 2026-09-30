#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/41b3a595eb18c3bd2586f0c3317d32d861ce6fecb14139014454a2e5aa87a187/contract';
import endContract from '../../snapshots/41b3a595eb18c3bd2586f0c3317d32d861ce6fecb14139014454a2e5aa87a187/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/e6a72e8efec4431ef4f64f9b521cff9b4fc8a607795a4c8d02055630485aad8e/contract';
import startContract from '../../snapshots/e6a72e8efec4431ef4f64f9b521cff9b4fc8a607795a4c8d02055630485aad8e/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [this.dropColumn({ schema: 'public', table: 'dosen', column: 'pendidikan' })];
  }
}

MigrationCLI.run(import.meta.url, M);
