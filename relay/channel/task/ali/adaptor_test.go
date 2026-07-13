package ali

import (
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/stretchr/testify/require"
)

func testRelayInfo() *relaycommon.RelayInfo {
	return &relaycommon.RelayInfo{
		ChannelMeta: &relaycommon.ChannelMeta{},
	}
}

func TestConvertToAliRequestWan27I2VBuildsMediaFromImage(t *testing.T) {
	adaptor := &TaskAdaptor{}
	req := relaycommon.TaskSubmitReq{
		Model:    "wan2.7-i2v",
		Prompt:   "animate the first frame",
		Image:    "https://example.com/first.png",
		Size:     "720p",
		Duration: 10,
	}

	aliReq, err := adaptor.convertToAliRequest(testRelayInfo(), req)

	require.NoError(t, err)
	require.Equal(t, "wan2.7-i2v", aliReq.Model)
	require.Equal(t, "720P", aliReq.Parameters.Resolution)
	require.Equal(t, 10, aliReq.Parameters.Duration)
	require.Equal(t, []AliVideoMedia{
		{Type: "first_frame", URL: "https://example.com/first.png"},
	}, aliReq.Input.Media)
	require.Empty(t, aliReq.Input.ImgURL)

	body, err := common.Marshal(aliReq)
	require.NoError(t, err)
	require.Contains(t, string(body), `"media"`)
	require.NotContains(t, string(body), `"img_url"`)
}

func TestConvertToAliRequestWan27I2VBuildsFirstAndLastFrameFromImages(t *testing.T) {
	adaptor := &TaskAdaptor{}
	req := relaycommon.TaskSubmitReq{
		Model:  "wan2.7-i2v",
		Prompt: "interpolate between frames",
		Images: []string{
			"https://example.com/first.png",
			"https://example.com/last.png",
		},
	}

	aliReq, err := adaptor.convertToAliRequest(testRelayInfo(), req)

	require.NoError(t, err)
	require.Equal(t, []AliVideoMedia{
		{Type: "first_frame", URL: "https://example.com/first.png"},
		{Type: "last_frame", URL: "https://example.com/last.png"},
	}, aliReq.Input.Media)
}

func TestConvertToAliRequestWan27I2VPrefersImageBeforeImagesAndInputReference(t *testing.T) {
	adaptor := &TaskAdaptor{}
	req := relaycommon.TaskSubmitReq{
		Model:          "wan2.7-i2v",
		Prompt:         "use the direct image",
		Image:          " https://example.com/direct.png ",
		Images:         []string{"https://example.com/images-first.png", " https://example.com/images-last.png "},
		InputReference: "https://example.com/input-reference.png",
	}

	aliReq, err := adaptor.convertToAliRequest(testRelayInfo(), req)

	require.NoError(t, err)
	require.Equal(t, []AliVideoMedia{
		{Type: "first_frame", URL: "https://example.com/direct.png"},
		{Type: "last_frame", URL: "https://example.com/images-last.png"},
	}, aliReq.Input.Media)
}

func TestConvertToAliRequestWan27I2VFallsBackToFirstNonEmptyImage(t *testing.T) {
	adaptor := &TaskAdaptor{}
	req := relaycommon.TaskSubmitReq{
		Model:  "wan2.7-i2v",
		Prompt: "skip blank images",
		Image:  " ",
		Images: []string{
			" ",
			" https://example.com/first.png ",
			" https://example.com/last.png ",
		},
		InputReference: "https://example.com/input-reference.png",
	}

	aliReq, err := adaptor.convertToAliRequest(testRelayInfo(), req)

	require.NoError(t, err)
	require.Equal(t, []AliVideoMedia{
		{Type: "first_frame", URL: "https://example.com/first.png"},
		{Type: "last_frame", URL: "https://example.com/last.png"},
	}, aliReq.Input.Media)
}

