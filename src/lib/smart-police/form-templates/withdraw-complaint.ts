export type WithdrawComplaintFields = {
  docNo: string;
  datedDay: string;
  datedMonth: string;
  datedYear: string;
  victimName: string;
  victimName2: string;
  charge: string;
  charge2: string;
  dailyLogItem: string;
  reportTime: string;
  reportDay: string;
  reportMonth: string;
  reportYear: string;
  suspect: string;
  suspect2: string;
  reason: string;
  withdrawNote: string;
  withdrawNote2: string;
  signWithdrawer: string;
  signWithdrawerParen: string;
  signSuspect: string;
  signSuspectParen: string;
  signWitness: string;
  signWitnessParen: string;
  signOfficer: string;
  signOfficerParen: string;
  signOfficerPosition: string;
};

export function createEmptyWithdrawComplaintFields(): WithdrawComplaintFields {
  return {
    docNo: "",
    datedDay: "",
    datedMonth: "",
    datedYear: "",
    victimName: "",
    victimName2: "",
    charge: "",
    charge2: "",
    dailyLogItem: "",
    reportTime: "",
    reportDay: "",
    reportMonth: "",
    reportYear: "",
    suspect: "",
    suspect2: "",
    reason: "",
    withdrawNote: "",
    withdrawNote2: "",
    signWithdrawer: "",
    signWithdrawerParen: "",
    signSuspect: "",
    signSuspectParen: "",
    signWitness: "",
    signWitnessParen: "",
    signOfficer: "",
    signOfficerParen: "",
    signOfficerPosition: "",
  };
}
