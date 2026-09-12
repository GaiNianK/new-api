package service

import (
	"fmt"

	"github.com/QuantumNous/new-api/dto"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/service/relayconvert"
	"github.com/QuantumNous/new-api/types"
	"github.com/gin-gonic/gin"
)

func init() {
	relayconvert.SetMediaResolver(relayconvert.MediaResolver{
		GetBase64Data:        GetBase64Data,
		DecodeBase64FileData: DecodeBase64FileData,
	})
}

func ConvertRequest(c *gin.Context, info *relaycommon.RelayInfo, target types.RelayFormat, request any) (*relayconvert.RequestResult, error) {
	result, err := relayconvert.ConvertRequest(c, info, target, request)
	if result != nil {
		info.RecordConversionDiagnostics(c, result.Diagnostics)
	}
	return result, err
}

func ConvertRequestByID(c *gin.Context, info *relaycommon.RelayInfo, converter string, request any) (*relayconvert.RequestResult, error) {
	result, err := relayconvert.ConvertRequestByID(c, info, converter, request)
	if result != nil {
		info.RecordConversionDiagnostics(c, result.Diagnostics)
	}
	return result, err
}

func ConvertRequestVia(c *gin.Context, info *relaycommon.RelayInfo, request any, path ...types.RelayFormat) (*relayconvert.RequestResult, error) {
	result, err := relayconvert.ConvertRequestVia(c, info, request, path...)
	if result != nil {
		info.RecordConversionDiagnostics(c, result.Diagnostics)
	}
	return result, err
}

func ClaudeToOpenAIRequest(claudeRequest dto.ClaudeRequest, info *relaycommon.RelayInfo) (*dto.GeneralOpenAIRequest, error) {
	result, err := ConvertRequest(nil, info, types.RelayFormatOpenAI, &claudeRequest)
	if err != nil {
		return nil, err
	}
	openAIRequest, ok := result.Value.(*dto.GeneralOpenAIRequest)
	if !ok {
		return nil, fmt.Errorf("expected OpenAI chat completions request, got %T", result.Value)
	}
	return openAIRequest, nil
}

func GeminiToOpenAIRequest(geminiRequest *dto.GeminiChatRequest, info *relaycommon.RelayInfo) (*dto.GeneralOpenAIRequest, error) {
	result, err := ConvertRequest(nil, info, types.RelayFormatOpenAI, geminiRequest)
	if err != nil {
		return nil, err
	}
	openAIRequest, ok := result.Value.(*dto.GeneralOpenAIRequest)
	if !ok {
		return nil, fmt.Errorf("expected OpenAI chat completions request, got %T", result.Value)
	}
	return openAIRequest, nil
}
