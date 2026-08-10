package relay

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestWithoutTaskResolutionRatios(t *testing.T) {
	ratios := withoutTaskResolutionRatios(map[string]float64{
		"seconds":          8,
		"size":             1.5,
		"resolution":       2,
		"resolution-1080p": 1.8,
		"quality":          1.2,
	})

	assert.Equal(t, map[string]float64{
		"seconds": 8,
		"quality": 1.2,
	}, ratios)
}
