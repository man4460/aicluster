export const COMPENSATION_AGREEMENT_LINES = 7;

export type CompensationSettlementFields = {
  place: string;
  datedDay: string;
  datedMonth: string;
  datedYear: string;
  todayDate: string;
  time: string;
  party1: string;
  party2: string;
  complainant: string;
  suspect: string;
  charge: string;
  incidentDay: string;
  incidentTime: string;
  agreementNotes: string;
  signParty1: string;
  signParty1Paren: string;
  signParty2: string;
  signParty2Paren: string;
  signWitness1: string;
  signWitness1Paren: string;
  signWitness2: string;
  signWitness2Paren: string;
  signOfficer: string;
  signOfficerParen: string;
};

export function createEmptyCompensationSettlementFields(): CompensationSettlementFields {
  return {
    place: "",
    datedDay: "",
    datedMonth: "",
    datedYear: "",
    todayDate: "",
    time: "",
    party1: "",
    party2: "",
    complainant: "",
    suspect: "",
    charge: "",
    incidentDay: "",
    incidentTime: "",
    agreementNotes: "",
    signParty1: "",
    signParty1Paren: "",
    signParty2: "",
    signParty2Paren: "",
    signWitness1: "",
    signWitness1Paren: "",
    signWitness2: "",
    signWitness2Paren: "",
    signOfficer: "",
    signOfficerParen: "",
  };
}
