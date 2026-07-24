import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  transformFormDataToPayload,
  USER_FORM_DEFAULT_VALUES,
} from './user-form'

const baseUpdateValues = {
  ...USER_FORM_DEFAULT_VALUES,
  username: 'alice',
  display_name: 'Alice',
  group: 'default',
  allowed_model_groups: ['vip', 'hidden'],
}

describe('user form payload transform', () => {
  test('keeps only valid ratio overrides for assigned groups', () => {
    const payload = transformFormDataToPayload(
      {
        ...baseUpdateValues,
        group_ratio_overrides: {
          vip: 2,
          hidden: 0,
          unassigned: 3,
          invalid: Number.NaN,
        },
      },
      12
    )

    assert.equal(
      payload.setting,
      JSON.stringify({
        group_ratio_overrides: {
          vip: 2,
          hidden: 0,
        },
      })
    )
  })

  test('sends an empty override map when ratios are cleared', () => {
    const payload = transformFormDataToPayload(
      {
        ...baseUpdateValues,
        group_ratio_overrides: {},
      },
      12
    )

    assert.equal(
      payload.setting,
      JSON.stringify({
        group_ratio_overrides: {},
      })
    )
  })
})
