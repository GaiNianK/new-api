package constant

import "github.com/QuantumNous/new-api/relaykit/types"

// Finish reasons moved to relaykit with the shared conversion types.
var (
	FinishReasonStop          = types.FinishReasonStop
	FinishReasonToolCalls     = types.FinishReasonToolCalls
	FinishReasonLength        = types.FinishReasonLength
	FinishReasonFunctionCall  = types.FinishReasonFunctionCall
	FinishReasonContentFilter = types.FinishReasonContentFilter
)
