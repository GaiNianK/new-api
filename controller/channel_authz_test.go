package controller

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestChannelHasSensitiveChanges(t *testing.T) {
	baseURL := "https://api.example.com"
	headerOverride := `{"Authorization":"Bearer {api_key}"}`
	origin := &model.Channel{
		Type:           1,
		Key:            "old-key",
		BaseURL:        &baseURL,
		HeaderOverride: &headerOverride,
		Models:         "gpt-4o",
		Group:          "default",
	}

	t.Run("non-sensitive routing fields", func(t *testing.T) {
		updated := PatchChannel{Channel: *origin}
		updated.Models = "gpt-4o,gpt-4o-mini"
		updated.Group = "vip"

		assert.False(t, channelHasSensitiveChanges(&updated, origin, map[string]any{
			"models": updated.Models,
			"group":  updated.Group,
		}))
	})

	t.Run("key change", func(t *testing.T) {
		updated := PatchChannel{Channel: *origin}
		updated.Key = "new-key"

		assert.True(t, channelHasSensitiveChanges(&updated, origin, map[string]any{"key": updated.Key}))
	})

	t.Run("base url change", func(t *testing.T) {
		updated := PatchChannel{Channel: *origin}
		newBaseURL := "https://leak.example.com"
		updated.BaseURL = &newBaseURL

		assert.True(t, channelHasSensitiveChanges(&updated, origin, map[string]any{"base_url": newBaseURL}))
	})

	t.Run("header override change", func(t *testing.T) {
		updated := PatchChannel{Channel: *origin}
		newHeaderOverride := `{"X-Key":"{api_key}"}`
		updated.HeaderOverride = &newHeaderOverride

		assert.True(t, channelHasSensitiveChanges(&updated, origin, map[string]any{"header_override": newHeaderOverride}))
	})

	t.Run("omitted sensitive fields do not use zero values", func(t *testing.T) {
		updated := PatchChannel{}
		updated.Id = origin.Id
		updated.Priority = origin.Priority

		assert.False(t, channelHasSensitiveChanges(&updated, origin, map[string]any{"priority": 10}))
	})

	t.Run("unknown field fails closed", func(t *testing.T) {
		updated := PatchChannel{Channel: *origin}

		assert.True(t, channelHasSensitiveChanges(&updated, origin, map[string]any{"future_secret_field": "x"}))
	})

	t.Run("status is operational", func(t *testing.T) {
		updated := PatchChannel{Channel: *origin}
		updated.Status = common.ChannelStatusManuallyDisabled

		assert.False(t, channelHasSensitiveChanges(&updated, origin, map[string]any{"status": updated.Status}))
	})

	t.Run("read-only fields are ignored by sensitivity check", func(t *testing.T) {
		updated := PatchChannel{Channel: *origin}
		updated.Balance = 99
		updated.UsedQuota = 100
		updated.ResponseTime = 200

		assert.False(t, channelHasSensitiveChanges(&updated, origin, map[string]any{
			"balance":       updated.Balance,
			"used_quota":    updated.UsedQuota,
			"response_time": updated.ResponseTime,
		}))
	})
}

func TestClearChannelReadOnlyFields(t *testing.T) {
	channel := PatchChannel{Channel: model.Channel{
		CreatedTime:        11,
		TestTime:           22,
		ResponseTime:       33,
		Balance:            44.5,
		BalanceUpdatedTime: 55,
		UsedQuota:          66,
		Models:             "gpt-4o",
		Group:              "default",
	}}

	clearChannelReadOnlyFields(&channel, map[string]any{
		"created_time":         channel.CreatedTime,
		"test_time":            channel.TestTime,
		"response_time":        channel.ResponseTime,
		"balance":              channel.Balance,
		"balance_updated_time": channel.BalanceUpdatedTime,
		"used_quota":           channel.UsedQuota,
		"models":               channel.Models,
		"group":                channel.Group,
	})

	assert.Zero(t, channel.CreatedTime)
	assert.Zero(t, channel.TestTime)
	assert.Zero(t, channel.ResponseTime)
	assert.Zero(t, channel.Balance)
	assert.Zero(t, channel.BalanceUpdatedTime)
	assert.Zero(t, channel.UsedQuota)
	assert.Equal(t, "gpt-4o", channel.Models)
	assert.Equal(t, "default", channel.Group)
}

