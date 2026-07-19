package service

import (
	"testing"

	"github.com/QuantumNous/new-api/dto"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetUserUsableGroupsWithSettingPreservesLegacyBehaviorWhenUnset(t *testing.T) {
	legacy := GetUserUsableGroups("default")
	withEmptySetting := GetUserUsableGroupsWithSetting("default", dto.UserSetting{})

	assert.Equal(t, legacy, withEmptySetting)
}

func TestGetUserUsableGroupsWithSettingFiltersModelGroups(t *testing.T) {
	groups := GetUserUsableGroupsWithSetting("default", dto.UserSetting{
		AllowedModelGroups: []string{" vip ", "vip", ""},
	})

	_, allowed := groups["vip"]
	_, denied := groups["default"]
	require.True(t, allowed)
	require.False(t, denied)
}