func TestConvertToAliRequestWan27I2VKeepsExplicitMetadataMedia(t *testing.T) {
	adaptor := &TaskAdaptor{}
	req := relaycommon.TaskSubmitReq{
		Model:          "wan2.7-i2v",
		Prompt:         "continue the clip",
		Image:          "https://example.com/direct.png",
		Images:         []string{"https://example.com/images-first.png", "https://example.com/images-last.png"},
		InputReference: "https://example.com/input-reference.png",
		Metadata: map[string]interface{}{
			"input": map[string]interface{}{
				"media": []interface{}{
					map[string]interface{}{
						"type": "first_clip",
						"url":  "https://example.com/input.mp4",
					},
				},
			},
		},
	}

	aliReq, err := adaptor.convertToAliRequest(testRelayInfo(), req)

	require.NoError(t, err)
	require.Equal(t, []AliVideoMedia{
		{Type: "first_clip", URL: "https://example.com/input.mp4"},
	}, aliReq.Input.Media)
	require.Empty(t, aliReq.Input.ImgURL)

	body, err := common.Marshal(aliReq)
	require.NoError(t, err)
	require.Contains(t, string(body), `"media"`)
	require.NotContains(t, string(body), `"img_url"`)
}

func TestConvertToAliRequestWan27I2VRequiresMedia(t *testing.T) {
	adaptor := &TaskAdaptor{}
	req := relaycommon.TaskSubmitReq{
		Model:  "wan2.7-i2v",
		Prompt: "animate without a frame",
	}

	_, err := adaptor.convertToAliRequest(testRelayInfo(), req)

	require.Error(t, err)
	require.True(t, strings.Contains(err.Error(), "requires image"))
}

func TestConvertToAliRequestWan25I2VKeepsLegacyImgURL(t *testing.T) {
	adaptor := &TaskAdaptor{}
	req := relaycommon.TaskSubmitReq{
		Model:  "wan2.5-i2v-preview",
		Prompt: "animate the first frame",
		Image:  "https://example.com/first.png",
	}

	aliReq, err := adaptor.convertToAliRequest(testRelayInfo(), req)

	require.NoError(t, err)
	require.Equal(t, "https://example.com/first.png", aliReq.Input.ImgURL)
	require.Empty(t, aliReq.Input.Media)

	body, err := common.Marshal(aliReq)
	require.NoError(t, err)
	require.Contains(t, string(body), `"img_url"`)
	require.NotContains(t, string(body), `"media"`)
}

func TestConvertToAliRequestHappyHorseI2V(t *testing.T) {
	adaptor := &TaskAdaptor{}
	req := relaycommon.TaskSubmitReq{Model: "happyhorse-1.1-i2v", Prompt: "animate", Image: "https://example.com/horse.png", Size: "720p", Duration: 8}
	aliReq, err := adaptor.convertToAliRequest(testRelayInfo(), req)
	require.NoError(t, err)
	require.Equal(t, "720P", aliReq.Parameters.Resolution)
	require.Equal(t, 8, aliReq.Parameters.Duration)
	require.Equal(t, []AliVideoMedia{{Type: "first_frame", URL: "https://example.com/horse.png"}}, aliReq.Input.Media)
}

func TestConvertToAliRequestHappyHorseR2V(t *testing.T) {
	adaptor := &TaskAdaptor{}
	req := relaycommon.TaskSubmitReq{Model: "happyhorse-1.1-r2v", Prompt: "combine", Images: []string{"https://example.com/a.png", "https://example.com/b.png"}}
	aliReq, err := adaptor.convertToAliRequest(testRelayInfo(), req)
	require.NoError(t, err)
	require.Equal(t, "1080P", aliReq.Parameters.Resolution)
	require.Equal(t, []AliVideoMedia{{Type: "reference_image", URL: "https://example.com/a.png"}, {Type: "reference_image", URL: "https://example.com/b.png"}}, aliReq.Input.Media)
}

func TestConvertToAliRequestHappyHorseVideoEdit(t *testing.T) {
	adaptor := &TaskAdaptor{}
	req := relaycommon.TaskSubmitReq{Model: "happyhorse-1.0-video-edit", Prompt: "edit", InputReference: "https://example.com/input.mp4", Images: []string{"https://example.com/ref.png"}}
	aliReq, err := adaptor.convertToAliRequest(testRelayInfo(), req)
	require.NoError(t, err)
	require.Equal(t, []AliVideoMedia{{Type: "video", URL: "https://example.com/input.mp4"}, {Type: "reference_image", URL: "https://example.com/ref.png"}}, aliReq.Input.Media)
}

func TestProcessAliOtherRatiosHappyHorse(t *testing.T) {
	ratios, err := ProcessAliOtherRatios(&AliVideoRequest{Model: "happyhorse-1.1-t2v", Parameters: &AliVideoParameters{Resolution: "1080P"}})
	require.NoError(t, err)
	require.InDelta(t, 1.2/0.9, ratios["resolution-1080P"], 0.000001)
}