func TestUpdateChannelRejectsStatusField(t *testing.T) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(
		http.MethodPut,
		"/api/channel/",
		bytes.NewBufferString(`{"id":1,"status":2}`),
	)
	ctx.Request.Header.Set("Content-Type", "application/json")

	UpdateChannel(ctx)

	require.Equal(t, http.StatusOK, recorder.Code)
	var response struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
	}
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &response))
	assert.False(t, response.Success)
}

func TestChannelStatusValidation(t *testing.T) {
	assert.True(t, isManageableChannelStatus(common.ChannelStatusEnabled))
	assert.True(t, isManageableChannelStatus(common.ChannelStatusManuallyDisabled))
	assert.False(t, isManageableChannelStatus(common.ChannelStatusAutoDisabled))
	assert.False(t, isManageableChannelStatus(0))
}

func TestReadOnlyChannelScopeAndAPIAddressSanitization(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Set("role", common.RoleCommonUser)
	ctx.Set("id", 11)
	ctx.Set("user_group", "default")

	visibleURL := "https://visible.example.com"
	hiddenURL := "https://hidden.example.com"
	visible := &model.Channel{Group: "default,vip", BaseURL: &visibleURL}
	hidden := &model.Channel{Group: "default", BaseURL: &hiddenURL, HideAPIAddress: true}
	restricted := &model.Channel{Group: "private", BaseURL: &visibleURL}

	assert.True(t, channelIntersectsGroups(visible, map[string]string{"default": ""}))
	assert.False(t, channelIntersectsGroups(restricted, map[string]string{"default": ""}))

	sanitizeChannelForReader(ctx, visible)
	require.NotNil(t, visible.BaseURL)
	assert.Equal(t, visibleURL, *visible.BaseURL)

	sanitizeChannelForReader(ctx, hidden)
	require.NotNil(t, hidden.BaseURL)
	assert.Equal(t, hiddenAPIAddressPlaceholder, *hidden.BaseURL)
}

func TestGetAllChannelsForReadOnlyUserUsesAssignedGroupsAndSanitizesAPIAddress(t *testing.T) {
	setupModelListControllerTestDB(t)
	originalGroups := setting.UserUsableGroups2JSONString()
	originalRatios := ratio_setting.GroupRatio2JSONString()
	defer func() {
		require.NoError(t, setting.UpdateUserUsableGroupsByJSONString(originalGroups))
		require.NoError(t, ratio_setting.UpdateGroupRatioByJSONString(originalRatios))
	}()

	require.NoError(t, setting.UpdateUserUsableGroupsByJSONString(`{"public":"Public"}`))
	require.NoError(t, ratio_setting.UpdateGroupRatioByJSONString(`{"public":1,"hidden":1,"other":1}`))

	hiddenURL := "https://hidden.example.com"
	publicURL := "https://public.example.com"
	otherURL := "https://other.example.com"
	require.NoError(t, model.DB.Create([]model.Channel{
		{Id: 1, Name: "assigned-hidden", Type: constant.ChannelTypeOpenAI, Group: "hidden", BaseURL: &hiddenURL, HideAPIAddress: true, Status: common.ChannelStatusEnabled},
		{Id: 2, Name: "global-public", Type: constant.ChannelTypeOpenAI, Group: "public", BaseURL: &publicURL, Status: common.ChannelStatusEnabled},
		{Id: 3, Name: "unassigned-other", Type: constant.ChannelTypeOpenAI, Group: "other", BaseURL: &otherURL, Status: common.ChannelStatusEnabled},
	}).Error)

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/channel/?page_size=20", nil)
	ctx.Set("role", common.RoleCommonUser)
	ctx.Set("id", 42)
	common.SetContextKey(ctx, constant.ContextKeyUserSetting, dto.UserSetting{AllowedModelGroups: []string{"hidden"}})

	GetAllChannels(ctx)

	require.Equal(t, http.StatusOK, recorder.Code)
	var response struct {
		Success bool `json:"success"`
		Data    struct {
			Items []*model.Channel `json:"items"`
			Total int              `json:"total"`
		} `json:"data"`
	}
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &response))
	require.True(t, response.Success)
	require.Len(t, response.Data.Items, 1)
	assert.Equal(t, 1, response.Data.Total)
	assert.Equal(t, "assigned-hidden", response.Data.Items[0].Name)
	require.NotNil(t, response.Data.Items[0].BaseURL)
	assert.Equal(t, hiddenAPIAddressPlaceholder, *response.Data.Items[0].BaseURL)
}

