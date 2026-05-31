import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LoadingScreen from '../LoadingScreen';

describe('LoadingScreen Component', () => {
  it('renders the branding text correctly', () => {
    render(<LoadingScreen onFinish={vi.fn()} />);
    
    expect(screen.getByText('IPB Wellness Hub')).toBeInTheDocument();
    expect(screen.getByText('Preparing your experience')).toBeInTheDocument();
  });
});
