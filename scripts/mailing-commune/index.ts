import * as fs from 'fs';
import { join } from 'path';
import * as Papa from 'papaparse';
import { getLabel, autofix, validate } from '@ban-team/validateur-bal';
import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';
import * as dotenv from 'dotenv';

dotenv.config({ path: join(__dirname, '../../', '.env') });

type CsvRow = {
  code_commune: string;
  revision_id: string;
  erreurs: string;
  client: string;
  bal_id: string;
  source_id: string;
  organization_id: string;
  date: string;
};

type Mairie = {
  adresse_courriel: string;
  siret: string;
};

type ApiAnnuaireResponse = {
  results: Mairie[];
};

function validateEmail(email: string): boolean {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[(?:\d{1,3}\.){3}\d{1,3}])|(([a-zA-Z\-\d]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

async function getCommuneName(codeCommune: string): Promise<string> {
  try {
    const url = `https://geo.api.gouv.fr/communes/${codeCommune}?fields=nom`;
    const response = await fetch(url);
    if (!response.ok) {
      return codeCommune;
    }
    const data: { nom?: string } = await response.json();
    return data.nom || codeCommune;
  } catch {
    return codeCommune;
  }
}

async function getMairies(codeCommune: string): Promise<Mairie[]> {
  const baseUrl = 'https://api-lannuaire.service-public.fr/api/explore/v2.1';
  const url = `${baseUrl}/catalog/datasets/api-lannuaire-administration/records?where=pivot%20LIKE%20"mairie"%20AND%20code_insee_commune="${codeCommune}"&limit=100`;

  const response = await fetch(url);
  const data: ApiAnnuaireResponse = await response.json();
  return data.results || [];
}

function getErrorLabels(erreurs: string): { code: string; label: string }[] {
  if (!erreurs || erreurs.trim() === '') {
    return [];
  }
  const errorCodes = erreurs.split(',').map((e) => e.trim());
  return errorCodes.map((code) => ({
    code,
    label: getLabel(code),
  }));
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'YES',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function loadEmailTemplate(templateName: string): Handlebars.TemplateDelegate {
  const templatePath = join(__dirname, `templates/${templateName}.hbs`);
  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  return Handlebars.compile(templateSource);
}

const API_URL = 'https://api-bal.adresse.data.gouv.fr';

async function downloadBalFile(balFileUrl: string): Promise<Buffer> {
  const response = await fetch(balFileUrl);
  if (!response.ok) {
    throw new Error(
      `Erreur lors du telechargement du fichier BAL: ${response.status} ${response.statusText}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function getEmailsCommune(codeCommune: string): Promise<string[]> {
  try {
    const res = await getMairies(codeCommune);

    const mairies = res.filter(
      ({ adresse_courriel }) => adresse_courriel && adresse_courriel !== '',
    );

    if (mairies.length <= 0) {
      return [];
    }

    const emails: string[] = [
      ...new Set<string>(
        mairies
          .reduce(
            (accumulator: string[], { adresse_courriel }) => [
              ...accumulator,
              ...adresse_courriel.split(';'),
            ],
            [],
          )
          .filter((email: string) => validateEmail(email)),
      ),
    ];

    return emails;
  } catch (error) {
    console.error(`Erreur pour la commune ${codeCommune}:`, error);
    return [];
  }
}

function getCsvPath(): string {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: yarn mailing-commune <chemin-fichier-csv>');
    console.error('Exemple: yarn mailing-commune ./csv/1.3.csv');
    process.exit(1);
  }
  const csvPath = args[0];
  if (!fs.existsSync(csvPath)) {
    console.error(`Erreur: Le fichier "${csvPath}" n'existe pas`);
    process.exit(1);
  }
  return csvPath;
}

async function main() {
  const csvPath = getCsvPath();
  console.log(`Lecture du fichier CSV: ${csvPath}`);
  const content = fs.readFileSync(csvPath, 'utf-8');

  const { data } = Papa.parse<CsvRow>(content, {
    header: true,
    skipEmptyLines: true,
  });

  // Initialiser le transporteur SMTP et les templates
  const transporter = createTransporter();
  const autofixTemplate = loadEmailTemplate('bal-autofix-notification');
  const manualFixTemplate = loadEmailTemplate('bal-manual-fix-notification');

  const results = await Promise.all(
    data.map(async (row) => {
      const [emails] = await Promise.all([getEmailsCommune(row.code_commune)]);
      const errorLabels = getErrorLabels(row.erreurs);
      return {
        ...row,
        emails_mairie: emails,
        error_labels: errorLabels,
      };
    }),
  );

  // Envoyer les emails aux communes avec des erreurs
  let emailsSent = 0;
  let emailsSkipped = 0;

  for (const result of results) {
    if (
      result.error_labels.length > 0 &&
      result.emails_mairie.length > 0 &&
      result.client === 'Formulaire de publication'
    ) {
      try {
        const balFileUrl = `https://plateforme-bal.adresse.data.gouv.fr/api-depot/revisions/${result.revision_id}/files/bal/download`;

        const balBuffer = await downloadBalFile(balFileUrl);
        console.log(
          `Fichier BAL telecharge pour la commune ${result.code_commune}`,
        );

        const fixedBalBuffer = await autofix(balBuffer);
        if (!fixedBalBuffer) {
          console.error(
            `Erreur lors de l'autofix pour la commune ${result.code_commune}: fichier non parsable`,
          );
          emailsSkipped++;
          continue;
        }
        console.log(`Autofix applique pour la commune ${result.code_commune}`);

        // Valider le fichier corrigé pour vérifier si l'autofix a fonctionné
        const validationResult = await validate(fixedBalBuffer, {
          profile: '1.3',
        });

        if (validationResult.parseOk) {
          console.log(
            `Commune ${result.code_commune}: toutes les erreurs ont ete corrigees par l'autofix`,
          );

          // Récupérer le nom de la commune et envoyer l'email d'autofix
          const communeName = await getCommuneName(result.code_commune);
          const html = autofixTemplate({
            codeCommune: result.code_commune,
            communeName,
            errorLabels: result.error_labels,
            balFileUrl,
            apiUrl: API_URL,
          });

          await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: result.emails_mairie.join(', '),
            bcc: process.env.SMTP_BCC || undefined,
            subject: `Votre BAL contient des erreurs - Commune de ${communeName}`,
            html,
          });

          console.log(
            `Email autofix envoye pour la commune ${result.code_commune} a ${result.emails_mairie.join(', ')}`,
          );
          emailsSent++;
        } else {
          const remainingErrors =
            'uniqueErrors' in validationResult
              ? validationResult.uniqueErrors
              : [];
          console.log(
            `Commune ${result.code_commune}: ${remainingErrors.length} erreur(s) restante(s) apres autofix: ${remainingErrors.join(', ')}`,
          );

          // Récupérer le nom de la commune et envoyer l'email de correction manuelle
          const communeName = await getCommuneName(result.code_commune);
          const html = manualFixTemplate({
            codeCommune: result.code_commune,
            communeName,
            errorLabels: result.error_labels,
            balFileUrl,
            apiUrl: API_URL,
          });

          await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: result.emails_mairie.join(', '),
            bcc: process.env.SMTP_BCC || undefined,
            subject: `Votre BAL contient des erreurs - Commune de ${communeName}`,
            html,
          });

          console.log(
            `Email correction manuelle envoye pour la commune ${result.code_commune} a ${result.emails_mairie.join(', ')}`,
          );
          emailsSent++;
        }
      } catch (error) {
        console.error(
          `Erreur lors de l'envoi de l'email pour la commune ${result.code_commune}:`,
          error,
        );
      }
    } else {
      if (result.error_labels.length === 0) {
        console.log(`Commune ${result.code_commune}: aucune erreur`);
      } else if (result.emails_mairie.length === 0) {
        console.log(`Commune ${result.code_commune}: pas d'email disponible`);
      } else if (result.client !== 'Formulaire de publication') {
        console.log(
          `Commune ${result.code_commune}: client "${result.client}" ignore (seul "Formulaire de publication" est traite)`,
        );
      }
      emailsSkipped++;
    }
    console.log('-------------------------------------------------------');
    console.log('-                                                     -');
    console.log('-------------------------------------------------------');
  }

  console.log(
    `\nResume: ${emailsSent} emails envoyes, ${emailsSkipped} communes ignorees`,
  );
}

main();
