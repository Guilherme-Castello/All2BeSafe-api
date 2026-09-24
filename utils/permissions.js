// Regras centrais de nível de acesso, reaproveitadas por templates e usuários.
export const SUPER_ADMIN_COMPANY = "0"
export const SUPER_ADMIN_LEVEL = "3"
export const COMPANY_ADMIN_MIN_LEVEL = 2

export function isSuperAdmin(user) {
  return String(user.company) === SUPER_ADMIN_COMPANY && String(user.access_level) === SUPER_ADMIN_LEVEL
}

export function isCompanyAdmin(user) {
  return Number(user.access_level) >= COMPANY_ADMIN_MIN_LEVEL
}

export function belongsToCompany(user, companyCode) {
  return Number(user.company) === Number(companyCode)
}
