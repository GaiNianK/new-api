package controller

import (
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/service/authz"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const hiddenAPIAddressPlaceholder = "***hidden***"

func isFullChannelAdmin(c *gin.Context) bool {
	role := c.GetInt("role")
	if role == common.RoleRootUser {
		return true
	}
	return authz.Can(c.GetInt("id"), role, authz.ChannelWrite) || authz.Can(c.GetInt("id"), role, authz.ChannelSensitiveWrite)
}

func channelReadScope(c *gin.Context) (bool, map[string]string) {
	if isFullChannelAdmin(c) {
		return false, nil
	}
	userSetting, ok := common.GetContextKeyType[dto.UserSetting](c, constant.ContextKeyUserSetting)
	if !ok {
		setting, err := model.GetUserSetting(c.GetInt("id"), false)
		if err == nil {
			userSetting = setting
		}
	}
	userGroup := common.GetContextKeyString(c, constant.ContextKeyUserGroup)
	if userGroup == "" {
		if group, err := model.GetUserGroup(c.GetInt("id"), false); err == nil {
			userGroup = group
		}
	}
	return true, service.GetUserUsableGroupsWithSetting(userGroup, userSetting)
}

func channelIntersectsGroups(channel *model.Channel, groups map[string]string) bool {
	if channel == nil || len(groups) == 0 {
		return false
	}
	for _, group := range channel.GetGroups() {
		if _, ok := groups[strings.TrimSpace(group)]; ok {
			return true
		}
	}
	return false
}

func channelReadScopeQuery(c *gin.Context, query *gorm.DB) *gorm.DB {
	restricted, groups := channelReadScope(c)
	if !restricted {
		return query
	}
	if len(groups) == 0 {
		return query.Where("1 = 0")
	}
	return model.ApplyChannelGroupsAnyFilter(query, groups)
}

func channelVisibleToReader(c *gin.Context, channel *model.Channel) bool {
	restricted, groups := channelReadScope(c)
	if !restricted {
		return true
	}
	return channelIntersectsGroups(channel, groups)
}

func sanitizeChannelForReader(c *gin.Context, channel *model.Channel) {
	if channel == nil {
		return
	}
	clearChannelInfo(channel)
	if isFullChannelAdmin(c) {
		return
	}
	channel.Key = ""
	if channel.HideAPIAddress && channel.BaseURL != nil && *channel.BaseURL != "" {
		hidden := hiddenAPIAddressPlaceholder
		channel.BaseURL = &hidden
	}
}

func sanitizeChannelsForReader(c *gin.Context, channels []*model.Channel) {
	for _, channel := range channels {
		sanitizeChannelForReader(c, channel)
	}
}
