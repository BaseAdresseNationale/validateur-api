import * as dotenv from 'dotenv';
import * as bluebird from 'bluebird';
import * as fs from 'fs';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import { join } from 'path';
import {
  ValidateType,
  validate,
  getErrorLevel,
  ErrorLevelEnum,
} from '@ban-team/validateur-bal';

import { Revision } from './api-depot.types';

import {
  OrganizationMoissoneurType,
  SourceMoissoneurType,
} from './moissoneur.type';

dotenv.config();

const profileBase = '1.3-relax';
const profilesTest = ['1.3-relax', '1.3', '1.4'];

type RevisionError = {
  code_commune?: string;
  revision_id?: string;
  erreurs?: string;
  client_nom?: string;
  bal_id?: string;
  source_nom?: string;
  organization_nom?: string;
  date?: string;
};

let organizations: OrganizationMoissoneurType[];

async function getReportevision(revisionId?: string): Promise<ValidateType> {
  const response = await fetch(
    `${process.env.API_DEPOT_URL}/revisions/${revisionId}/files/bal/download`,
  );
  const file = Buffer.from(await response.arrayBuffer());
  const report: ValidateType = (await validate(file, {
    profile: profileBase,
  })) as ValidateType;
  return report;
}

async function writeInCsv(recordsByProfile: Record<string, RevisionError[]>) {
  const csvDir = join(__dirname, '../../csv');
  if (!fs.existsSync(csvDir)) {
    fs.mkdirSync(csvDir);
  }

  for (const profile of profilesTest) {
    const csvWriter = createCsvWriter({
      path: `${csvDir}/${profile}.csv`,
      header: [
        { id: 'code_commune', title: 'code_commune' },
        { id: 'revision_id', title: 'revision_id' },
        { id: 'erreurs', title: 'erreurs' },
        { id: 'client_nom', title: 'client' },
        { id: 'bal_id', title: 'bal_id' },
        { id: 'source_nom', title: 'source_id' },
        { id: 'organization_nom', title: 'organization_id' },
        { id: 'date', title: 'date' },
      ],
    });
    await csvWriter.writeRecords(recordsByProfile[profile]); // returns a promise
    console.log(`${profile}...Done`);
  }
}

async function validateFileWithProfiles(
  recordsByProfile: Record<string, RevisionError[]>,
  revision: Revision,
) {
  const { profilesValidation, uniqueErrors }: ValidateType =
    await getReportevision(revision.id);

  for (const profile of profilesTest) {
    if (
      profilesValidation &&
      uniqueErrors &&
      profilesValidation[profile].isValid === false
    ) {
      const erreurs: string = uniqueErrors
        .filter((e) => getErrorLevel(profile, e) === ErrorLevelEnum.ERROR)
        .join(',');

      let bal_id = '';
      let source_nom = '';
      let organization_nom = '';
      if (
        'mes-adresses' === revision?.client?.legacyId ||
        'moissonneur-bal' === revision?.client?.legacyId
      ) {
        const { context }: Revision = (await fetch(
          `${process.env.API_DEPOT_URL}/revisions/${revision.id}`,
        ).then((res) => res.json())) as Revision;

        if ('mes-adresses' === revision?.client?.legacyId) {
          bal_id = context?.extras?.balId;
        } else if (
          'moissonneur-bal' === revision?.client?.legacyId &&
          context?.extras?.sourceId
        ) {
          const source: SourceMoissoneurType = (await fetch(
            `${process.env.API_MOISSONNEUR_URL}/sources/${context?.extras?.sourceId}`,
          ).then((res) => res.json())) as SourceMoissoneurType;

          source_nom = source.title;
          const organization = organizations.find(
            ({ id }) => id === source.organizationId,
          );
          organization_nom = organization?.name || '';
        }
      }
      // JSON
      recordsByProfile[profile].push({
        code_commune: revision.codeCommune,
        revision_id: revision.id,
        erreurs,
        client_nom: revision?.client?.nom,
        bal_id,
        source_nom,
        organization_nom,
        date: (revision.publishedAt as unknown as string)?.split('T')[0],
      });
    }
  }
}

async function main() {
  organizations = (await fetch(
    `${process.env.API_MOISSONNEUR_URL}/organizations`,
  ).then((res) => res.json())) as OrganizationMoissoneurType[];

  const revisions: Revision[] = (await fetch(
    `${process.env.API_DEPOT_URL}/current-revisions`,
  ).then((res) => res.json())) as Revision[];

  const recordsByProfile: Record<string, RevisionError[]> = {};
  for (const profile of profilesTest) {
    recordsByProfile[profile] = [];
  }

  await bluebird.map(
    revisions,
    async (revision: Revision, line: number) => {
      if (line === 0) {
        console.log(`${revisions.length} line left`);
      } else if (line % 100 === 0) {
        console.log(`${line} line left`);
      }

      await validateFileWithProfiles(recordsByProfile, revision);
    },
    { concurrency: 4 },
  );

  await writeInCsv(recordsByProfile);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
