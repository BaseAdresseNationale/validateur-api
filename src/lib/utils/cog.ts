import communes from '@etalab/decoupage-administratif/data/communes.json';

export enum TypeCommuneEnum {
  COMMUNE_ACTUELLE = 'commune-actuelle',
  ARRONDISSEMENT = 'arrondissement-municipal',
  COMMUNE_DELEGUEE = 'commune-deleguee',
  COMMUNE_ASSOCIEE = 'commune-associee',
}

type CommuneCOG = {
  code: string;
  nom: string;
  typeLiaison: number;
  zone: string;
  arrondissement: string;
  anciensCodes?: string[];
  departement: string;
  region: string;
  chefLieu?: string;
  type: TypeCommuneEnum;
  rangChefLieu: number;
  siren: string;
  codesPostaux: string[];
  population: number;
  commune?: string;
};

const PLM = new Set(['75056', '69123', '13055']);

const codesCommunesActuelles = new Set<string>(
  (communes as CommuneCOG[])
    .filter(
      ({ type, code }) =>
        [
          TypeCommuneEnum.COMMUNE_ACTUELLE,
          TypeCommuneEnum.ARRONDISSEMENT,
        ].includes(type) && !PLM.has(code),
    )
    .map((c) => c.code),
);

const codesCommunesDeleguees = new Set<string>(
  (communes as CommuneCOG[])
    .filter(({ type }) =>
      [
        TypeCommuneEnum.COMMUNE_DELEGUEE,
        TypeCommuneEnum.COMMUNE_ASSOCIEE,
      ].includes(type),
    )
    .map((c) => c.code),
);

const anciensCodesIndex = new Map<string, string>();
for (const commune of communes as CommuneCOG[]) {
  const anciensCodes: string[] = commune.anciensCodes || [];
  for (const ancienCode of anciensCodes) {
    anciensCodesIndex.set(ancienCode, commune.code);
  }
}

export function isCommuneAncienne(codeCommune: string): boolean {
  return anciensCodesIndex.has(codeCommune);
}

export function isCommuneActuelle(codeCommune: string): boolean {
  return codesCommunesActuelles.has(codeCommune);
}

export function isCommuneDeleguee(codeCommune: string) {
  return codesCommunesDeleguees.has(codeCommune);
}

export function isCommune(codeCommune: string): boolean {
  return isCommuneActuelle(codeCommune) || isCommuneAncienne(codeCommune);
}

export function getCommuneActuelle(codeCommune: string): string | undefined {
  return anciensCodesIndex.has(codeCommune)
    ? anciensCodesIndex.get(codeCommune)
    : (communes as CommuneCOG[]).find(
        (c) => c.code === codeCommune && !c.chefLieu,
      )?.code;
}
