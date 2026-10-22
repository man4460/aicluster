export type CasePhotoExtraPage = {
  id: string;
  imageUrl: string;
  caption: string;
};

export type CasePhotoFields = {
  caseNo: string;
  station: string;
  complainant: string;
  suspect: string;
  charge: string;
  incidentDateTime: string;
  incidentPlace: string;
  imageUrl: string;
  caption: string;
  extraPages: CasePhotoExtraPage[];
  signSuspect1: string;
  signSuspect2: string;
  signComplainant: string;
  signOfficer: string;
  officerPosition: string;
};

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyCasePhotoExtraPage(): CasePhotoExtraPage {
  return { id: newId("cph"), imageUrl: "", caption: "" };
}

export function createEmptyCasePhotoFields(): CasePhotoFields {
  return {
    caseNo: "",
    station: "",
    complainant: "",
    suspect: "",
    charge: "",
    incidentDateTime: "",
    incidentPlace: "",
    imageUrl: "",
    caption: "",
    extraPages: [],
    signSuspect1: "",
    signSuspect2: "",
    signComplainant: "",
    signOfficer: "",
    officerPosition: "",
  };
}
