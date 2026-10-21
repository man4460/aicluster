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
  signComplainant: string;
  signSuspect1: string;
  signSuspect2: string;
  signWitness1: string;
  signWitness2: string;
  signOfficer: string;
  signOfficerParen: string;
  signOfficerPosition: string;
};

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
