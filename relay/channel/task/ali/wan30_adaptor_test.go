package ali

import (
	"testing"

	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/stretchr/testify/require"
)

func TestWan30VideoRequestDefaultsAndMedia(t *testing.T) {
	adaptor := &TaskAdaptor{}
	req := relaycommon.TaskSubmitReq{Model: Wan30VideoModel, Duration: 10, Metadata: map[string]interface{}{
		"input": map[string]interface{}{"media": []interface{}{
			map[string]interface{}{"type": "reference_video", "url": "https://example.com/ref.mp4"},
			map[string]interface{}{"type": "reference_audio", "url": "https://example.com/ref.wav"},
		}},
		"parameters": map[string]interface{}{"resolution": "480p", "ratio": "16:9", "duration": 10},
	}}

	got, err := adaptor.convertToAliRequest(testRelayInfo(), req)
	require.NoError(t, err)
	require.Equal(t, "480P", got.Parameters.Resolution)
	require.Equal(t, "16:9", got.Parameters.Ratio)
	require.Equal(t, 10, got.Parameters.Duration)
	require.Equal(t, []AliVideoMedia{
		{Type: "reference_video", URL: "https://example.com/ref.mp4"},
		{Type: "reference_audio", URL: "https://example.com/ref.wav"},
	}, got.Input.Media)
}

func TestWan30VideoRequestRejectsInvalidParameters(t *testing.T) {
	adaptor := &TaskAdaptor{}
	_, err := adaptor.convertToAliRequest(testRelayInfo(), relaycommon.TaskSubmitReq{
		Model: Wan30VideoModel, Duration: 31, Prompt: "test",
	})
	require.Error(t, err)

	_, err = adaptor.convertToAliRequest(testRelayInfo(), relaycommon.TaskSubmitReq{
		Model: Wan30VideoModel, Duration: 10, Prompt: "test",
		Metadata: map[string]interface{}{
			"parameters": map[string]interface{}{"resolution": "4K"},
		},
	})
	require.Error(t, err)
}

func TestParseTaskResultCapturesOutputDuration(t *testing.T) {
	adaptor := &TaskAdaptor{}
	result, err := adaptor.ParseTaskResult([]byte(`{
		"output":{"task_status":"SUCCEEDED","video_url":"https://example.com/result.mp4"},
		"usage":{"output_video_duration":12.5}
	}`))

	require.NoError(t, err)
	require.Equal(t, 12.5, result.DurationSeconds)
}
