export const PATIENT_STORAGE_KEY = "metamap.patient";
export const ANALYSIS_STORAGE_KEY = "metamap.latest-analysis";

export type PatientRegistrationInput = {
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone?: string;
  gender?: string;
  address?: string;
  notes?: string;
};

export type PatientProfile = PatientRegistrationInput & {
  patientId: string;
  age: number | null;
  createdAt: string;
};

export function createPatientId() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PAT-${Date.now()}-${random}`;
}

export function calculateAge(dateOfBirth: string) {
  if (!dateOfBirth) {
    return null;
  }

  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();

  if (
    monthDelta < 0 ||
    (monthDelta === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function buildPatientProfile(
  input: PatientRegistrationInput,
): PatientProfile {
  return {
    ...input,
    patientId: createPatientId(),
    age: calculateAge(input.dateOfBirth),
    createdAt: new Date().toISOString(),
  };
}
