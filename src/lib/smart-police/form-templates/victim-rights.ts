export type VictimInvolvement = "" | "unrelated" | "related";

export type VictimRightsFields = {
  place: string;
  datedDay: string;
  datedMonth: string;
  datedYear: string;
  caseNumber: string;
  officerName: string;
  officerPosition: string;
  victimAddress: string;
  charge: string;
  caseBrief: string;
  involvement: VictimInvolvement;
  signVictim: string;
  signVictimParen: string;
  signOfficer: string;
  signOfficerParen: string;
  time: string;
  suspect: string;
  p2SignVictim: string;
  p2SignVictimParen: string;
  p2SignOfficer: string;
  p2SignOfficerParen: string;
  p2OfficerPosition: string;
  p2SignWitness: string;
  p2SignWitnessParen: string;
  note: string;
};

export function createEmptyVictimRightsFields(): VictimRightsFields {
  return {
    place: "",
    datedDay: "",
    datedMonth: "",
    datedYear: "",
    caseNumber: "",
    officerName: "",
    officerPosition: "",
    victimAddress: "",
    charge: "",
    caseBrief: "",
    involvement: "",
    signVictim: "",
    signVictimParen: "",
    signOfficer: "",
    signOfficerParen: "",
    time: "",
    suspect: "",
    p2SignVictim: "",
    p2SignVictimParen: "",
    p2SignOfficer: "",
    p2SignOfficerParen: "",
    p2OfficerPosition: "",
    p2SignWitness: "",
    p2SignWitnessParen: "",
    note: "",
  };
}
