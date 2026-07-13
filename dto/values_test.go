package dto

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestIntValueAcceptsFloatDuration(t *testing.T) {
	var value IntValue
	require.NoError(t, value.UnmarshalJSON([]byte(`13.24`)))
	require.Equal(t, IntValue(13), value)
}

func TestIntValueAcceptsFloatStringDuration(t *testing.T) {
	var value IntValue
	require.NoError(t, value.UnmarshalJSON([]byte(`"6.62"`)))
	require.Equal(t, IntValue(6), value)
}