func TestGetChannelForReadOnlyUserRejectsUnassignedChannelAndSanitizesVisibleChannel(t *testing.T) {
	setupModelListControllerTestDB(t)
	originalRatios := ratio_setting.GroupRatio2JSONString()
	defer func() {
		require.NoError(t, ratio_setting.UpdateGroupRatioByJSONString(originalRatios))
	}()

	require.NoError(t, ratio_setting.UpdateGroupRatioByJSONString(`{"hidden":1,"other":1}`))
	hiddenURL := "https://hidden.example.com"
	otherURL := "https://other.example.com"
	require.NoError(t, model.DB.Create([]model.Channel{
		{Id: 10, Name: "assigned-hidden", Type: constant.ChannelTypeOpenAI, Group: "hidden", BaseURL: &hiddenURL, HideAPIAddress: true, Status: common.ChannelStatusEnabled},
		{Id: 11, Name: "unassigned-other", Type: constant.ChannelTypeOpenAI, Group: "other", BaseURL: &otherURL, Status: common.ChannelStatusEnabled},
	}).Error)

	visibleRecorder := httptest.NewRecorder()
	visibleCtx, _ := gin.CreateTestContext(visibleRecorder)
	visibleCtx.Params = gin.Params{{Key: "id", Value: "10"}}
	visibleCtx.Set("role", common.RoleCommonUser)
	visibleCtx.Set("id", 42)
	common.SetContextKey(visibleCtx, constant.ContextKeyUserSetting, dto.UserSetting{AllowedModelGroups: []string{"hidden"}})

	GetChannel(visibleCtx)

	var visibleResponse struct {
		Success bool           `json:"success"`
		Data    *model.Channel `json:"data"`
	}
	require.NoError(t, common.Unmarshal(visibleRecorder.Body.Bytes(), &visibleResponse))
	require.True(t, visibleResponse.Success)
	require.NotNil(t, visibleResponse.Data)
	require.NotNil(t, visibleResponse.Data.BaseURL)
	assert.Equal(t, hiddenAPIAddressPlaceholder, *visibleResponse.Data.BaseURL)

	blockedRecorder := httptest.NewRecorder()
	blockedCtx, _ := gin.CreateTestContext(blockedRecorder)
	blockedCtx.Params = gin.Params{{Key: "id", Value: "11"}}
	blockedCtx.Set("role", common.RoleCommonUser)
	blockedCtx.Set("id", 42)
	common.SetContextKey(blockedCtx, constant.ContextKeyUserSetting, dto.UserSetting{AllowedModelGroups: []string{"hidden"}})

	GetChannel(blockedCtx)

	var blockedResponse struct {
		Success bool `json:"success"`
	}
	require.NoError(t, common.Unmarshal(blockedRecorder.Body.Bytes(), &blockedResponse))
	assert.False(t, blockedResponse.Success)
}

// TestChannelFieldsAreClassified guards the fail-closed sensitivity check: every
// JSON field of PatchChannel (including the embedded model.Channel) must be listed
// in channelSensitiveFields, channelNonSensitiveFields, or
// channelOperationalFields. A newly added field that is left unclassified will
// fail this test, forcing a conscious permission decision instead of silently
// defaulting either way.
func TestChannelFieldsAreClassified(t *testing.T) {
	classified := func(name string) bool {
		if _, ok := channelSensitiveFields[name]; ok {
			return true
		}
		if _, ok := channelNonSensitiveFields[name]; ok {
			return true
		}
		if _, ok := channelOperationalFields[name]; ok {
			return true
		}
		_, ok := channelReadOnlyFields[name]
		return ok
	}

	var collect func(rt reflect.Type) []string
	collect = func(rt reflect.Type) []string {
		var names []string
		for i := 0; i < rt.NumField(); i++ {
			field := rt.Field(i)
			if field.Anonymous && field.Type.Kind() == reflect.Struct {
				names = append(names, collect(field.Type)...)
				continue
			}
			name := strings.Split(field.Tag.Get("json"), ",")[0]
			if name == "" || name == "-" {
				continue
			}
			names = append(names, name)
		}
		return names
	}

	for _, name := range collect(reflect.TypeOf(PatchChannel{})) {
		assert.Truef(t, classified(name),
			"channel field %q is not classified; add it to channelSensitiveFields, channelNonSensitiveFields, channelOperationalFields, or channelReadOnlyFields in channel_authz.go", name)
	}
}
