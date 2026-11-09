import type { components } from './schema'

// Short names for the types generated from openapi.json.
type Schemas = components['schemas']

export type Application = Schemas['Application']
export type ApplicationDetails = Schemas['ApplicationDetails']
export type DocumentKind = Schemas['DocumentKind']
export type Me = Schemas['Me']
export type PermitStatus = Schemas['PermitStatus']
export type RequiredDocument = Schemas['RequiredDocument']
export type RevocationPreview = Schemas['RevocationPreview']
export type Role = Schemas['Role']
export type StallType = Schemas['StallType']
export type TokenResponse = Schemas['TokenResponse']
export type Trader = Schemas['Trader']
export type TraderSearchResult = Schemas['TraderSearchResult']
export type TraderSummary = Schemas['TraderSummary']
export type TradingDay = Schemas['TradingDay']
export type UploadedDocument = Schemas['UploadedDocument']
