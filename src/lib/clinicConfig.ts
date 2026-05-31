import firmaProfesional from '../images/Firma-Medica.jpg'

export const CLINIC_OWNER = {
  name: import.meta.env.VITE_CLINIC_OWNER_NAME ?? 'SSA Beauté',
  role: 'Cosmetóloga responsable',
  signatureSrc: firmaProfesional,
} as const
