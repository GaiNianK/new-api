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

// GetUserUsableGroupsWithSetting applies the optional per-user model-group
// allowlist after the normal user-group rules have been evaluated.
func GetUserUsableGroupsWithSetting(userGroup string, userSetting dto.UserSetting) map[string]string {
	groupsCopy := setting.GetUserUsableGroupsCopy()
	if userGroup != "" {
		specialSettings, b := ratio_setting.GetGroupRatioSetting().GroupSpecialUsableGroup.Get(userGroup)
		if b {
			// 处理特殊可用分组
			for specialGroup, desc := range specialSettings {
				if strings.HasPrefix(specialGroup, "-:") {
					// 移除分组
					groupToRemove := strings.TrimPrefix(specialGroup, "-:")
					delete(groupsCopy, groupToRemove)
				} else if strings.HasPrefix(specialGroup, "+:") {
					// 添加分组
					groupToAdd := strings.TrimPrefix(specialGroup, "+:")
					groupsCopy[groupToAdd] = desc
				} else {
					// 直接添加分组
					groupsCopy[specialGroup] = desc
				}
			}
		}
		// 如果userGroup不在UserUsableGroups中，返回UserUsableGroups + userGroup
		if _, ok := groupsCopy[userGroup]; !ok {
			groupsCopy[userGroup] = "用户分组"
		}
	}
	allowed := NormalizeAllowedModelGroups(userSetting.AllowedModelGroups)
	if len(allowed) == 0 {
		return groupsCopy
	}

	allowedSet := make(map[string]struct{}, len(allowed))
	for _, group := range allowed {
		allowedSet[group] = struct{}{}
	}
	autoAllowed := false
	for _, autoGroup := range setting.GetAutoGroups() {
		if _, ok := groupsCopy[autoGroup]; !ok {
			continue
		}
		if _, ok := allowedSet[autoGroup]; ok {
			autoAllowed = true
			break
		}
	}
	for group := range groupsCopy {
		if group == "auto" {
			if !autoAllowed {
				delete(groupsCopy, group)
			}
			continue
		}
		if _, ok := allowedSet[group]; !ok {
			delete(groupsCopy, group)
		}
	}
	return groupsCopy
}

func GroupInUserUsableGroups(userGroup, groupName string) bool {
	_, ok := GetUserUsableGroups(userGroup)[groupName]
	return ok
}

func GroupInUserUsableGroupsWithSetting(userGroup, groupName string, userSetting dto.UserSetting) bool {
	_, ok := GetUserUsableGroupsWithSetting(userGroup, userSetting)[groupName]
	return ok
}

// GetUserAutoGroup 根据用户分组获取自动分组设置
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

// GetUserGroupRatio 获取用户使用某个分组的倍率
// userGroup 用户分组
// group 需要获取倍率的分组
func GetUserGroupRatio(userGroup, group string) float64 {
	ratio, ok := ratio_setting.GetGroupGroupRatio(userGroup, group)
	if ok {
		return ratio
	}
	return ratio_setting.GetGroupRatio(group)
}
