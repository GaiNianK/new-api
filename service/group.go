package service

import (
	"strings"

	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
)

func GetUserUsableGroups(userGroup string) map[string]string {
	return GetUserUsableGroupsWithSetting(userGroup, dto.UserSetting{})
}

// GetUserUsableGroupsWithSetting returns groups available to a user. An empty
// allowlist preserves the legacy user-group behavior. A non-empty allowlist
// combines globally selectable groups with administrator-assigned groups.
func GetUserUsableGroupsWithSetting(userGroup string, userSetting dto.UserSetting) map[string]string {
	globalGroups := setting.GetUserUsableGroupsCopy()
	groupsCopy := make(map[string]string, len(globalGroups))
	for group, desc := range globalGroups {
		groupsCopy[group] = desc
	}
	validGroups := ratio_setting.GetGroupRatioCopy()
	if userGroup != "" {
		if specialSettings, ok := ratio_setting.GetGroupRatioSetting().GroupSpecialUsableGroup.Get(userGroup); ok {
			for specialGroup, desc := range specialSettings {
				switch {
				case strings.HasPrefix(specialGroup, "-:"):
					delete(groupsCopy, strings.TrimPrefix(specialGroup, "-:"))
				case strings.HasPrefix(specialGroup, "+:"):
					groupsCopy[strings.TrimPrefix(specialGroup, "+:")] = desc
				default:
					groupsCopy[specialGroup] = desc
				}
			}
		}
		if _, ok := groupsCopy[userGroup]; !ok {
			groupsCopy[userGroup] = "用户分组"
		}
	}

	allowed := NormalizeAllowedModelGroups(userSetting.AllowedModelGroups)
	if len(allowed) == 0 {
		return filterValidUserGroups(groupsCopy, validGroups)
	}

	result := make(map[string]string, len(globalGroups)+len(allowed))
	for group, desc := range globalGroups {
		if _, ok := validGroups[group]; ok {
			result[group] = desc
		}
	}
	for _, group := range allowed {
		if _, ok := validGroups[group]; ok {
			result[group] = setting.GetUsableGroupDescription(group)
		}
	}
	if _, ok := groupsCopy["auto"]; ok && autoGroupAllowed(result) {
		result["auto"] = groupsCopy["auto"]
	}
	return result
}

// GetUserAssignedModelGroupsWithSetting returns only the real model groups explicitly assigned by an administrator.
// Unlike GetUserUsableGroupsWithSetting, it intentionally excludes globally user-selectable groups.
func GetUserAssignedModelGroupsWithSetting(userSetting dto.UserSetting) map[string]string {
	allowed := NormalizeAllowedModelGroups(userSetting.AllowedModelGroups)
	if len(allowed) == 0 {
		return map[string]string{}
	}
	validGroups := ratio_setting.GetGroupRatioCopy()
	result := make(map[string]string, len(allowed))
	for _, group := range allowed {
		if _, ok := validGroups[group]; ok {
			result[group] = setting.GetUsableGroupDescription(group)
		}
	}
	return result
}

func filterValidUserGroups(groups map[string]string, validGroups map[string]float64) map[string]string {
	result := make(map[string]string, len(groups))
	for group, desc := range groups {
		if group == "auto" {
			result[group] = desc
			continue
		}
		if _, ok := validGroups[group]; ok {
			result[group] = desc
		}
	}
	return result
}

func autoGroupAllowed(groups map[string]string) bool {
	for _, autoGroup := range setting.GetAutoGroups() {
		if _, ok := groups[autoGroup]; ok {
			return true
		}
	}
	return false
}

func GroupInUserUsableGroups(userGroup, groupName string) bool {
	_, ok := GetUserUsableGroups(userGroup)[groupName]
	return ok
}

func GroupInUserUsableGroupsWithSetting(userGroup, groupName string, userSetting dto.UserSetting) bool {
	_, ok := GetUserUsableGroupsWithSetting(userGroup, userSetting)[groupName]
	return ok
}

func GetUserAutoGroup(userGroup string) []string {
	return GetUserAutoGroupWithSetting(userGroup, dto.UserSetting{})
}

func GetUserAutoGroupWithSetting(userGroup string, userSetting dto.UserSetting) []string {
	groups := GetUserUsableGroupsWithSetting(userGroup, userSetting)
	autoGroups := make([]string, 0)
	for _, group := range setting.GetAutoGroups() {
		if _, ok := groups[group]; ok {
			autoGroups = append(autoGroups, group)
		}
	}
	return autoGroups
}

func NormalizeAllowedModelGroups(groups []string) []string {
	if len(groups) == 0 {
		return nil
	}
	result := make([]string, 0, len(groups))
	seen := make(map[string]struct{}, len(groups))
	for _, group := range groups {
		group = strings.TrimSpace(group)
		if group == "" {
			continue
		}
		if _, ok := seen[group]; ok {
			continue
		}
		seen[group] = struct{}{}
		result = append(result, group)
	}
	return result
}

func GetUserGroupRatio(userGroup, group string) float64 {
	ratio, ok := ratio_setting.GetGroupGroupRatio(userGroup, group)
	if ok {
		return ratio
	}
	return ratio_setting.GetGroupRatio(group)
}

func GetUserGroupRatioWithSetting(userGroup, group string, userSetting dto.UserSetting) float64 {
	if overrideRatio, ok := UserGroupRatioOverride(userSetting, group); ok {
		return overrideRatio
	}
	return GetUserGroupRatio(userGroup, group)
}
