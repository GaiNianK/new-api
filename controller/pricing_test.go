package controller

import (
	"testing"

	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBuildUserGroupRatiosUsesUserOverride(t *testing.T) {
	originalRatios := ratio_setting.GroupRatio2JSONString()
	t.Cleanup(func() {
		require.NoError(t, ratio_setting.UpdateGroupRatioByJSONString(originalRatios))
	})
	require.NoError(t, ratio_setting.UpdateGroupRatioByJSONString(`{"default":1,"hidden":2}`))

	setting := dto.UserSetting{GroupRatioOverrides: map[string]float64{"hidden": 0.5}}

	ratios := buildUserGroupRatios("default", setting)

	assert.Equal(t, 1.0, ratios["default"])
	assert.Equal(t, 0.5, ratios["hidden"])
}

func TestFilterPricingByUsableGroupsKeepsAllAndUsableGroups(t *testing.T) {
	pricing := []model.Pricing{
		{ModelName: "all-model", EnableGroup: []string{"all"}},
		{ModelName: "visible-model", EnableGroup: []string{"visible"}},
		{ModelName: "hidden-model", EnableGroup: []string{"hidden"}},
	}

	filtered := filterPricingByUsableGroups(pricing, map[string]string{"visible": "Visible"})

	require.Len(t, filtered, 2)
	assert.Equal(t, "all-model", filtered[0].ModelName)
	assert.Equal(t, "visible-model", filtered[1].ModelName)
}
