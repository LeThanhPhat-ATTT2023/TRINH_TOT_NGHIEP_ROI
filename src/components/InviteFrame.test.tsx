// src/components/InviteFrame.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InviteFrame } from './InviteFrame'

describe('InviteFrame', () => {
  it('renders its children inside the decorative frame', () => {
    render(
      <InviteFrame>
        <p>Nội dung thiệp</p>
      </InviteFrame>
    )
    expect(screen.getByText('Nội dung thiệp')).toBeInTheDocument()
  })
})
