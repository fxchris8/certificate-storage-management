export interface CrewRegisterInput {
  seafarercode: string;
  name: string;
  password: string;
}

export interface CrewLoginInput {
  seafarercode: string;
  password: string;
}

export interface CreateCrewSubmissionInput {
  certificateName: string;
  nomorSertifikat: string;
}

export interface CrewTokenPayload {
  personId: string;
  tokenType: 'crew';
}