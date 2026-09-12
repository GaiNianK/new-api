package setting

import (
	"fmt"
	"slices"
	"strconv"
	"sync/atomic"

	"github.com/QuantumNous/new-api/common"
)

var autoGroups = []string{
	"default",
}

var DefaultUseAutoGroup = false

func ContainsAutoGroup(group string) bool {
	return slices.Contains(autoGroups, group)
}

func UpdateAutoGroupsByJsonString(jsonString string) error {
	autoGroups = make([]string, 0)
	return common.Unmarshal([]byte(jsonString), &autoGroups)
}

func AutoGroups2JsonString() string {
	jsonBytes, err := common.Marshal(autoGroups)
	if err != nil {
		return "[]"
	}
	return string(jsonBytes)
}

func GetAutoGroups() []string {
	return autoGroups
}
