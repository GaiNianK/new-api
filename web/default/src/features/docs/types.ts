/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
export const API_DOCUMENTATION_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
] as const

export const API_DOCUMENTATION_LANGUAGES = [
  'curl',
  'python',
  'typescript',
  'javascript',
] as const

export type ApiDocumentationMethod = (typeof API_DOCUMENTATION_METHODS)[number]
export type ApiDocumentationLanguage =
  (typeof API_DOCUMENTATION_LANGUAGES)[number]

export type ApiDocumentationParameter = {
  id: string
  name: string
  type: string
  required: boolean
  default_value?: string
  description?: string
}

export type ApiDocumentationEntry = {
  id: string
  slug: string
  title: string
  category?: string
  provider?: string
  model?: string
  description?: string
  base_url?: string
  method: ApiDocumentationMethod
  path: string
  authentication?: string
  published: boolean
  code_samples?: Partial<Record<ApiDocumentationLanguage, string>>
  parameters?: ApiDocumentationParameter[]
  response_example?: string
  notes?: string
}

export type ApiDocumentationResponse = {
  success: boolean
  message: string
  data: ApiDocumentationEntry[]
}
