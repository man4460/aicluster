export type SceneMapExtraPage = {
  id: string;
  mapImageUrl: string;
  notes: string;
};

export type SceneMapFields = {
  caseBetween: string;
  complainantLine: string;
  suspectLine: string;
  chargeText: string;
  location: string;
  moo: string;
  alley: string;
  road: string;
  tambon: string;
  amphoe: string;
  province: string;
  day: string;
  month: string;
  yearBe: string;
  approxTime: string;
  notes: string;
  mapImageUrl: string;
  extraPages: SceneMapExtraPage[];
  signComplainant: string;
  signSuspect1: string;
  signSuspect2: string;
  signWitness1: string;
  signWitness2: string;
  signOfficer: string;
  signOfficerParen: string;
  signOfficerPosition: string;
};

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptySceneMapExtraPage(): SceneMapExtraPage {
  return { id: newId("smap"), mapImageUrl: "", notes: "" };
}

export function createEmptySceneMapFields(): SceneMapFields {
  return {
    caseBetween: "",
    complainantLine: "",
    suspectLine: "",
    chargeText: "",
    location: "",
    moo: "",
    alley: "",
    road: "",
    tambon: "",
    amphoe: "",
    province: "",
    day: "",
    month: "",
    yearBe: "",
    approxTime: "",
    notes: "",
    mapImageUrl: "",
    extraPages: [],
    signComplainant: "",
    signSuspect1: "",
    signSuspect2: "",
    signWitness1: "",
    signWitness2: "",
    signOfficer: "",
    signOfficerParen: "",
    signOfficerPosition: "",
  };
}
