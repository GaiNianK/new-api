package relay

import (
	"testing"

	"github.com/QuantumNous/new-api/constant"
	"github.com/stretchr/testify/assert"
)

func TestGetAdaptorSupportsEveryAPIType(t *testing.T) {
	for apiType := 0; apiType < constant.APITypeDummy; apiType++ {
		if apiType == constant.APITypeAIProxyLibrary {
			continue
		}
		assert.NotNil(t, GetAdaptor(apiType), "API type %d has no adaptor", apiType)
	}
}
